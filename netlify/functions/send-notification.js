// ─────────────────────────────────────────────────────────────
//  Netlify Function: send-notification
//  Sends FCM push to a household member, respecting their prefs.
// ─────────────────────────────────────────────────────────────
const headers = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: 'Method not allowed' };

  let member, title, body, data;
  try {
    ({ member, title, body, data } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const supabaseUrl       = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey       = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const projectId         = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!supabaseUrl || !supabaseKey || !projectId || !serviceAccountKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  // 1. Check recipient's notification prefs before sending
  if (data?.prefKey) {
    try {
      const prefResp = await fetch(
        `${supabaseUrl}/rest/v1/notification_prefs?member=eq.${member}&select=${data.prefKey}`,
        { headers: sbHeaders }
      );
      const prefData = await prefResp.json();
      if (prefData?.[0]?.[data.prefKey] === false) {
        return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, reason: 'Pref disabled' }) };
      }
    } catch { /* pref check failure — proceed with send */ }
  }

  // 2. Look up FCM tokens for this member
  const tokenResp = await fetch(
    `${supabaseUrl}/rest/v1/fcm_tokens?member=eq.${member}&select=token`,
    { headers: sbHeaders }
  );
  const tokens = await tokenResp.json();
  if (!tokens?.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, reason: 'No tokens for member' }) };
  }

  // 3. Get Google OAuth2 access token via service account
  let accessToken;
  try {
    accessToken = await getGoogleAccessToken(JSON.parse(serviceAccountKey));
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service account error: ' + e.message }) };
  }

  // 4. Send FCM to each token
  let sent = 0;
  const staleTokens = [];

  await Promise.all(tokens.map(async ({ token }) => {
    const resp = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: data ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)])
            ) : {},
            webpush: {
              notification: {
                title, body,
                icon:    '/icons/icon-192x192.png',
                badge:   '/icons/icon-96x96.png',
                vibrate: [200, 100, 200],
              },
              fcm_options: { link: '/' },
            },
          },
        }),
      }
    );

    if (resp.ok) {
      sent++;
    } else {
      const err = await resp.json().catch(() => ({}));
      if (err.error?.details?.[0]?.errorCode === 'UNREGISTERED') staleTokens.push(token);
    }
  }));

  // 5. Clean up stale tokens
  if (staleTokens.length) {
    const ids = staleTokens.map(t => `"${t}"`).join(',');
    await fetch(`${supabaseUrl}/rest/v1/fcm_tokens?token=in.(${ids})`,
      { method: 'DELETE', headers: sbHeaders });
  }

  return { statusCode: 200, headers, body: JSON.stringify({ sent }) };
};

async function getGoogleAccessToken(serviceAccount) {
  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claim));
  const signing = `${header}.${payload}`;
  const key     = await importPrivateKey(serviceAccount.private_key);
  const sig     = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(signing));
  const jwt     = `${signing}.${b64url(sig)}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const d = await resp.json();
  if (!d.access_token) throw new Error(d.error_description || 'Token fetch failed');
  return d.access_token;
}

function b64url(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importPrivateKey(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der  = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}
