// DOM 元素
const elements = new Proxy({}, {
    get(cache, id) {
        if (!cache[id]) {
            cache[id] = document.getElementById(id);
        }
        return cache[id];
    }
});

let state = DEFAULT_GAME;
let pendingReset = 0;
let lastDrawTime = 0;
let luckTimer = 0;

let consecutiveBelow2Sigma = 0;
let saveHistoryTimestamps = [];
let lastStatsViewTimestamp = Date.now();
let recentRewards = [];
let timeSinceLastLckValInc = 0;
let versionClickCount = 0;

function updateLuckiestRecord(value, recChance) {
    if (recChance.gt(state.luckiestRecord.recChance)) {
        state.luckiestRecord = { value: value, recChance: recChance };
    }
    if (recChance.gt(state.luckiestThisPrestige.recChance)) {
        state.luckiestThisPrestige = { value: value, recChance: recChance };
    }
}

function trackRecentRewards(reward) {
    recentRewards.push(reward);
    if (recentRewards.length > 10) recentRewards.shift();
    if (recentRewards.length === 10) {
        let increasing = true;
        for (let i = 1; i < 10; i++) {
            if (recentRewards[i].lte(recentRewards[i - 1])) {
                increasing = false;
                break;
            }
        }
        if (increasing) completeAchievement(2, 2);
    }
}

async function performDraw() {
    if (state.drawCooldown !== 0) {
        const now = Date.now();
        if (now - lastDrawTime < state.drawCooldown) return;
        lastDrawTime = now;
    }

    const L = state.luckyFactor;
    const e = state.investedEssence;
    const v = state.luckValue;
    const { value, recChance } = drawReward(L, e, v);
    checkValue(value);

    const reward = value.mul(calcSigma());
    const realReward = reward.mul(calcDrawRewardBonus());
    state.luckPoints = state.luckPoints.add(realReward);
    state.totalLuckPoints = state.totalLuckPoints.add(realReward);
    state.totalDraws = state.totalDraws.add(1);
    state.maxSingleReward = state.maxSingleReward.max(realReward);
    if (!state.completedAchievements[1][2] && reward.gte(114514)) completeAchievement(2, 3);
    updateLuckiestRecord(value, recChance);
    if (state.luckGeneratorUnlocked && !state.completedAchievements[1][1]) {
        trackRecentRewards(reward);
    }

    elements.lastDrawDisplay.textContent = `${formatNumber(reward)} (${formatNumber(value)}σ, 1/${formatNumber(recChance)})`;

    if (!state.luckyUpgradeUnlocked && value.gte(2)) {
        state.luckyUpgradeUnlocked = true;
        elements.luckUpgradeBlock.classList.remove('hidden');
        elements.luckUpgradeTitle.textContent = '幸运升级';
    }
    if (!state.sigUpgradeUnlocked && value.gte(80)) {
        state.sigUpgradeUnlocked = true;
        elements.sigUpgradeBlock.classList.remove('hidden');
        elements.sigmaUpgradeTitle.textContent = '标准差升级';
    }

    updateUI();
}

function calcDrawRewardBonus() {
    const bonus = new OmegaNum(1)
        .mul(state.oneShotPurchased.U[3] ? getOneShotEffect('U', 3).mult : 1)
        .mul(state.oneShotPurchased.U[4] ? getOneShotEffect('U', 4).mult : 1)
        .mul(state.oneShotPurchased.U[5] ? getOneShotEffect('U', 5).mult : 1)
    return bonus;
}

function increaseLucky() {
    const multiplier = getUpgradeEffect('luck').mult;
    state.luckyFactor = state.luckyFactor.mul(multiplier);
    checkLuckyFactor();
    updateUI();
}

function calcSigma() {
    return getUpgradeEffect('sigma').mult.mul(getUpgradeEffect('essence').mult);
}

function hardReset() {
    pendingReset++;
    if (pendingReset > 0) elements.hardResetBtn.textContent = `再点击${10 - pendingReset}次`;
    if (pendingReset >= 10) {
        elements.hardResetBtn.textContent = '硬重置';
        pendingReset = -1000; // 防止多次触发重置
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
        const migratedState = data.version !== undefined ? data : migrateState(data); // 临时加入
        state = deepMerge(DEFAULT_GAME, migratedState);
        initGameOnImport();
        initUI();
        saveGame();
        showNotification("导入成功！", 'success');
    } catch (e) { showNotification("文件格式错误", 'error'); }
}

let notificationContainer = elements.notificationArea;

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

