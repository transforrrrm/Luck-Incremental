// DOM 元素
const elements = new Proxy({}, {
    get(cache, id) {
        if (!cache[id]) {
            cache[id] = document.getElementById(id);
        }
        return cache[id];
    }
});

const UPGRADES = {
    exponent: { baseCost: 100, levelRef: 'upgradeExpLevel', onBuy() { } },
    sigma: {
        baseCost: 1500, levelRef: 'upgradeSigLevel', onBuy() {
            if (!state.completedAchievements[0][3]) completeAchievement(1, 4);
            checkSigma();
        }
    }
};

let state = DEFAULT_GAME;
let pendingReset = 0;
let lastDrawTime = 0;
let luckTimer = 0;

let consecutiveBelow2Sigma = 0;
let saveHistoryTimestamps = [];
let lastStatsViewTimestamp = 0;
let recentRewards = [];
let timeSinceLastLckValInc = 0;

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
            if (recentRewards[i].lte(recentRewards[i-1])) {
                increasing = false;
                break;
            }
        }
        if (increasing) completeAchievement(2, 2);
    }
}

async function performDraw() {
    const now = Date.now();
    if (now - lastDrawTime < state.drawCooldown) return;
    lastDrawTime = now;

    const L = state.luckyFactor;
    const e = state.investedEssence;
    const v = state.luckValue;
    const { value, recChance } = drawReward(L, e, v);
    checkValue(value);

    const reward = value.mul(calcSigma());
    state.luckPoints = state.luckPoints.add(reward);
    state.totalLuckPoints = state.totalLuckPoints.add(reward);
    state.totalDraws = state.totalDraws.add(1);
    state.maxSingleReward = state.maxSingleReward.max(reward);
    if (!state.completedAchievements[1][2] && reward.gte(114514)) completeAchievement(2, 3);
    updateLuckiestRecord(value, recChance);
    if (state.luckGeneratorUnlocked && !state.completedAchievements[1][1]) {
        trackRecentRewards(reward);
    }

    elements.lastDrawDisplay.textContent = `${formatNumber(reward)} (${formatNumber(value)}σ, 1/${formatNumber(recChance)})`;

    if (!state.luckyUpgradeUnlocked && value.gte(2)) {
        state.luckyUpgradeUnlocked = true;
        elements.luckUpgradeBlock.classList.remove('hidden');
        elements.luckUpgrade.textContent = '幸运升级';
    }
    if (!state.expUpgradeUnlocked && value.gte(10)) {
        state.expUpgradeUnlocked = true;
        elements.expUpgradeBlock.classList.remove('locked');
    }
    if (!state.sigUpgradeUnlocked && value.gte(45)) {
        state.sigUpgradeUnlocked = true;
        elements.sigUpgradeBlock.classList.remove('hidden');
        elements.sigmaUpgrade.textContent = '标准差升级';
    }

    updateUI();
}

function increaseLucky() {
    const exponent = state.upgradeExpLevel.add(1);
    const multiplier = OmegaNum.pow(1.1, exponent);
    state.luckyFactor = state.luckyFactor.mul(multiplier);
    checkLuckyFactor();
    updateUI();
}

function purchaseUpgrade(type) {
    const cfg = UPGRADES[type];
    const L = state[cfg.levelRef];
    const cost = L.add(1).mul(cfg.baseCost);
    if (state.luckPoints.lt(cost)) return;

    state.luckPoints = state.luckPoints.sub(cost);
    state[cfg.levelRef] = L.add(1);
    if (cfg.onBuy) cfg.onBuy();
    updateUI();
}

function purchaseMaxUpgrade(type) {
    const cfg = UPGRADES[type];
    const baseCost = cfg.baseCost;
    const L = state[cfg.levelRef];
    const P = state.luckPoints;
    if (P.lt(L.add(1).mul(baseCost))) return;

    const b = L.mul(2).add(1);
    const discriminant = b.mul(b).add(P.mul(8).div(baseCost));
    const sqrtD = discriminant.sqrt();
    const k = sqrtD.sub(b).div(2).floor();

    const finalCost = L.add(k.add(1).div(2)).mul(baseCost).mul(k);
    state.luckPoints = state.luckPoints.sub(finalCost);
    state[cfg.levelRef] = L.add(k);

    if (cfg.onBuy) cfg.onBuy();
    updateUI();
}

function calcSigma() {
    return state.upgradeSigLevel.add(1).sqrt();
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
        state = deepMerge(DEFAULT_GAME, data);
        initGame();
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
    generatorLocked: unlockGenerator,
    buyExpUpgradeBtn: () => purchaseUpgrade('exponent'),
    buyMaxExpUpgradeBtn: () => purchaseMaxUpgrade('exponent'),
    buySigUpgradeBtn: () => purchaseUpgrade('sigma'),
    buyMaxSigUpgradeBtn: () => purchaseMaxUpgrade('sigma'),
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
    }
});

function initGame() {
    refreshDrawCooldown();
    elements.hardResetBtn.textContent = '硬重置';
    pendingReset = 0;
    lastStatsViewTimestamp = Date.now();
}

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    initGame();
    initUI();
    initAchievements();
});