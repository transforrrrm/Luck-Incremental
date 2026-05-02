// DOM 元素
const elements = {
    luckSpan: document.getElementById('luckValue'),
    lastDrawSpan: document.getElementById('lastDrawDisplay'),
    drawBtn: document.getElementById('drawButton'),
    luckTitle: document.getElementById('luckUpgrade'),
    luckBlock: document.getElementById('luckUpgradeBlock'),
    luckyFactorSpan: document.getElementById('luckyFactorVal'),
    increaseLuckyBtn: document.getElementById('increaseLuckyBtn'),
    exponentBlock: document.getElementById('expUpgradeBlock'),
    exponentName: document.getElementById('exponentName'),
    exponentDesc: document.getElementById('exponentDesc'),
    exponentBtn: document.getElementById('buyExpUpgradeBtn'),
    exponentMaxBtn: document.getElementById('buyMaxExpUpgradeBtn'),
    sigmaTitle: document.getElementById('sigmaUpgrade'),
    sigmaBlock: document.getElementById('sigUpgradeBlock'),
    sigmaSpan: document.getElementById('sigmaVal'),
    sigmaName: document.getElementById('sigmaName'),
    sigmaDesc: document.getElementById('sigmaDesc'),
    sigmaBtn: document.getElementById('buySigUpgradeBtn'),
    sigmaMaxBtn: document.getElementById('buyMaxSigUpgradeBtn'),
    gameTimeSpan: document.getElementById('gameTime'),
    totalLuckSpan: document.getElementById('totalLuck'),
    maxSingleSpan: document.getElementById('maxSingle'),
    luckiestRecordSpan: document.getElementById('luckiestRecord'),
    totalDrawsSpan: document.getElementById('totalDraws'),
    normalAch: document.getElementById('normalAch'),
    hiddenAch: document.getElementById('hiddenAch'),
    hardResetBtn: document.getElementById('hardResetBtn')
};

const baseCosts = {
    exponent: 100,
    sigma: 1500
};

let state = defaultGame;
let pendingReset = 0;
let lastDrawTime = 0;

function updateLuckiestRecord(value, recChance) {
    if (recChance.gt(state.luckiestRecord.recChance)) {
        state.luckiestRecord = { value: value, recChance: recChance };
    }
}

async function performDraw() {
    const now = Date.now();
    if (now - lastDrawTime < state.drawCooldown) return;
    lastDrawTime = now;

    const L = state.luckyFactor;
    const { value, recChance } = drawReward(L);
    const reward = value.mul(state.sigma);

    if (!state.completedHiddenAchievements[0][0] && !state.luckyUpgradeUnlocked) {
        if (value.lt(2)) {
            state.consecutiveBelow2Sigma++;
            if (state.consecutiveBelow2Sigma >= 22) {
                completeHiddenAchievement(1, 1);
                state.consecutiveBelow2Sigma = 0;
            }
        } else {
            state.consecutiveBelow2Sigma = 0;
        }
    }

    if (!state.completedAchievements[0][0] && value.gte(3)) completeAchievement(1, 1);
    if (!state.completedAchievements[0][4] && value.gte(100)) completeAchievement(1, 5);

    state.luckPoints = state.luckPoints.add(reward);
    state.totalLuckPoints = state.totalLuckPoints.add(reward);
    state.totalDraws = state.totalDraws.add(1);
    if (reward.gt(state.maxSingleReward)) state.maxSingleReward = reward;
    updateLuckiestRecord(value, recChance);

    elements.lastDrawSpan.textContent = `${formatNumber(reward)} (${formatNumber(value)}σ, 1/${formatNumber(recChance)})`;

    if (!state.luckyUpgradeUnlocked && value.gte(2)) {
        state.luckyUpgradeUnlocked = true;
        elements.luckBlock.style.display = 'flex';
        elements.luckTitle.textContent = '幸运升级';
    }
    if (!state.expUpgradeUnlocked && value.gte(10)) {
        state.expUpgradeUnlocked = true;
        elements.exponentBlock.classList.remove('locked');
    }
    if (!state.sigUpgradeUnlocked && value.gte(45)) {
        state.sigUpgradeUnlocked = true;
        elements.sigmaBlock.style.display = 'flex';
        elements.sigmaTitle.textContent = '标准差升级';
    }

    updateUI();
}

function increaseLucky() {
    const exponent = state.upgradeExpLevel.add(1);
    const multiplier = OmegaNum.pow(1.1, exponent);
    state.luckyFactor = state.luckyFactor.mul(multiplier);
    checkNormalAchievements();
    updateUI();
}

function purchaseUpgrade(type) {
    const baseCost = baseCosts[type];
    let nextLevel;
    switch (type) {
        case 'exponent': nextLevel = state.upgradeExpLevel.add(1); break;
        case 'sigma': nextLevel = state.upgradeSigLevel.add(1); break;
    }
    const cost = nextLevel.mul(baseCost);
    if (state.luckPoints.lt(cost)) return;
    state.luckPoints = state.luckPoints.sub(cost);
    switch (type) {
        case 'exponent':
            state.upgradeExpLevel = nextLevel;
            break;
        case 'sigma':
            state.upgradeSigLevel = nextLevel;
            state.sigma = nextLevel.add(1).sqrt();
            if (!state.completedAchievements[0][3]) completeAchievement(1, 4);
            checkNormalAchievements();
            break;
    }
    updateUI();
}

