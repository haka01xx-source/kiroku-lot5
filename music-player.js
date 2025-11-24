// Music Player Module - Shared across all pages
(function() {
  window.MusicPlayer = {
    showDialog: showMusicDialog
  };

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
        <button id="searchMusicBtn" class="btn" style="width: 100%;">🔍 曲を検索</button>
        <button id="spotifyAppBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);">Spotifyアプリで開く</button>
        <button id="spotifyUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);">Spotify埋め込み</button>
        <button id="youtubeUrlBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);">YouTube</button>
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
    
    document.getElementById('searchMusicBtn').addEventListener('click', () => {
      closeDialog();
      showMusicSearch();
    });
    
    document.getElementById('spotifyAppBtn').addEventListener('click', () => {
      closeDialog();
      const url = prompt(
        'Spotify URLを入力してください:\n\n' +
        '例: https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS\n\n' +
        'Spotifyアプリで開きます（フル再生可能）'
      );
      
      if (url && url.trim()) {
        window.open(url, '_blank');
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
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button id="searchYouTubeBtn" class="btn" style="flex: 1;">YouTube検索</button>
        <button id="closeSearchDialog" class="btn secondary">閉じる</button>
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
