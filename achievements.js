const ACHIEVEMENTS = [
    [
        { name: '3σ原则', desc: '达到3σ。\n每完成一个第一行中的成就，抽取冷却时间/1.1。' },
        { name: '原子幸运', desc: '幸运乘数达到1e80。' },
        { name: '无限幸运', desc: '幸运乘数达到1.79e308。' }
    ]
];
const HIDDEN_ACHIEVEMENTS = [
    [
        { name: '倒霉常数', descUnfinished: '你也够倒霉的。', descFinished: '连续22次抽取没有达到2σ\n概率：1/2.7857, ≈1/e' }
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
}

