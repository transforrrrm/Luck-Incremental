function performPrestige() {
    const maxSigma = state.luckiestThisPrestige.value;
    if (maxSigma.lt(140)) return;
    const essenceGain = maxSigma.sub(40).div(100).sqrt().floor();
    state.luckyEssence = state.luckyEssence.add(essenceGain);
    state.totalLuckEssence = state.totalLuckEssence.add(essenceGain);;
    state.maxSingleEssence = state.maxSingleEssence.max(essenceGain);
    state.prestigeCount = state.prestigeCount.add(1);

    const duration = state.timeSincePrestige;
    if (duration < state.fastestPrestige) state.fastestPrestige = duration;
    if (duration < 60 && !state.completedAchievements[1][0]) {
        completeAchievement(2, 1);
    }
    if (!state.completedAchievements[0][6]) completeAchievement(1, 7);

    state.luckPoints = new OmegaNum(0);
    state.luckyFactor = new OmegaNum(1);
    state.upgradeExpLevel = new OmegaNum(0);
    state.upgradeSigLevel = new OmegaNum(0);
    state.timeSincePrestige = 0;
    state.luckiestThisPrestige = { value: new OmegaNum(0), recChance: new OmegaNum(0) };
    if (!state.hasPrestiged) {
        state.hasPrestiged = true;
        elements.luckyEssenceDisplay.classList.remove('hidden');
        elements.prestigeBtn.classList.remove('hidden');
        elements.prestigePanel.classList.remove('hidden');
        elements.prestigeStat.classList.remove('hidden');
    }

    updateUI();
}

function unlockGenerator() {
    if (state.luckyEssence.lt(1)) return;
    state.luckyEssence = state.luckyEssence.sub(1);
    state.luckGeneratorUnlocked = true;
    elements.generatorLocked.classList.add('hidden');
    elements.luckGeneratorBlock.classList.remove('hidden');
}

function investEssence(amount) {
    if (state.luckyEssence.lt(amount)) return;
    state.luckyEssence = state.luckyEssence.sub(amount);
    state.investedEssence = state.investedEssence.add(amount);
    updateUI();
}

function generateLuckVal() {
    if (Math.random() < 0.05) {
        state.luckValue = state.luckValue.add(1);
        timeSinceLastLckValInc = 0;
        if (state.luckValue.gte(5) && !state.completedAchievements[0][7]) completeAchievement(1, 8);
    }
}