const ACHIEVEMENTS = [
    [
        { name: '3σ原则', desc: '达到3σ。\n每完成一个第一行中的成就，抽取冷却时间/1.1。' },
        { name: '原子幸运', desc: '幸运乘数达到1e80。' },
        { name: '无限幸运', desc: '幸运乘数达到1.79e308。' },
        { name: '矮胖曲线', desc: '购买标准差升级。' },
        { name: '百倍标准差', desc: '达到100σ。' },
        { name: '这生产线该重建了', desc: 'σ达到10。' }
    ]
];
const HIDDEN_ACHIEVEMENTS = [
    [
        { name: '倒霉常数', descUnfinished: '你也够倒霉的。', descFinished: '连续22次抽取没有达到2σ。\n概率：1/2.7857, ≈1/e' },
        { name: '我免费了', descUnfinished: '我是免费的。', descFinished: '点击这个成就。' },
        { name: '安全第一', descUnfinished: '它已经够安全了。', descFinished: '在30s内手动保存100次。' },
        { name: '纯狗运', descUnfinished: '说明你运气很好了。', descFinished: '你每秒有1/100000的概率获得这个成就。' },
        { name: '就差一点', descUnfinished: '为什么不再点一下？', descFinished: '点击硬重置按钮9次后切换界面。' },
        { name: '666，开桂了', descUnfinished: '立马停止你的开桂行为！', descFinished: '打开控制台。' },
        { name: '洋务啥呢？', descUnfinished: '看这玩意干什么？玩游戏去！', descFinished: '盯着统计界面看15min。' },
        { name: '遵循指令', descUnfinished: '...你确实遵循了指令。', descFinished: '在导入文本时输入"文本"。' }
    ]
];

function refreshDrawCooldown() {
    const completedCount = state.completedAchievements[0].filter(v => v === true).length;
    const divisor = Math.pow(1.1, completedCount);
    state.drawCooldown = 1000 / divisor;
}

function completeAchievement(row, col) {
    const i = row - 1;
    const j = col - 1;
    if (state.completedAchievements[i][j]) return;
    state.completedAchievements[i][j] = true;
    if (row === 1) refreshDrawCooldown();
    showNotification(`成就达成：${ACHIEVEMENTS[i][j].name}`, 'ach');
    const ach = elements.normalAch.querySelector(`.ach-card[data-index="${row}${col}"]`);
    ach.classList.add('completed');
    updateUI();
}

function completeHiddenAchievement(row, col) {
    const i = row - 1;
    const j = col - 1;
    if (state.completedHiddenAchievements[i][j]) return;
    state.completedHiddenAchievements[i][j] = true;
    showNotification(`隐藏成就解锁：${HIDDEN_ACHIEVEMENTS[i][j].name}`, 'ach');
    const ach = elements.hiddenAch.querySelector(`.ach-card[data-index="${row}${col}"]`);
    ach.classList.add('completed');
    const desc = HIDDEN_ACHIEVEMENTS[i][j].descFinished;
    ach.setAttribute('data-tooltip', desc);
    updateUI();
}

function checkNormalAchievements() {
    if (!state.completedAchievements[0][1] && state.luckyFactor.gte(1e80)) {
        completeAchievement(1, 2);
    }
    if (!state.completedAchievements[0][2] && state.luckyFactor.gte(1.79e308)) {
        completeAchievement(1, 3);
    }
    if (!state.completedAchievements[0][5] && state.sigma.gte(10)) {
        completeAchievement(1, 6);
    }
}

// 隐藏成就12检测
function setupAchievementClickHandler() {
    const hiddenAchContainer = elements.hiddenAch;
    hiddenAchContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.ach-card');
        if (!card) return;
        const index = card.getAttribute('data-index');
        if (index === '12' && !state.completedHiddenAchievements[0][1]) {
            completeHiddenAchievement(1, 2);
        }
    });
}

function checkHiddenAchievements() {
    setInterval(() => {
        if (!state.completedHiddenAchievements[0][3]) {
            if (Math.random() < 1 / 100000) completeHiddenAchievement(1, 4);
        }
        if (!state.completedHiddenAchievements[0][5]) {
            const threshold = 160; // 视口高度差阈值
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const devtoolsOpen = widthThreshold || heightThreshold;
            if (devtoolsOpen) completeHiddenAchievement(1, 6);
        }
        if (state.currentTab === 'stats' && !state.completedHiddenAchievements[0][6]) {
            const now = Date.now();
            if (now - lastStatsViewTimestamp >= 900000) completeHiddenAchievement(1, 7);
        }
    }, 1000);
}

function initAchievements() {
    setupAchievementClickHandler();
    checkHiddenAchievements();
}