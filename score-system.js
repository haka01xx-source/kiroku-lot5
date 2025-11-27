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
    saveScore(newScore);
    
    // Show animation
    showScoreAnimation(points, reason);
    
    // Update display
    updateScoreDisplay();
    
    // Sync to account if logged in
    if (window.saveToAccount) {
      window.saveToAccount().catch(e => console.error('Score sync failed:', e));
    }
    
    return newScore;
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
    
    const scoreContainer = document.createElement('div');
    scoreContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1001;
      background: rgba(40, 40, 60, 0.9);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(255, 102, 170, 0.3);
      border-radius: 16px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    scoreContainer.innerHTML = `
      <div style="font-size: 1.5rem;">⭐</div>
      <div style="display: flex; flex-direction: column; align-items: flex-start;">
        <div style="font-size: 0.75rem; color: var(--muted); font-weight: 600;">SCORE</div>
        <div id="scoreDisplay" style="font-size: 1.3rem; font-weight: 700; color: #fff; font-family: 'Courier New', monospace;">0</div>
      </div>
    `;
    
    scoreContainer.addEventListener('mouseenter', () => {
      scoreContainer.style.transform = 'scale(1.05)';
      scoreContainer.style.boxShadow = '0 12px 40px rgba(255, 102, 170, 0.6)';
    });
    
    scoreContainer.addEventListener('mouseleave', () => {
      scoreContainer.style.transform = 'scale(1)';
      scoreContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    });
    
    scoreContainer.addEventListener('click', () => {
      showScoreDetails();
    });
    
    document.body.appendChild(scoreContainer);
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
      min-width: 400px;
      max-width: 90vw;
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
        <div style="color: #fff; font-weight: 600; margin-bottom: 12px;">スコアの獲得方法</div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; color: var(--muted);">
          <div>⏱️ 学習時間: 1分ごとに1-5pts</div>
          <div>📚 暗記学習: 1枚につき5pts</div>
          <div>✅ 暗記テスト正解: 1問につき10pts</div>
          <div>🎯 デイリーログイン: 50-100pts</div>
        </div>
      </div>
      <button id="closeScoreDialog" class="btn" style="width: 100%;">閉じる</button>
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
