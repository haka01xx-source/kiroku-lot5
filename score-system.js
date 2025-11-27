// Score System - Gamification
(function() {
  const SCORE_KEY = 'kiroku_user_score';
  const LAST_LOGIN_KEY = 'kiroku_last_login';
  const SESSION_START_KEY = 'kiroku_session_start';
  
  let currentScore = 0;
  let sessionStartTime = Date.now();
  
  window.ScoreSystem = {
    getScore,
    addScore,
    init
  };
  
  function getScore() {
    try {
      const data = JSON.parse(localStorage.getItem(SCORE_KEY) || '{"total":0,"history":[]}');
      return data.total || 0;
    } catch (e) {
      return 0;
    }
  }
  
  function saveScore(score) {
    try {
      const data = JSON.parse(localStorage.getItem(SCORE_KEY) || '{"total":0,"history":[]}');
      data.total = score;
      localStorage.setItem(SCORE_KEY, JSON.stringify(data));
      currentScore = score;
    } catch (e) {
      console.error('Failed to save score:', e);
    }
  }
  
  function addScore(points, reason = '') {
    const newScore = getScore() + points;
    
    // Add to history
    const data = JSON.parse(localStorage.getItem(SCORE_KEY) || '{"total":0,"history":[]}');
    if (!data.history) data.history = [];
    data.history.push({
      points: points,
      reason: reason,
      timestamp: Date.now()
    });
    data.total = newScore;
    localStorage.setItem(SCORE_KEY, JSON.stringify(data));
    
    currentScore = newScore;
    
    // Show animation
    showScoreAnimation(points, reason);
    
    // Update display
    updateScoreDisplay();
    
    // Immediately sync to Firebase
    syncScoreToFirebase();
    
    return newScore;
  }
  
  async function syncScoreToFirebase() {
    const accountId = localStorage.getItem('kl_account_id');
    if (!accountId) return;
    
    const scoreData = JSON.parse(localStorage.getItem(SCORE_KEY) || '{"total":0,"history":[]}');
    
    try {
      if (window.firebaseDB) {
        // Direct Firebase update
        await window.firebaseDB.collection('accounts').doc(accountId).collection('meta').doc('data').set({
          scoreData: scoreData,
          lastScoreUpdate: new Date().toISOString()
        }, { merge: true });
        console.log('Score synced to Firebase');
      } else {
        // Local storage fallback
        const key = 'kl_accounts_local_v1';
        const raw = localStorage.getItem(key);
        const map = raw ? JSON.parse(raw) : {};
        
        if (!map[accountId]) map[accountId] = {};
        if (!map[accountId].meta) map[accountId].meta = {};
        if (!map[accountId].meta.data) map[accountId].meta.data = {};
        
        map[accountId].meta.data.scoreData = scoreData;
        map[accountId].meta.data.lastScoreUpdate = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(map));
        console.log('Score synced to local storage');
      }
    } catch (error) {
      console.error('Failed to sync score:', error);
    }
  }
  
  function showScoreAnimation(points, reason) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      pointer-events: none;
    `;
    
    const animation = document.createElement('div');
    animation.style.cssText = `
      background: linear-gradient(135deg, #ff66aa 0%, #66ccff 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 1.2rem;
      font-weight: 700;
      box-shadow: 0 8px 32px rgba(255, 102, 170, 0.6);
      animation: scorePopup 2s ease-out forwards;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    `;
    
    animation.innerHTML = `
      <div style="font-size: 1.5rem;">+${points} pts</div>
      ${reason ? `<div style="font-size: 0.85rem; opacity: 0.9;">${reason}</div>` : ''}
    `;
    
    container.appendChild(animation);
    document.body.appendChild(container);
    
    // Add CSS animation
    if (!document.getElementById('scoreAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'scoreAnimationStyle';
      style.textContent = `
        @keyframes scorePopup {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          20% {
            transform: translateY(-10px) scale(1.1);
            opacity: 1;
          }
          80% {
            transform: translateY(-20px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes scoreGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(255, 102, 170, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 102, 170, 0.8), 0 0 30px rgba(102, 204, 255, 0.6);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      container.remove();
    }, 2000);
  }
  
  function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
      const score = getScore();
      scoreDisplay.textContent = score.toLocaleString();
      
      // Add glow animation
      scoreDisplay.style.animation = 'scoreGlow 0.5s ease-out';
      setTimeout(() => {
        scoreDisplay.style.animation = '';
      }, 500);
    }
  }
  
  function checkDailyLogin() {
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
    
    // Initialize score data if it doesn't exist
    const scoreData = localStorage.getItem(SCORE_KEY);
    if (!scoreData) {
      localStorage.setItem(SCORE_KEY, JSON.stringify({
        total: 0,
        history: []
      }));
      // Sync initial data to Firebase
      syncScoreToFirebase();
    }
    
    if (lastLogin !== today) {
      localStorage.setItem(LAST_LOGIN_KEY, today);
      
      // Daily login bonus
      const bonus = Math.floor(Math.random() * 50) + 50; // 50-100 points
      addScore(bonus, 'デイリーログインボーナス！');
    }
  }
  
  function startSessionTimer() {
    sessionStartTime = Date.now();
    localStorage.setItem(SESSION_START_KEY, sessionStartTime.toString());
    
    // Award points every minute
    setInterval(() => {
      const points = Math.floor(Math.random() * 5) + 1; // 1-5 points per minute
      addScore(points, '学習時間');
    }, 60000); // Every minute
  }
  
  function createScoreDisplay() {
    // Check if already exists
    if (document.getElementById('scoreDisplay')) return;
    
    // Find clock display and insert score before it
    const clockDisplay = document.querySelector('.clock-display');
    if (!clockDisplay) return;
    
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'score-display';
    scoreContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(40, 40, 60, 0.6);
      border: 1px solid rgba(255, 102, 170, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-right: 16px;
    `;
    
    scoreContainer.innerHTML = `
      <div style="font-size: 1rem;">⭐</div>
      <div id="scoreDisplay" style="font-size: 0.9rem; font-weight: 700; color: #fff; font-family: 'Courier New', monospace;">0</div>
    `;
    
    scoreContainer.addEventListener('mouseenter', () => {
      scoreContainer.style.background = 'rgba(255, 102, 170, 0.2)';
      scoreContainer.style.borderColor = 'rgba(255, 102, 170, 0.4)';
    });
    
    scoreContainer.addEventListener('mouseleave', () => {
      scoreContainer.style.background = 'rgba(40, 40, 60, 0.6)';
      scoreContainer.style.borderColor = 'rgba(255, 102, 170, 0.2)';
    });
    
    scoreContainer.addEventListener('click', () => {
      showScoreDetails();
    });
    
    clockDisplay.parentElement.insertBefore(scoreContainer, clockDisplay);
    updateScoreDisplay();
  }
  
  function showScoreDetails() {
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
      width: 600px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    const score = getScore();
    const level = Math.floor(score / 1000) + 1;
    const nextLevel = level * 1000;
    const progress = ((score % 1000) / 1000) * 100;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #fff; text-align: center;">スコア詳細</h3>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 3rem; font-weight: 700; color: #ff66aa; font-family: 'Courier New', monospace;">${score.toLocaleString()}</div>
        <div style="color: var(--muted); margin-top: 8px;">レベル ${level}</div>
      </div>
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--muted); font-size: 0.85rem;">
          <span>次のレベルまで</span>
          <span>${nextLevel - score} pts</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #ff66aa 0%, #66ccff 100%); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <div style="background: rgba(40, 40, 60, 0.6); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">スコア推移</div>
        <canvas id="scoreChart" style="width: 100%; height: 200px;"></canvas>
      </div>
      <div style="background: rgba(40, 40, 60, 0.6); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">スコアの獲得方法</div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; color: var(--muted);">
          <div>⏱️ 学習時間: 1分ごとに1-5pts</div>
          <div>📚 暗記学習: 1枚につき5pts</div>
          <div>✅ 暗記テスト正解: 1問につき10pts</div>
          <div>🎯 デイリーログイン: 50-100pts</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <a href="leaderboard.html" class="btn" style="flex: 1; text-align: center; text-decoration: none;">ランキングを見る</a>
        <button id="closeScoreDialog" class="btn secondary" style="flex: 1;">閉じる</button>
      </div>
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
    document.body.appendChild(dialog);
    
    const closeDialog = () => {
      dialog.remove();
      overlay.remove();
    };
    
    overlay.addEventListener('click', closeDialog);
    document.getElementById('closeScoreDialog').addEventListener('click', closeDialog);
    
    // Draw score chart
    setTimeout(() => {
      drawScoreChart();
    }, 100);
  }
  
  function drawScoreChart() {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    
    // Get score history (last 30 days)
    const data = JSON.parse(localStorage.getItem(SCORE_KEY) || '{"total":0,"history":[]}');
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = 30;
    
    // Aggregate by day
    const dailyScores = [];
    let cumulativeScore = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const dayHistory = (data.history || []).filter(h => h.timestamp >= dayStart && h.timestamp < dayEnd);
      const dayPoints = dayHistory.reduce((sum, h) => sum + h.points, 0);
      cumulativeScore += dayPoints;
      dailyScores.push(cumulativeScore);
    }
    
    const maxScore = Math.max(...dailyScores, 100);
    const padding = 40;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;
    
    // Background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.4)';
    ctx.fillRect(0, 0, w, h);
    
    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartW, y);
      ctx.stroke();
    }
    
    // Line
    ctx.strokeStyle = '#ff66aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dailyScores.forEach((score, i) => {
      const x = padding + (chartW * i / (days - 1));
      const y = padding + chartH - (chartH * score / maxScore);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Gradient fill
    ctx.lineTo(padding + chartW, padding + chartH);
    ctx.lineTo(padding, padding + chartH);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartH);
    gradient.addColorStop(0, 'rgba(255, 102, 170, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 102, 170, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Labels
    ctx.fillStyle = 'var(--muted)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(maxScore.toLocaleString(), padding - 5, padding + 5);
    ctx.fillText('0', padding - 5, padding + chartH + 5);
  }
  
  function init() {
    currentScore = getScore();
    createScoreDisplay();
    checkDailyLogin();
    startSessionTimer();
  }
  
  // Auto-initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
