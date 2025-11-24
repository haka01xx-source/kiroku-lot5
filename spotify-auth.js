// Spotify Web API Integration
(function() {
  // Spotify App Credentials
  // デモモード: Client IDが設定されていない場合はデモデータを使用
  const CLIENT_ID = localStorage.getItem('spotify_client_id') || '';
  const REDIRECT_URI = window.location.origin + '/spotify-callback.html';
  const SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming'
  ].join(' ');

  const DEMO_MODE = !CLIENT_ID || CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID';

  const SPOTIFY_TOKEN_KEY = 'spotify_access_token';
  const SPOTIFY_REFRESH_KEY = 'spotify_refresh_token';
  const SPOTIFY_EXPIRY_KEY = 'spotify_token_expiry';

  // Generate random string for state
  function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // Get authorization URL
  function getAuthUrl() {
    if (DEMO_MODE) {
      // デモモード: 設定画面を表示
      return null;
    }
    
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: SCOPES,
      show_dialog: true
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Demo data
  function getDemoPlayback() {
    return {
      is_playing: true,
      item: {
        name: 'Lofi Study Beats',
        artists: [{ name: 'Chill Hop Music' }],
        album: {
          images: [{ url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ff66aa" width="100" height="100"/%3E%3C/svg%3E' }]
        }
      }
    };
  }

  // Enable demo mode
  function enableDemoMode() {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, 'DEMO_TOKEN');
    localStorage.setItem(SPOTIFY_EXPIRY_KEY, (Date.now() + 3600000).toString());
  }

  // Check if token is valid
  function isTokenValid() {
    const token = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    const expiry = localStorage.getItem(SPOTIFY_EXPIRY_KEY);
    
    if (!token || !expiry) return false;
    
    return Date.now() < parseInt(expiry);
  }

  // Get current token
  function getToken() {
    if (isTokenValid()) {
      return localStorage.getItem(SPOTIFY_TOKEN_KEY);
    }
    return null;
  }

  // Save token
  function saveToken(accessToken, expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(SPOTIFY_TOKEN_KEY, accessToken);
    localStorage.setItem(SPOTIFY_EXPIRY_KEY, expiryTime.toString());
  }

  // Logout
  function logout() {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY);
    localStorage.removeItem(SPOTIFY_EXPIRY_KEY);
    localStorage.removeItem('spotify_auth_state');
  }

  // API: Get current playback
  async function getCurrentPlayback() {
    const token = getToken();
    if (!token) return null;

    // Demo mode
    if (token === 'DEMO_TOKEN') {
      return getDemoPlayback();
    }

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
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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

  // Set Client ID
  function setClientId(clientId) {
    localStorage.setItem('spotify_client_id', clientId);
    window.location.reload();
  }

  // Export functions
  window.SpotifyAuth = {
    getAuthUrl,
    isTokenValid,
    getToken,
    saveToken,
    logout,
    getCurrentPlayback,
    togglePlayback,
    nextTrack,
    previousTrack,
    enableDemoMode,
    setClientId,
    isDemoMode: () => DEMO_MODE
  };
})();
