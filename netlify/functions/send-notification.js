// ─────────────────────────────────────────────────────────────
//  Netlify Function: send-notification
//  Sends an FCM push notification to all registered devices
//  for a given household member.
//
//  Required env vars:
//    REACT_APP_FIREBASE_PROJECT_ID
//    REACT_APP_SUPABASE_URL
//    REACT_APP_SUPABASE_ANON_KEY
//    FIREBASE_SERVICE_ACCOUNT_KEY  (JSON string of service account)
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

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const projectId   = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!supabaseUrl || !supabaseKey || !projectId || !serviceAccountKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  // 1. Look up FCM tokens for this member from Supabase
  const tokenResp = await fetch(
    `${supabaseUrl}/rest/v1/fcm_tokens?member=eq.${member}&select=token`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const tokens = await tokenResp.json();
  if (!tokens.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, reason: 'No tokens for member' }) };
  }

  // 2. Get a Google OAuth2 access token using the service account
  let accessToken;
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    accessToken = await getGoogleAccessToken(serviceAccount);
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service account error: ' + e.message }) };
  }

  // 3. Send FCM message to each token
  let sent = 0;
  const staleTokens = [];

  await Promise.all(tokens.map(async ({ token }) => {
    const resp = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
            webpush: {
              notification: {
                title, body,
                icon:  '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
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
      // Remove stale/unregistered tokens
      if (err.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
        staleTokens.push(token);
      }
    }
  }));

  // Clean up stale tokens
  if (staleTokens.length) {
    await fetch(
      `${supabaseUrl}/rest/v1/fcm_tokens?token=in.(${staleTokens.map(t => `"${t}"`).join(',')})`,
      { method: 'DELETE', headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
  }

  return { statusCode: 200, headers, body: JSON.stringify({ sent }) };
};

// ── Google OAuth2 service account token ──────────────────────
async function getGoogleAccessToken(serviceAccount) {
  const now  = Math.floor(Date.now() / 1000);
  const claim = {
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  // Build JWT manually (no external deps)
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claim));
  const signing = `${header}.${payload}`;

  // Sign with RSA-SHA256
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature  = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    new TextEncoder().encode(signing)
  );
  const jwt = `${signing}.${b64url(signature)}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(data.error_description || 'Token fetch failed');
  return data.access_token;
}

function b64url(data) {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importPrivateKey(pem) {
  const pemBody = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8', der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
}