// 50ms主循环
setInterval(() => {
    if (state.luckGeneratorUnlocked) {
        luckTimer += .05;
        timeSinceLastLckValInc += .05;
        if (luckTimer >= 1) {
            generateLuckVal();
            luckTimer -= 1;
        }
        if (!state.completedHiddenAchievements[1][0]) {
            if (timeSinceLastLckValInc >= 80) {
                completeHiddenAchievement(2, 1);
            }
        }
        state.luckValue = state.luckValue.sub(1 / 400).max(0);
    }

    state.gameTime += .05;
    state.timeSincePrestige += .05;
    updateUI();
}, 50);

const textarea = elements.textarea;
const modal = elements.modal;
const idHandlers = {
    drawBtn: performDraw,
    increaseLuckyBtn: increaseLucky,
    hardResetBtn: hardReset,
    prestigeBtn: performPrestige,
    investBtn: () => {
        const amount = new OmegaNum(elements.investAmountInput.value).floor();
        if (!amount.isNaN() && amount.gt(0)) investEssence(amount);
    },
    investAllBtn: () => investEssence(state.luckyEssence),
    saveGameBtn: () => {
        const now = Date.now();
        saveHistoryTimestamps = saveHistoryTimestamps.filter(t => now - t < 30000);
        saveHistoryTimestamps.push(now);
        if (!state.completedHiddenAchievements[0][2] && saveHistoryTimestamps.length >= 100) {
            completeHiddenAchievement(1, 3);
            saveHistoryTimestamps = [];
        }
        saveGame();
    },
    exportFileBtn: () => {
        const dataStr = exportJSON();
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lucky_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    importFileInputBtn: () => elements.importFileInput.click(),
    exportToClipBtn: () => {
        const json = exportJSON();
        navigator.clipboard.writeText(json)
            .then(() => showNotification("已复制到剪贴板", 'success'))
            .catch(() => showNotification("复制失败", 'error'));
    },
    importFromTextBtn: () => modal.classList.remove('hidden'),
    importBtn: () => {
        textarea.focus();
        const raw = textarea.value.trim();
        if (raw) {
            if (raw === "文本" && !state.completedHiddenAchievements[0][7]) {
                completeHiddenAchievement(1, 8);
                modal.classList.add('hidden');
                return;
            }
            try {
                importJSON(raw);
            } catch (e) {
                showNotification('导入失败，请检查存档格式', 'error');
            }
        } else {
            showNotification('请输入存档内容');
        }
        modal.classList.add('hidden');
    },
    cancelBtn: () => modal.classList.add('hidden'),
    generatorLocked: unlockGenerator
};

elements.importFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importJSON(ev.target.result);
    reader.readAsText(file);
};

elements.gameContainer.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});

elements.gameContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.id && idHandlers[btn.id]) {
        idHandlers[btn.id]();
    } else if (btn.classList.contains('tab-btn')) {
        switchPanel(btn.dataset.panel);
    } else if (btn.classList.contains('subtab-btn')) {
        switchSubTab(btn.dataset.subtab);
    } else if (btn.classList.contains('upgrade-btn') || btn.classList.contains('upgrade-max-btn')) {
        const isMax = btn.classList.contains('upgrade-max-btn');
        purchaseUpgrade(btn.dataset.id, isMax);
    } else if (btn.classList.contains('one-shot-card')) {
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index);
        purchaseOneShot(type, index);
    }
});

const input = elements.investAmountInput;
input.addEventListener('input', () => {
    input.style.width = input.value.length * 0.75 + 0.25 + 'em';
});

elements.version.addEventListener('click', () => {
    versionClickCount++;
    if (!state.completedHiddenAchievements[1][2] && versionClickCount >= 10) {
        completeHiddenAchievement(2, 3);
    }
});

document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const key = e.key;
    if (key === 'd' || key === 'D') {
        e.preventDefault();
        performDraw();
    } else if (key === 'r' || key === 'R') {
        e.preventDefault();
        performPrestige();
    }
});

function initGame() {
    refreshDrawCooldown();
    initAchievements();
}

function initGameOnImport() {
    refreshDrawCooldown();
    elements.hardResetBtn.textContent = '硬重置';
    pendingReset = 0;
    luckTimer = 0;
    lastDrawTime = 0;
    consecutiveBelow2Sigma = 0;
    saveHistoryTimestamps = [];
    recentRewards = [];
    timeSinceLastLckValInc = 0;
    lastStatsViewTimestamp = Date.now();
}

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    initGame();
    initUI();
});