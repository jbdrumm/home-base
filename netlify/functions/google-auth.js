// ─────────────────────────────────────────────────────────────
//  Netlify Function: google-auth
//  Exchanges a Google OAuth authorization code for
//  access_token + refresh_token.
//
//  Required env vars (set in Netlify dashboard):
//    GOOGLE_CLIENT_ID
//    GOOGLE_CLIENT_SECRET
//    REACT_APP_URL  (e.g. https://home-base-drumm.netlify.app)
// ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let code, redirectUri;
  try {
    ({ code, redirectUri } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const data = await resp.json();

    if (data.error) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: data.error, description: data.error_description }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_in:    data.expires_in,
        scope:         data.scope,
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
