function updateUI() {
    const now = Date.now();
    elements.luckValue.textContent = formatNumber(state.luckPoints);
    const maxSigma = state.luckiestThisPrestige.value;
    if (maxSigma.gte(140)) {
        const essenceGain = maxSigma.sub(40).div(100).sqrt().floor();
        let text = `重置以获得${essenceGain}幸运精华`;
        if (essenceGain.lt(100)) {
            const nextThreshold = essenceGain.add(1).pow(2).mul(100).add(40);
            text += `\n下一个在：${nextThreshold}σ`;
        }
        elements.prestigeBtn.textContent = text;
    } else {
        elements.prestigeBtn.textContent = '达到140σ';
    }
    updateProgressBar();
    if (state.currentTab === 'home') {
        const cdTime = state.drawCooldown - (now - lastDrawTime);
        elements.drawBtn.textContent = `抽取随机数${cdTime > 0 ? `(${formatTime(new OmegaNum(cdTime / 1000))})` : ''}`
        elements.drawBtn.className = cdTime > 0 ? 'draw-btn disabled' : 'draw-btn';
        if (state.luckyUpgradeUnlocked) {
            elements.luckyFactorVal.textContent = formatNumber(state.luckyFactor);
            if (state.expUpgradeUnlocked) {
                const mult = OmegaNum.pow(1.1, state.upgradeExpLevel.add(1));
                const level = state.upgradeExpLevel;
                elements.increaseLuckyBtn.textContent = `×${formatNumber(mult)}`;
                elements.exponentName.textContent = `幸运升级(${level})`;
                elements.exponentDesc.textContent = `每次点击增加的幸运乘数^${formatNumber(level.add(1))}`;
                const cost = level.add(1).mul(100);
                elements.buyExpUpgradeBtn.textContent = `花费：${formatNumber(cost)}幸运点`;
                elements.buyExpUpgradeBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn' : 'upgrade-btn disabled';
                elements.buyMaxExpUpgradeBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn max' : 'upgrade-btn max disabled';
            }
        }
        if (state.sigUpgradeUnlocked) {
            const level = state.upgradeSigLevel;
            elements.sigmaVal.textContent = formatNumber(calcSigma());
            elements.sigmaName.textContent = `标准差升级(${level})`;
            elements.sigmaDesc.textContent = `σ×${formatNumber(level.add(1).sqrt())}`;
            const cost = level.add(1).mul(1500);
            elements.buySigUpgradeBtn.textContent = `花费：${formatNumber(cost)}幸运点`;
            elements.buySigUpgradeBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn' : 'upgrade-btn disabled';
            elements.buyMaxSigUpgradeBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn max' : 'upgrade-btn max disabled';
        }
    }
    if (state.currentTab === 'prestige') {
        if (state.luckGeneratorUnlocked) {
            elements.investedEssenceVal.textContent = state.investedEssence;
            const val = state.luckValue
            elements.luckValueDisplay.textContent = val;
            elements.luckValueDecrease.textContent = val.eq(0) ? '' : '(-0.05/s)';
            const e = state.investedEssence;
            const v = state.luckValue;
            elements.luckValueEffect.textContent = formatNumber(e.div(5).add(1).mul(v).add(1));
        }
    }
    if (state.currentTab === 'stats') {
        elements.gameTime.textContent = formatTime(new OmegaNum(state.gameTime));
        elements.totalLuck.textContent = formatNumber(state.totalLuckPoints);
        elements.maxSingle.textContent = formatNumber(state.maxSingleReward);
        elements.totalDraws.textContent = formatNumber(state.totalDraws);
        const record = state.luckiestRecord;
        if (record.recChance.gt(0)) {
            elements.luckiestRecord.textContent = `${formatNumber(record.value)}σ, 1/${formatNumber(record.recChance)}`;
        }
        elements.luckyFactorDesc.textContent = getLuckyFactorDescription(state.luckyFactor);
        if (state.hasPrestiged) {
            elements.prestigeCount.textContent = state.prestigeCount;
            elements.totalEssence.textContent = state.totalLuckEssence;
            elements.maxSingleEssence.textContent = state.maxSingleEssence;
            elements.fastestPrestige.textContent = formatTime(new OmegaNum(state.fastestPrestige));
            const record = state.luckiestThisPrestige;
            if (state.luckiestThisPrestige.recChance.gt(0)) {
                elements.luckiestThisPrestige.textContent = `${formatNumber(record.value)}σ, 1/${formatNumber(record.recChance)}`;
            } else {
                elements.luckiestThisPrestige.textContent = '-';
            }
            elements.timeSincePrestige.textContent = formatTime(new OmegaNum(state.timeSincePrestige));
        }
    }
}

function updateProgressBar() {
    const maxVal = state.luckiestRecord.value;
    const threshold = 140;
    const percent = maxVal.div(threshold).min(1);
    elements.progressFill.style.width = `${percent.toNumber() * 100}%`;
    if (state.hasPrestiged) {
        elements.progressText.textContent = '所有功能已解锁！';
    } else {
        elements.progressText.innerHTML = `达到140σ以解锁<span class="prestige">推进</span>(${formatNumber(percent.mul(100))}%)`;
    }
}

