function updateUI() {
    elements.luckyEssenceVal.textContent = formatNumber(state.luckyEssence);
    const production = getUpgradeEffect('drawer1').production;
    const points = state.luckPoints;
    let rateText = '';
    if (production.neq(0)) {
        const dt = production.gte(20) ? 0.05 : production.rec().toNumber();
        const delta = production.div(20).max(1).mul(autoDrawGain);
        rateText = formatRate(points, delta, dt);
    }
    elements.luckValue.textContent = `${formatNumber(points)}${rateText}`;
    const maxSigma = state.luckiestThisPrestige.value;
    const extraReq = state.oneShotPurchased.U[6] ? 0 : 80;
    const mult = state.oneShotPurchased.U[7] ? 1.3 : 1;
    if (maxSigma.gte(200 + extraReq)) {
        const essenceGain = maxSigma.sub(extraReq).div(200).sqrt().mul(mult).floor();
        let text = `重置以获得${formatNumber(essenceGain)}幸运精华`;
        if (essenceGain.lt(100)) {
            const nextThreshold = essenceGain.add(1).div(mult).pow(2).mul(200).add(extraReq);
            text += `\n下一个在：${formatNumber(nextThreshold)}σ`;
        }
        elements.prestigeBtn.textContent = text;
    } else {
        elements.prestigeBtn.textContent = `达到${200 + extraReq}σ`;
    }
    updateProgressBar();
    updateUpgradesUI();
    if (state.currentTab === 'home') {
        if (state.drawCooldown !== 0) {
            const now = Date.now();
            const cdTime = state.drawCooldown - (now - lastDrawTime);
            elements.drawBtn.textContent = `抽取随机数${cdTime > 0 ? `(${formatTime(new OmegaNum(cdTime / 1000))})` : ''}`
            elements.drawBtn.className = cdTime > 0 ? 'draw-btn disabled' : 'draw-btn';
        }
        if (state.luckyUpgradeUnlocked) {
            const production = getUpgradeEffect('clicker1').production;
            const mult = getUpgradeEffect('luck').mult;
            let rateText = '';
            if (production.neq(0)) {
                const log10L = state.luckyFactor.log10();
                const dt = production.gte(20) ? 0.05 : production.rec().toNumber();
                const delta = production.div(20).max(1).mul(mult.log10());
                rateText = formatRate(log10L, delta, dt, 1);
            }
            elements.increaseLuckyBtn.textContent = `×${formatNumber(mult)}`;
            elements.luckyFactorVal.textContent = `${formatNumber(state.luckyFactor)}${rateText}`;
        }
        if (state.sigUpgradeUnlocked) {
            elements.sigmaVal.textContent = formatNumber(calcSigma());
        }
    }
    if (state.currentTab === 'prestige') {
        if (state.luckGeneratorUnlocked) {
            elements.investedEssenceVal.textContent = formatNumber(state.investedEssence);
            const val = state.luckValue;
            elements.luckValueDisplay.textContent = formatNumber(val);
            elements.luckValueDecrease.textContent = val.eq(0) ? '' : '(-0.05/s)';
            const e = state.investedEssence;
            const v = state.luckValue;
            elements.luckValueEffect.textContent = `^${formatNumber(e.div(5).add(1).mul(v).add(1))}`;
            elements.luckValueChance.textContent = `${state.oneShotPurchased.U[8] ? 6 : 5}%`;
        }
    }
    if (state.currentTab === 'automation') {
        elements.drawerSpeed.textContent = getUpgradeEffect('drawer1').production;
        if (state.clickersUnlocked) {
            elements.clickerSpeed.textContent = getUpgradeEffect('clicker1').production;
        }
    }
    if (state.currentTab === 'stats') {
        elements.gameTime.textContent = formatTime(state.gameTime);
        elements.totalLuck.textContent = formatNumber(state.totalLuckPoints);
        elements.maxSingle.textContent = formatNumber(state.maxSingleReward);
        elements.totalDraws.textContent = formatNumber(state.totalDraws);
        const record = state.luckiestRecord;
        if (record.recChance.gt(0)) {
            elements.luckiestRecord.textContent = `${formatNumber(record.value)}σ, 1/${formatNumber(record.recChance)}`;
        }
        elements.luckyFactorDesc.innerHTML = getLuckyFactorDescription(state.luckyFactor);
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
            elements.timeSincePrestige.textContent = formatTime(state.timeSincePrestige);
        }
    }
}

function updateProgressBar() {
    if (state.automationUnlocked) {
        elements.progressFill.style.width = '100%';
        elements.progressText.textContent = '所有功能已解锁！';
    } else if (state.hasPrestiged) {
        const totalAch = 16;
        let completed = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 8; j++) {
                if (state.completedAchievements[i][j]) completed++;
            }
        }
        const percent = completed / totalAch;
        elements.progressFill.style.width = `${percent * 100}%`;
        elements.progressText.innerHTML = `完成前两行成就以解锁自动化(${formatNumber(percent * 100)}%)`;
    } else {
        // 未重置，显示解锁推进进度
        const maxVal = state.luckiestRecord.value;
        const threshold = 280;
        const percent = maxVal.div(threshold).min(1);
        elements.progressFill.style.width = `${percent.toNumber() * 100}%`;
        elements.progressText.innerHTML = `达到280σ以解锁<span class="prestige-dark">推进</span>(${formatNumber(percent.mul(100))}%)`;
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
        elements.luckUpgradeTitle.textContent = '幸运升级';
    }

    if (state.sigUpgradeUnlocked) {
        elements.sigUpgradeBlock.classList.remove('hidden');
        elements.sigmaUpgradeTitle.textContent = '标准差升级';
    }
    if (state.hasPrestiged) {
        elements.luckyEssenceDisplay.classList.remove('hidden');
        elements.prestigeTab.classList.remove('hidden');
        elements.prestigeStat.classList.remove('hidden');
        if (state.luckGeneratorUnlocked) {
            elements.generatorLocked.classList.add('hidden');
            elements.luckGeneratorBlock.classList.remove('hidden');
        }
        if (state.automationUnlocked) elements.automationTab.classList.remove('hidden');
        if (state.clickersUnlocked) elements.clickerEffect.classList.remove('hidden');
    }

    renderAchievements();
    renderHiddenAchievements();
    renderAllUpgrades();
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
    else updateUI();
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
    if (log10L.lt(2.25e23)) {
        const seconds = log10L.div(9e8);
        const timeStr = formatTime(seconds);
        return `你的幸运乘数能生成 ${timeStr} 的4K视频。`;
    }
    if (log10L.lt(3.396e69)) {
        const length = log10L.div(2.25e35);
        const lengthStr = formatLength(length);
        return `你的幸运乘数能让你瞬移 ${lengthStr} 。`;
    }
    if (log10L.lt(3.396e72)) {
        const k = log10L.div(3.396e69);
        return `你的幸运乘数能让 ${formatNumber(k)} 个Og原子不衰败直到一个恒星质量的黑洞蒸发。`;
    }
    const radius = log10L.div(6.558e98).cbrt();
    const radiusStr = formatLength(radius);
    return `你的幸运乘数能让半径为 ${radiusStr} 的Og${radius.gte(1e6) ? 气态行星 : 球体}不衰败直到一个恒星质量的黑洞蒸发。`;
}