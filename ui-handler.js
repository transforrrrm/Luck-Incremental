// 格式化 OmegaNum
function updateUI() {
    elements.luckSpan.textContent = formatNumber(state.luckPoints);
    if (state.currentTab === 'home') {
        if (state.luckyUpgradeUnlocked) {
            elements.luckyFactorSpan.textContent = formatNumber(state.luckyFactor);
            if (state.expUpgradeUnlocked) {
                const mult = OmegaNum.pow(1.1, state.upgradeExpLevel.add(1));
                const level = state.upgradeExpLevel;
                elements.increaseLuckyBtn.textContent = `×${formatNumber(mult)}`;
                elements.exponentName.textContent = `幸运升级(${level})`;
                elements.exponentDesc.textContent = `每次点击增加的幸运乘数^${formatNumber(level.add(1))}`;
                const cost = level.add(1).mul(100);
                elements.exponentBtn.textContent = `花费：${formatNumber(cost)}幸运点`;
                elements.exponentBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn' : 'upgrade-btn disabled';
                elements.exponentMaxBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn max' : 'upgrade-btn max disabled';
            }
        }
        if (state.sigUpgradeUnlocked) {
                const level = state.upgradeSigLevel;
                elements.sigmaSpan.textContent = formatNumber(state.sigma);
                elements.sigmaName.textContent = `标准差升级(${level})`;
                elements.sigmaDesc.textContent = `σ×${formatNumber(level.add(1).sqrt())}`;
                const cost = level.add(1).mul(1500);
                elements.sigmaBtn.textContent = `花费：${formatNumber(cost)}幸运点`;
                elements.sigmaBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn' : 'upgrade-btn disabled';
                elements.sigmaMaxBtn.className = state.luckPoints.gte(cost) ? 'upgrade-btn max' : 'upgrade-btn max disabled';
        }
    }
    if (state.currentTab === 'stats') {
        elements.totalLuckSpan.textContent = formatNumber(state.totalLuckPoints);
        elements.maxSingleSpan.textContent = formatNumber(state.maxSingleReward);
        elements.totalDrawsSpan.textContent = formatNumber(state.totalDraws);
        if (state.luckiestRecord.recChance.gt(0)) {
            elements.luckiestRecordSpan.innerHTML = `${formatNumber(state.luckiestRecord.value)}σ, 1/${formatNumber(state.luckiestRecord.recChance)}`;
        }
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
        elements.luckBlock.style.display = 'flex';
        elements.luckTitle.textContent = '幸运升级';
    }
    
    if (state.expUpgradeUnlocked) {
        elements.exponentBlock.classList.remove('locked');
    }
    if (state.sigUpgradeUnlocked) {
        elements.sigmaBlock.style.display = 'flex';
        elements.sigmaTitle.textContent = '标准差升级';
    }

    renderAchievements();
    renderHiddenAchievements();
    switchPanel(state.currentTab);
}

function switchPanel(panelId) {
    document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hide'));
    document.getElementById(`${panelId}Panel`).classList.remove('hide');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-panel="${panelId}"]`).classList.add('active');
    state.currentTab = panelId;
    elements.hardResetBtn.textContent = '硬重置';
    pendingReset = 0;
    updateUI();
}

function switchSubTab(subTabId) {
    const tabId = state.currentTab;
    const tab = document.getElementById(`${tabId}Panel`);
    tab.querySelectorAll('.subtab').forEach(tab => tab.classList.add('hide'));
    document.getElementById(`${subTabId}${capitalizeFirstLetter(tabId)}Panel`).classList.remove('hide');
    tab.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    tab.querySelector(`.subtab-btn[data-subtab="${subTabId}"]`).classList.add('active');
    state.currentSubTab[tabId] = subTabId;
    updateUI();
}