function renderAchievements() {
    elements.normalAch.innerHTML = '';
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        const achRow = ACHIEVEMENTS[i];
        for (let j = 0; j < achRow.length; j++) {
            const ach = achRow[j];
            const completed = state.completedAchievements[i][j];
            const indexNum = `${i + 1}${j + 1}`;
            const card = document.createElement('div');
            card.className = `ach-card ${completed ? 'completed' : ''}`;
            card.setAttribute('data-tooltip', ach.desc);
            card.setAttribute('data-index', indexNum);
            card.innerHTML = `
            <div class="ach-name">${ach.name}</div>
            <div class="ach-index">${indexNum}</div>
        `;
            elements.normalAch.appendChild(card);
        }
    }
}

function renderHiddenAchievements() {
    elements.hiddenAch.innerHTML = '';
    for (let i = 0; i < HIDDEN_ACHIEVEMENTS.length; i++) {
        const achRow = HIDDEN_ACHIEVEMENTS[i];
        for (let j = 0; j < achRow.length; j++) {
            const ach = achRow[j];
            const completed = state.completedHiddenAchievements[i][j];
            const desc = completed ? ach.descFinished : ach.descUnfinished;
            const indexNum = `${i + 1}${j + 1}`;
            const card = document.createElement('div');
            card.className = `ach-card ${completed ? 'completed' : ''}`;
            card.setAttribute('data-tooltip', desc);
            card.setAttribute('data-index', indexNum);
            card.innerHTML = `
            <div class="ach-name">${ach.name}</div>
            <div class="ach-index">${indexNum}</div>
        `;
            elements.hiddenAch.appendChild(card);
        }
    }
}

function initUI() {
    if (state.luckyUpgradeUnlocked) {
        elements.luckUpgradeBlock.classList.remove('hidden');
        elements.luckUpgrade.textContent = '幸运升级';
    }

    if (state.expUpgradeUnlocked) {
        elements.expUpgradeBlock.classList.remove('locked');
    }
    if (state.sigUpgradeUnlocked) {
        elements.sigUpgradeBlock.classList.remove('hidden');
        elements.sigmaUpgrade.textContent = '标准差升级';
    }
    if (state.hasPrestiged) {
        elements.luckyEssenceDisplay.classList.remove('hidden');
        elements.prestigeBtn.classList.remove('hidden');
        elements.prestigePanel.classList.remove('hidden');
        elements.prestigeStat.classList.remove('hidden');
        if (state.luckGeneratorUnlocked) {
            elements.generatorLocked.classList.add('hidden');
            elements.luckGeneratorBlock.classList.remove('hidden');
        }
    }

    renderAchievements();
    renderHiddenAchievements();
    switchPanel(state.currentTab);
}

function switchPanel(panelId) {
    document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
    elements[`${panelId}Panel`].classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-panel="${panelId}"]`).classList.add('active');
    if (panelId !== state.currentTab) {
        if (pendingReset === 9 && !state.completedHiddenAchievements[0][4]) {
            completeHiddenAchievement(1, 5);
        }
        elements.hardResetBtn.textContent = '硬重置';
        pendingReset = 0;
        lastStatsViewTimestamp = Date.now();
    }
    state.currentTab = panelId;
    if (state.currentSubTab[panelId]) switchSubTab(state.currentSubTab[panelId]);
    updateUI();
}

function switchSubTab(subTabId) {
    const tabId = state.currentTab;
    const tab = elements[`${tabId}Panel`];
    tab.querySelectorAll('.subtab').forEach(tab => tab.classList.add('hidden'));
    elements[`${subTabId}${capitalizeFirstLetter(tabId)}Panel`].classList.remove('hidden');
    tab.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    tab.querySelector(`.subtab-btn[data-subtab="${subTabId}"]`).classList.add('active');
    state.currentSubTab[tabId] = subTabId;
    updateUI();
}

function getLuckyFactorDescription(L) {
    const log10L = L.log10();

    if (L.lt(2)) {
        return `如果你抛一枚硬币，你有 1/${formatNumber(OmegaNum.div(2, L))} 的概率得到正面。`;
    }
    if (log10L.lt(80)) {
        const k = L.logBase(2);
        return `你的幸运乘数能让你连续抛 ${formatNumber(k)} 枚硬币都是正面。`;
    }
    if (log10L.lt(4094)) {
        const k = log10L.div(80);
        return `你的幸运乘数能让你在宇宙中连续选 ${formatNumber(k)} 个原子都选中指定的一个。`;
    }
    if (log10L.lt(7.456e6)) {
        const k = log10L.div(4094);
        return `你的幸运乘数能让你连续随机打乱 ${formatNumber(k)} 次33阶魔方都恰好复原。`;
    }
    if (log10L.lt(9e8)) {
        const k = log10L.div(7.456e6);
        return `你的幸运乘数能让猴子打出 ${formatNumber(k)} 次莎士比亚全集。`;
    }

    const seconds = log10L.div(9e8);
    const timeStr = formatTime(seconds);
    return `你的幸运乘数能生成 ${timeStr} 的4K视频。`;
}