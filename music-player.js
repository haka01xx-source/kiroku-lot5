// Music Player Module - Shared across all pages
(function() {
  const PLAYLIST_KEY = 'kiroku_music_playlist';
  
  window.MusicPlayer = {
    showDialog: showMusicDialog,
    syncPlaylist: syncPlaylist,
    loadPlaylistFromAccount: loadPlaylistFromAccount
  };
  
  // Sync playlist to Firebase account
  async function syncPlaylist() {
    if (!window.currentAccountId || !window.db) return;
    
    try {
      const playlist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
      const accountRef = window.db.collection('accounts').doc(window.currentAccountId);
      await accountRef.set({ musicPlaylist: playlist }, { merge: true });
      console.log('Playlist synced to account');
    } catch (error) {
      console.error('Failed to sync playlist:', error);
    }
  }
  
  // Load playlist from Firebase account
  async function loadPlaylistFromAccount() {
    if (!window.currentAccountId || !window.db) return;
    
    try {
      const accountRef = window.db.collection('accounts').doc(window.currentAccountId);
      const doc = await accountRef.get();
      
      if (doc.exists && doc.data().musicPlaylist) {
        const cloudPlaylist = doc.data().musicPlaylist;
        const localPlaylist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
        
        // Merge playlists (avoid duplicates)
        const merged = [...localPlaylist];
        cloudPlaylist.forEach(item => {
          if (!merged.find(m => m.url === item.url)) {
            merged.push(item);
          }
        });
        
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(merged));
        console.log('Playlist loaded from account');
      }
    } catch (error) {
      console.error('Failed to load playlist:', error);
    }
  }

  function showMusicDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card);
      border: 1px solid var(--input-border);
      border-radius: var(--radius);
      padding: 24px;
      z-index: 10000;
      box-shadow: var(--shadow);
      min-width: 400px;
      max-width: 90vw;
    `;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #fff;">音楽プレイヤー</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="myPlaylistBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #ff66aa 0%, #66ccff 100%);">📝 マイプレイリスト</button>
        <button id="searchMusicBtn" class="btn" style="width: 100%;">🔍 曲を検索</button>
        <button id="spotifyAppBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);">Spotify Web</button>
        <button id="spotifyUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);">Spotify埋め込み</button>
        <button id="youtubeUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);">YouTube</button>
        <button id="soundcloudUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #FF5500 0%, #FF3300 100%);">SoundCloud</button>
        <button id="awaUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%);">AWA</button>
        <button id="closeMusicDialog" class="btn secondary" style="width: 100%;">キャンセル</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    
    const closeDialog = () => {
      dialog.remove();
      overlay.remove();
    };
    
    overlay.addEventListener('click', closeDialog);
    document.getElementById('closeMusicDialog').addEventListener('click', closeDialog);
    
    document.getElementById('myPlaylistBtn').addEventListener('click', () => {
      closeDialog();
      showMyPlaylist();
    });
    
    document.getElementById('searchMusicBtn').addEventListener('click', () => {
      closeDialog();
      showMusicSearch();
    });
    
    document.getElementById('spotifyAppBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'Spotify URLを入力してください:\n\n' +
        '例: https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS\n\n' +
        'Spotify Webで開きます（フル再生可能）'
      );
      
      if (url && url.trim()) {
        // Convert to web player URL
        const webUrl = url.replace('open.spotify.com', 'open.spotify.com');
        window.open(webUrl, '_blank');
      }
    });
    
    document.getElementById('spotifyUrlBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'Spotify URLを入力してください:\n\n' +
        '例: https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS\n' +
        'または: https://open.spotify.com/album/...\n' +
        'または: https://open.spotify.com/track/...\n\n' +
        '※埋め込みは30秒プレビューのみ'
      );
      
      if (url && url.trim()) {
        const match = url.match(/spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
        if (match) {
          const [, type, id] = match;
          showMusicPlayer('spotify', type, id);
        } else {
          alert('無効なSpotify URLです');
        }
      }
    });
    
    document.getElementById('youtubeUrlBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'YouTube URLを入力してください:\n\n' +
        '例: https://www.youtube.com/watch?v=dQw4w9WgXcQ\n' +
        'または: https://youtu.be/dQw4w9WgXcQ'
      );
      
      if (url && url.trim()) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
        if (match) {
          const videoId = match[1];
          showMusicPlayer('youtube', 'video', videoId);
        } else {
          alert('無効なYouTube URLです');
        }
      }
    });
    
    document.getElementById('soundcloudUrlBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'SoundCloud URLを入力してください:\n\n' +
        '例: https://soundcloud.com/artist/track-name'
      );
      
      if (url && url.trim()) {
        showMusicPlayer('soundcloud', 'track', url);
      }
    });
    
    document.getElementById('awaUrlBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'AWA URLを入力してください:\n\n' +
        '例: https://s.awa.fm/track/...\n' +
        'または: https://s.awa.fm/playlist/...'
      );
      
      if (url && url.trim()) {
        const match = url.match(/awa\.fm\/(track|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
          const [, type, id] = match;
          showMusicPlayer('awa', type, id);
        } else {
          alert('無効なAWA URLです');
        }
      }
    });
  }
  
  function showMyPlaylist() {
    let playlist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
    
    const playlistDialog = document.createElement('div');
    playlistDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card);
      border: 1px solid var(--input-border);
      border-radius: var(--radius);
      padding: 24px;
      z-index: 10000;
      box-shadow: var(--shadow);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(playlistDialog);
    
    const closeDialog = () => {
      playlistDialog.remove();
      overlay.remove();
    };
    
    const renderPlaylist = () => {
      playlistDialog.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #fff;">マイプレイリスト</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <input type="text" id="playlistTitle" placeholder="曲名" style="flex: 1;" />
          <input type="text" id="playlistUrl" placeholder="URL" style="flex: 2;" />
          <button id="addToPlaylist" class="btn">追加</button>
        </div>
        <div id="playlistItems" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;"></div>
        <button id="closePlaylistDialog" class="btn secondary" style="width: 100%;">閉じる</button>
      `;
      
      const itemsDiv = document.getElementById('playlistItems');
      
      if (playlist.length === 0) {
        itemsDiv.innerHTML = '<p style="color: var(--muted); text-align: center;">プレイリストが空です</p>';
      } else {
        playlist.forEach((item, index) => {
          const itemEl = document.createElement('div');
          itemEl.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(40, 40, 60, 0.6);
            border: 1px solid rgba(255, 102, 170, 0.2);
            border-radius: 8px;
          `;
          
          itemEl.innerHTML = `
            <button class="play-btn" data-index="${index}" style="background: linear-gradient(135deg, #ff66aa 0%, #ff4488 100%); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">▶</button>
            <div style="flex: 1; min-width: 0;">
              <div style="color: #fff; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.title}</div>
              <div style="color: var(--muted); font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.platform}</div>
            </div>
            <button class="delete-btn" data-index="${index}" style="background: rgba(255, 68, 102, 0.3); border: 1px solid rgba(255, 68, 102, 0.5); color: #fff; border-radius: 50%; width: 28px; height: 28px; padding: 0; cursor: pointer; font-size: 16px;">×</button>
          `;
          
          itemsDiv.appendChild(itemEl);
        });
        
        // Add event listeners
        document.querySelectorAll('.play-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const item = playlist[index];
            playItem(item);
            closeDialog();
          });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            playlist.splice(index, 1);
            localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
            
            // Sync to account if logged in
            if (window.MusicPlayer) {
              window.MusicPlayer.syncPlaylist().catch(e => console.error('Sync failed:', e));
            }
            
            renderPlaylist();
          });
        });
      }
      
      document.getElementById('addToPlaylist').addEventListener('click', () => {
        const title = document.getElementById('playlistTitle').value.trim();
        const url = document.getElementById('playlistUrl').value.trim();
        
        if (!title || !url) {
          alert('曲名とURLを入力してください');
          return;
        }
        
        // Detect platform
        let platform = 'Unknown';
        if (url.includes('spotify.com')) platform = 'Spotify';
        else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'YouTube';
        else if (url.includes('soundcloud.com')) platform = 'SoundCloud';
        else if (url.includes('awa.fm')) platform = 'AWA';
        
        playlist.push({ title, url, platform });
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
        
        // Sync to account if logged in
        if (window.MusicPlayer) {
          window.MusicPlayer.syncPlaylist().catch(e => console.error('Sync failed:', e));
        }
        
        document.getElementById('playlistTitle').value = '';
        document.getElementById('playlistUrl').value = '';
        
        renderPlaylist();
      });
      
      document.getElementById('closePlaylistDialog').addEventListener('click', closeDialog);
    };
    
    const playItem = (item) => {
      const url = item.url;
      
      if (url.includes('spotify.com')) {
        const match = url.match(/spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
        if (match) {
          const [, type, id] = match;
          showMusicPlayer('spotify', type, id);
        }
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
        if (match) {
          showMusicPlayer('youtube', 'video', match[1]);
        }
      } else if (url.includes('soundcloud.com')) {
        showMusicPlayer('soundcloud', 'track', url);
      } else if (url.includes('awa.fm')) {
        const match = url.match(/awa\.fm\/(track|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
          const [, type, id] = match;
          showMusicPlayer('awa', type, id);
        }
      }
    };
    
    overlay.addEventListener('click', closeDialog);
    renderPlaylist();
  }
  
  function showMusicSearch() {
    const searchDialog = document.createElement('div');
    searchDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card);
      border: 1px solid var(--input-border);
      border-radius: var(--radius);
      padding: 24px;
      z-index: 10000;
      box-shadow: var(--shadow);
      width: 500px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    searchDialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #fff;">曲を検索</h3>
      <input type="text" id="musicSearchInput" placeholder="曲名、アーティスト名を入力..." style="width: 100%; margin-bottom: 12px;" />
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button id="searchYouTubeBtn" class="btn" style="flex: 1; min-width: 100px;">YouTube</button>
        <button id="searchSoundCloudBtn" class="btn" style="flex: 1; min-width: 100px; background: linear-gradient(135deg, #FF5500 0%, #FF3300 100%);">SoundCloud</button>
        <button id="searchAWABtn" class="btn" style="flex: 1; min-width: 100px; background: linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%);">AWA</button>
        <button id="closeSearchDialog" class="btn secondary" style="width: 100%;">閉じる</button>
      </div>
      <div id="searchResults" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;
    
    document.body.appendChild(searchDialog);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    
    const closeDialog = () => {
      searchDialog.remove();
      overlay.remove();
    };
    
    overlay.addEventListener('click', closeDialog);
    document.getElementById('closeSearchDialog').addEventListener('click', closeDialog);
    
    const searchInput = document.getElementById('musicSearchInput');
    searchInput.focus();
    
    document.getElementById('searchYouTubeBtn').addEventListener('click', async () => {
      const query = searchInput.value.trim();
      if (!query) return;
      
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '<p style="color: var(--muted);">検索中...</p>';
      
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`;
      resultsDiv.innerHTML = `
        <p style="color: var(--muted); margin-bottom: 12px;">YouTube検索結果を開きます...</p>
        <a href="${searchUrl}" target="_blank" class="btn" style="width: 100%; text-decoration: none; display: block; text-align: center;">
          YouTubeで「${query}」を検索
        </a>
        <p style="color: var(--muted); font-size: 0.85rem; margin-top: 12px;">
          ※動画を見つけたら、URLをコピーして「YouTube」から再生してください
        </p>
      `;
    });
    
    document.getElementById('searchSoundCloudBtn').addEventListener('click', async () => {
      const query = searchInput.value.trim();
      if (!query) return;
      
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '<p style="color: var(--muted);">検索中...</p>';
      
      const searchUrl = `https://soundcloud.com/search?q=${encodeURIComponent(query)}`;
      resultsDiv.innerHTML = `
        <p style="color: var(--muted); margin-bottom: 12px;">SoundCloud検索結果を開きます...</p>
        <a href="${searchUrl}" target="_blank" class="btn" style="width: 100%; text-decoration: none; display: block; text-align: center; background: linear-gradient(135deg, #FF5500 0%, #FF3300 100%);">
          SoundCloudで「${query}」を検索
        </a>
        <p style="color: var(--muted); font-size: 0.85rem; margin-top: 12px;">
          ※曲を見つけたら、URLをコピーして「SoundCloud」から再生してください
        </p>
      `;
    });
    
    document.getElementById('searchAWABtn').addEventListener('click', async () => {
      const query = searchInput.value.trim();
      if (!query) return;
      
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '<p style="color: var(--muted);">検索中...</p>';
      
      const searchUrl = `https://s.awa.fm/search/${encodeURIComponent(query)}`;
      resultsDiv.innerHTML = `
        <p style="color: var(--muted); margin-bottom: 12px;">AWA検索結果を開きます...</p>
        <a href="${searchUrl}" target="_blank" class="btn" style="width: 100%; text-decoration: none; display: block; text-align: center; background: linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%);">
          AWAで「${query}」を検索
        </a>
        <p style="color: var(--muted); font-size: 0.85rem; margin-top: 12px;">
          ※曲を見つけたら、URLをコピーして「AWA」から再生してください
        </p>
      `;
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('searchYouTubeBtn').click();
      }
    });
  }
  
  function showMusicPlayer(platform, type, id) {
    let embedUrl, height;
    
    if (platform === 'spotify') {
      embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      height = type === 'playlist' ? '380' : '152';
    } else if (platform === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
      height = '200';
    } else if (platform === 'soundcloud') {
      // SoundCloud uses the full URL for embedding
      embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(id)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
      height = '166';
    } else if (platform === 'awa') {
      embedUrl = `https://p.awa.fm/embed/${type}/${id}`;
      height = '200';
    }
    
    let playerContainer = document.getElementById('musicPlayerContainer');
    if (!playerContainer) {
      playerContainer = document.createElement('div');
      playerContainer.id = 'musicPlayerContainer';
      document.body.appendChild(playerContainer);
    }
    
    playerContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 40px);
      background: transparent;
      z-index: 1000;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    `;
    
    playerContainer.innerHTML = `
      <div style="position: relative;">
        <iframe 
          src="${embedUrl}" 
          width="100%" 
          height="${height}" 
          frameBorder="0" 
          allowfullscreen="" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
          style="border-radius: 12px;">
        </iframe>
        <button onclick="document.getElementById('musicPlayerContainer').remove()" 
                style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          ×
        </button>
      </div>
    `;
  }
})();
