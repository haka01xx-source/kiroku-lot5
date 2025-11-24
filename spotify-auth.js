// Spotify Web API Integration with Serverless Backend
(function() {
  const SPOTIFY_TOKEN_KEY = 'spotify_access_token';
  const SPOTIFY_REFRESH_KEY = 'spotify_refresh_token';
  const SPOTIFY_EXPIRY_KEY = 'spotify_token_expiry';

  // Get authorization URL from serverless function
  async function getAuthUrl() {
    try {
      const response = await fetch('/api/spotify-auth?action=login');
      const data = await response.json();
      
      if (data.error === 'not_configured') {
        alert(
          'Spotify連携が設定されていません。\n\n' +
          'Vercelの環境変数で以下を設定してください:\n' +
          '- SPOTIFY_CLIENT_ID\n' +
          '- SPOTIFY_CLIENT_SECRET\n' +
          '- SPOTIFY_REDIRECT_URI\n\n' +
          '詳細はSPOTIFY_SETUP.mdを参照してください。'
        );
        return null;
      }
      
      if (data.authUrl && data.state) {
        localStorage.setItem('spotify_auth_state', data.state);
        console.log('State saved:', data.state);
        return data.authUrl;
      }
      
      console.error('Invalid response from auth endpoint:', data);
      return null;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Spotify認証サーバーへの接続に失敗しました');
      return null;
    }
  }

  // Exchange code for token
  async function exchangeCode(code) {
    try {
      const response = await fetch(`/api/spotify-auth?action=token&code=${encodeURIComponent(code)}`);
      const data = await response.json();
      
      console.log('Token exchange response:', {
        status: response.status,
        hasToken: !!data.access_token,
        error: data.error,
        message: data.message
      });
      
      if (data.error) {
        console.error('Token exchange error:', data.error, data.message);
        throw new Error(data.message || data.error);
      }
      
      if (data.access_token) {
        saveToken(data.access_token, data.expires_in, data.refresh_token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to exchange code:', error);
      return false;
    }
  }

  // Refresh access token
  async function refreshToken() {
    const refreshToken = localStorage.getItem(SPOTIFY_REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const response = await fetch(`/api/spotify-auth?action=refresh&refresh_token=${encodeURIComponent(refreshToken)}`);
      const data = await response.json();
      
      if (data.access_token) {
        saveToken(data.access_token, data.expires_in, refreshToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }



  // Check if token is valid
  function isTokenValid() {
    const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    const expiry = localStorage.getItem(SPOTIFY_EXPIRY_KEY);
    
    if (!token || !expiry) return false;
    
    return Date.now() < parseInt(expiry);
  }

  // Get current token
  async function getToken() {
    if (isTokenValid()) {
      return localStorage.getItem(SPOTIFY_TOKEN_KEY);
    }
    
    // Try to refresh token
    if (localStorage.getItem(SPOTIFY_REFRESH_KEY)) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return localStorage.getItem(SPOTIFY_TOKEN_KEY);
      }
    }
    
    return null;
  }

  // Save token
  function saveToken(accessToken, expiresIn, refreshToken) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(SPOTIFY_TOKEN_KEY, accessToken);
    localStorage.setItem(SPOTIFY_EXPIRY_KEY, expiryTime.toString());
    if (refreshToken) {
      localStorage.setItem(SPOTIFY_REFRESH_KEY, refreshToken);
    }
  }

  // Logout
  function logout() {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_REFRESH_KEY);
    localStorage.removeItem(SPOTIFY_EXPIRY_KEY);
    localStorage.removeItem('spotify_auth_state');
  }

  // API: Get current playback
  async function getCurrentPlayback() {
    const token = await getToken();
    if (!token) return null;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) return null; // No content
      if (!response.ok) throw new Error('Failed to get playback');

      return await response.json();
    } catch (error) {
      console.error('Spotify API error:', error);
      return null;
    }
  }

  // API: Play/Pause
  async function togglePlayback() {
    const token = await getToken();
    if (!token) return false;

    try {
      const playback = await getCurrentPlayback();
      const endpoint = playback?.is_playing 
        ? 'https://api.spotify.com/v1/me/player/pause'
        : 'https://api.spotify.com/v1/me/player/play';

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Toggle playback error:', error);
      return false;
    }
  }

  // API: Next track
  async function nextTrack() {
    const token = await getToken();
    if (!token) return false;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Next track error:', error);
      return false;
    }
  }

  // API: Previous track
  async function previousTrack() {
    const token = await getToken();
    if (!token) return false;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Previous track error:', error);
      return false;
    }
  }

  // Export functions
  window.SpotifyAuth = {
    getAuthUrl,
    exchangeCode,
    isTokenValid,
    getToken,
    saveToken,
    logout,
    getCurrentPlayback,
    togglePlayback,
    nextTrack,
    previousTrack
  };
})();
