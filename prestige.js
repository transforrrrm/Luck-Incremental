function performPrestige() {
    const maxSigma = state.luckiestThisPrestige.value;
    const extraReq = state.oneShotPurchased.U[6] ? 0 : 80;
    const mult = state.oneShotPurchased.U[7] ? 1.3 : 1;
    if (maxSigma.lt(200 + extraReq)) return;
    const essenceGain = maxSigma.sub(extraReq).div(200).sqrt().mul(mult).floor();
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
    if (!state.completedAchievements[1][7] && state.luckyFactor.eq(1) && essenceGain.gte(2)) {
        completeAchievement(2, 8);
    }

    state.luckPoints = new OmegaNum(0);
    state.luckyFactor = new OmegaNum(1);
    setUpgradeLevel('luck', new OmegaNum(0));
    setUpgradeLevel('sigma', new OmegaNum(0));
    state.timeSincePrestige = 0;
    state.luckiestThisPrestige = { value: new OmegaNum(0), recChance: new OmegaNum(0) };
    if (!state.hasPrestiged) {
        state.hasPrestiged = true;
        elements.luckyEssenceDisplay.classList.remove('hidden');
        elements.prestigeBtn.classList.remove('hidden');
        elements.prestigeTab.classList.remove('hidden');
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
    const prob = state.oneShotPurchased.U[8] ? .06 : .05;
    if (Math.random() < prob) {
        state.luckValue = state.luckValue.add(1);
        timeSinceLastLckValInc = 0;
        if (state.luckValue.gte(5) && !state.completedAchievements[0][7]) completeAchievement(1, 8);
    }
}