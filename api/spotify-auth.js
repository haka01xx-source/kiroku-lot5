// Vercel Serverless Function for Spotify OAuth
const querystring = require('querystring');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://kiroku-lot8.vercel.app/spotify-callback.html';

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming'
].join(' ');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if credentials are configured
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(503).json({ 
      error: 'not_configured',
      message: 'Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables in Vercel.'
    });
  }

  const { action, code, refresh_token } = req.query;

  // Get authorization URL
  if (action === 'login') {
    const state = Math.random().toString(36).substring(7);
    const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state: state
    });

    return res.json({ authUrl, state });
  }

  // Exchange code for token
  if (action === 'token' && code) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: querystring.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Spotify token exchange failed:', data);
        return res.status(400).json({ 
          error: data.error || 'Token exchange failed',
          message: data.error_description || 'Failed to exchange authorization code for access token'
        });
      }

      return res.json({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Refresh token
  if (action === 'refresh' && refresh_token) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ error: data.error || 'Token refresh failed' });
      }

      return res.json({
        access_token: data.access_token,
        expires_in: data.expires_in
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(400).json({ error: 'Invalid request' });
};
