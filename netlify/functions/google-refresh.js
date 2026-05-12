// ─────────────────────────────────────────────────────────────
//  Netlify Function: google-refresh
//  Silently refreshes an expired Google access token using
//  a stored refresh token.
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

  let refreshToken;
  try {
    ({ refreshToken } = JSON.parse(event.body));
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
        refresh_token: refreshToken,
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    'refresh_token',
      }),
    });

    const data = await resp.json();

    if (data.error) {
      // refresh_token itself is invalid/revoked — user must re-link
      return { statusCode: 401, headers, body: JSON.stringify({ error: data.error }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access_token: data.access_token,
        expires_in:   data.expires_in,
      }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
