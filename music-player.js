// Music Player Module - Shared across all pages
(function() {
  const PLAYLIST_KEY = 'kiroku_music_playlist';
  
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
        ${playlist.length > 0 ? `
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <button id="playAllBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #66ccff 0%, #ff66aa 100%);">
              ▶ 全て再生
            </button>
          </div>
        ` : ''}
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
            playItem(item, index);
            closeDialog();
          });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            playlist.splice(index, 1);
            localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
            
            // Trigger auto-save to account
            if (window.saveToAccount) {
              window.saveToAccount().catch(e => console.error('Auto-save failed:', e));
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
        
        // Trigger auto-save to account (if app.js saveToAccount is available)
        if (window.saveToAccount) {
          window.saveToAccount().catch(e => console.error('Auto-save failed:', e));
        }
        
        document.getElementById('playlistTitle').value = '';
        document.getElementById('playlistUrl').value = '';
        
        renderPlaylist();
      });
      
      document.getElementById('closePlaylistDialog').addEventListener('click', closeDialog);
      
      // Play all button
      const playAllBtn = document.getElementById('playAllBtn');
      if (playAllBtn) {
        playAllBtn.addEventListener('click', () => {
          if (playlist.length > 0) {
            localStorage.setItem('kiroku_playlist_index', '0');
            playItemFromPlaylist(playlist[0], true);
            closeDialog();
          }
        });
      }
    };
    
    const playItem = (item, index) => {
      // Save the index for potential auto-next
      if (index !== undefined) {
        localStorage.setItem('kiroku_playlist_index', index.toString());
      }
      playItemFromPlaylist(item, false);
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
  
  function showMusicPlayer(platform, type, id, autoNext = false) {
    let embedUrl, height;
    
    if (platform === 'spotify') {
      embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
      height = type === 'playlist' ? '380' : '152';
    } else if (platform === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`;
      height = '200';
    } else if (platform === 'soundcloud') {
      embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(id)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
      height = '166';
    } else if (platform === 'awa') {
      embedUrl = `https://p.awa.fm/embed/${type}/${id}`;
      height = '200';
    }
    
    // Save current player state to localStorage for persistence across pages
    const playerState = {
      platform,
      type,
      id,
      embedUrl,
      height,
      autoNext,
      timestamp: Date.now()
    };
    localStorage.setItem('kiroku_music_player_state', JSON.stringify(playerState));
    
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
          id="musicPlayerIframe"
          src="${embedUrl}" 
          width="100%" 
          height="${height}" 
          frameBorder="0" 
          allowfullscreen="" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
          style="border-radius: 12px;">
        </iframe>
        <button onclick="window.MusicPlayer.closePlayer()" 
                style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          ×
        </button>
      </div>
    `;
    
    // Auto-play next track if enabled
    if (autoNext) {
      setupAutoNext();
    }
  }
  
  function setupAutoNext() {
    // YouTube API for detecting video end
    const iframe = document.getElementById('musicPlayerIframe');
    if (!iframe) return;
    
    // Listen for video end (simplified - full implementation would use YouTube IFrame API)
    setTimeout(() => {
      const playlist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
      const currentIndex = parseInt(localStorage.getItem('kiroku_playlist_index') || '0');
      
      if (currentIndex < playlist.length - 1) {
        playNextInPlaylist();
      }
    }, 180000); // Check after 3 minutes (adjust based on typical song length)
  }
  
  function playNextInPlaylist() {
    const playlist = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || '[]');
    let currentIndex = parseInt(localStorage.getItem('kiroku_playlist_index') || '0');
    
    currentIndex++;
    if (currentIndex >= playlist.length) {
      currentIndex = 0; // Loop back to start
    }
    
    localStorage.setItem('kiroku_playlist_index', currentIndex.toString());
    
    const item = playlist[currentIndex];
    if (item) {
      playItemFromPlaylist(item, true);
    }
  }
  
  function playItemFromPlaylist(item, autoNext = false) {
    const url = item.url;
    
    if (url.includes('spotify.com')) {
      const match = url.match(/spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
      if (match) {
        const [, type, id] = match;
        showMusicPlayer('spotify', type, id, autoNext);
      }
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
      if (match) {
        showMusicPlayer('youtube', 'video', match[1], autoNext);
      }
    } else if (url.includes('soundcloud.com')) {
      showMusicPlayer('soundcloud', 'track', url, autoNext);
    } else if (url.includes('awa.fm')) {
      const match = url.match(/awa\.fm\/(track|playlist)\/([a-zA-Z0-9]+)/);
      if (match) {
        const [, type, id] = match;
        showMusicPlayer('awa', type, id, autoNext);
      }
    }
  }
  
  function closePlayer() {
    const playerContainer = document.getElementById('musicPlayerContainer');
    if (playerContainer) {
      playerContainer.remove();
    }
    localStorage.removeItem('kiroku_music_player_state');
    localStorage.removeItem('kiroku_playlist_index');
  }
  
  function restorePlayer() {
    const stateStr = localStorage.getItem('kiroku_music_player_state');
    if (!stateStr) return;
    
    try {
      const state = JSON.parse(stateStr);
      // Only restore if less than 1 hour old
      if (Date.now() - state.timestamp < 3600000) {
        showMusicPlayer(state.platform, state.type, state.id, state.autoNext);
      }
    } catch (e) {
      console.error('Failed to restore player:', e);
    }
  }
  
  // Auto-restore player on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restorePlayer);
  } else {
    restorePlayer();
  }
  
  // Export additional functions
  window.MusicPlayer.closePlayer = closePlayer;
  window.MusicPlayer.playNextInPlaylist = playNextInPlaylist;
})();