function purchaseMaxUpgrade(type) {
    const baseCost = baseCosts[type];
    let L;
    switch (type) {
        case 'exponent': L = state.upgradeExpLevel; break;
        case 'sigma': L = state.upgradeSigLevel; break;
    }
    const P = state.luckPoints;
    if (P.lt(L.add(1).mul(baseCost))) return;

    // 解二次方程 k^2 + (2L+1)k - (2P/baseCost) = 0
    const b = L.mul(2).add(1);
    const discriminant = b.mul(b).add(P.mul(8).div(baseCost));
    const sqrtD = discriminant.sqrt();
    let k = sqrtD.sub(b).div(2).floor();       // 理论最大次数

    const finalCost = L.add(k.add(1).div(2)).mul(baseCost).mul(k);
    state.luckPoints = state.luckPoints.sub(finalCost);
    const finalLevel = L.add(k);
    switch (type) {
        case 'exponent':
            state.upgradeExpLevel = finalLevel;
            break;
        case 'sigma':
            state.upgradeSigLevel = finalLevel;
            state.sigma = finalLevel.add(1).sqrt();
            if (!state.completedAchievements[0][3]) completeAchievement(1, 4);
            checkNormalAchievements();
            break;
    }
    updateUI();
}

function hardReset() {
    pendingReset++;
    if (pendingReset > 0) elements.hardResetBtn.textContent = `再点击${10 - pendingReset}次`;
    if (pendingReset >= 10) {
        elements.hardResetBtn.textContent = '硬重置';
        pendingReset = -1000; //防止多次触发重置
        localStorage.removeItem(SAVE_KEY);
        showNotification("游戏已重置！");
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function exportJSON() {
    return btoa(JSON.stringify(state));
}

function importJSON(jsonStr) {
    try {
        const data = convertToOmegaNum(JSON.parse(atob(jsonStr)));
        state = deepMerge(defaultGame, data);
        initGame();
        initUI();
        saveGame();
        showNotification("导入成功！", 'success');
    } catch (e) { showNotification("文件格式错误", 'error');; }
}

let notificationContainer = document.getElementById('notification-area');

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.prepend(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 500);
    }, duration);
}

// 自动保存
setInterval(() => {
    saveGame();
}, 60000);

setInterval(() => {
    const now = Date.now();
    const cdTime = state.drawCooldown - (now - lastDrawTime);
    elements.drawBtn.textContent = `抽取随机数${cdTime > 0 ? `(${formatTime(new OmegaNum(cdTime / 1000))})` : ''}`
    elements.drawBtn.className = cdTime > 0 ? 'draw-btn disabled' : 'draw-btn';
    state.gameTime = state.gameTime.add(.05);
    elements.gameTimeSpan.textContent = formatTime(state.gameTime);
}, 50);

// 绑定事件
elements.drawBtn.onclick = performDraw;
elements.increaseLuckyBtn.onclick = increaseLucky;
elements.hardResetBtn.onclick = hardReset;
elements.exponentBtn.onclick = () => purchaseUpgrade('exponent');
elements.exponentMaxBtn.onclick = () => purchaseMaxUpgrade('exponent');
elements.sigmaBtn.onclick = () => purchaseUpgrade('sigma');
elements.sigmaMaxBtn.onclick = () => purchaseMaxUpgrade('sigma');
document.getElementById('saveGameBtn').onclick = saveGame;
document.getElementById('exportFileBtn').onclick = () => {
    const dataStr = exportJSON();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};
document.getElementById('importFileInputBtn').onclick = () => {
    document.getElementById('importFileInput').click();
};
document.getElementById('importFileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importJSON(ev.target.result);
    reader.readAsText(file);
};
document.getElementById('exportToClipBtn').onclick = () => {
    const json = exportJSON();
    navigator.clipboard.writeText(json).then(() => showNotification("已复制到剪贴板", 'success')).catch(() => showNotification("复制失败", 'error'));
};

const modal = document.getElementById('modal');
const textarea = document.getElementById('textarea');
document.getElementById('importFromTextBtn').onclick = () => {
    modal.style.display = 'flex';
};
document.getElementById('importBtn').onclick = () => {
    textarea.focus();
    const raw = textarea.value.trim();
    if (raw) {
        try {
            importJSON(raw);
        } catch (e) {
            showNotification('导入失败，请检查存档格式', 'error');
        }
    } else {
        showNotification('请输入存档内容');
    }
    modal.style.display = 'none';
};
modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};
document.getElementById('cancelBtn').onclick = () => {
    modal.style.display = 'none';
};

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});
document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSubTab(btn.dataset.subtab));
});

function initGame() {
    refreshDrawCooldown();
}

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    initGame();
    initUI();
});