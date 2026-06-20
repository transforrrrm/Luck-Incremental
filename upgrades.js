const UPGRADE_LIST = {
    luck: {
        name: '幸运升级',
        resource: 'luckPoints',
        baseCost: 100,
        costType: 'linear',
        effect: (level) => ({
            mult: OmegaNum.pow(1.1, level.add(1)),
            exp: level.add(1)
        }),
        effectText: (effect) => `每次点击增加的幸运乘数^${formatNumber(effect.exp)}`,
        onBuy: (state) => {
            if (!state.completedAchievements[1][6] && getUpgradeLevel('luck').gte(7447)) { // 恰好大于1.79e308
                completeAchievement(2, 7);
            }
        },
        unlockCondition: 10,
        containerId: 'luckUpgradeBlock',
        updateTab: 'home'
    },
    sigma: {
        name: '标准差升级',
        resource: 'luckPoints',
        baseCost: 1500,
        costType: 'linear',
        effect: (level) => ({ mult: level.add(1).sqrt() }),
        effectText: (effect) => `σ×${formatNumber(effect.mult)}`,
        onBuy: (state) => {
            if (!state.completedAchievements[0][3]) completeAchievement(1, 4);
            checkSigma();
            if (!state.completedAchievements[2][3] && getUpgradeLevel('sigma').gte(1e8)) {
                completeAchievement(3, 4);
            }
        },
        containerId: 'sigUpgradeBlock',
        updateTab: 'home'
    },
    essence: {
        name: '精华升级',
        resource: 'luckyEssence',
        baseCost: 2,
        costType: 'geometric',
        ratio: 2,
        effect: (level) => ({ mult: OmegaNum.pow(2, level.div(2)) }),
        effectText: (effect) => `σ×${formatNumber(effect.mult)}`,
        unlockCondition: 1600,
        displayCondition: (state) => state.hasPrestiged,
        onBuy: (state) => checkSigma(),
        containerId: 'sigUpgradeBlock',
        updateTab: 'home'
    }
    //luck: {
    //    name: '幸运升级',
    //    resource: 'luckPoints',
    //    baseCost: 100,
    //    costType: 'linear',
    //    ratio: null,
    //    effect: (level) => ({}),
    //    effectText: (effect) => `...`,
    //    unlockCondition: 10,
    //    displayCondition: (state) => true / false,
    //    onBuy: (state) => { },      // 购买后的回调（等级升级）
    //    containerId: 'sigUpgradeBlock',
    //    updateTab: 'home',
    //    updateSubTab: 'upgrades'
    //}
};

const ONE_SHOT_UPGRADES = {
    U: [
        {
            resource: 'luckyEssence',
            cost: 30,
            desc: '幸运升级价格/2',
            onPurchase: (state) => {
                if (!state.completedAchievements[1][5]) completeAchievement(2, 6);
            },
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 200,
            desc: '标准差升级价格/2',
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 1000,
            desc: '精华升级价格/2',
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 60,
            desc: '基于抽取次数增加幸运点获取',
            effect: (state) => ({ mult: state.totalDraws.div(10000).add(1).log10().add(1) }),
            effectText: (effect) => `当前：×${formatNumber(effect.mult)}`,
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 300,
            desc: '基于重置次数增加幸运点获取',
            effect: (state) => ({ mult: state.prestigeCount.div(100).add(1).pow(0.2) }),
            effectText: (effect) => `当前：×${formatNumber(effect.mult)}`,
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 1500,
            desc: '基于最短重置时间增加幸运点获取',
            effect: (state) => ({ mult: Math.max(1, 5 / (1 + 3 * Math.log10(state.fastestPrestige + 1))) }),
            effectText: (effect) => `当前：×${formatNumber(effect.mult)}`,
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 100,
            desc: '重置需求-80',
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 500,
            desc: '幸运精华获取×1.3',
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        {
            resource: 'luckyEssence',
            cost: 3000,
            desc: '每秒增加幸运值的概率+1%',
            onPurchase: (state) => {
                state.maxLuckValue = state.luckValue;
            },
            containerId: 'boostUpgradeBlock',
            updateTab: 'prestige',
            updateSubTab: 'upgrades'
        },
        //{
        //    resource: 'luckyEssence',
        //    cost: 30,
        //    desc: '幸运升级价格/2',
        //    effect: (state) => ({}),
        //    effectText: (effect) => `...`,
        //    displayCondition: (state) => true / false,
        //    onPurchase: (state) => { },
        //    containerId: 'sigUpgradeBlock',
        //    updateTab: 'home',
        //    updateSubTab: 'upgrades'
        //}
    ]

}

const resources = {
    luckPoints: { resourceName: '幸运点', theme: '' },
    luckyEssence: { resourceName: '幸运精华', theme: 'prestige' }
};

function calcDivisors(type) {
    switch (type) {
        case 'luck':
            return state.oneShotPurchased.U[0] ? 2 : 1;
        case 'sigma':
            return state.oneShotPurchased.U[1] ? 2 : 1;
        case 'essence':
            return state.oneShotPurchased.U[2] ? 2 : 1;
        default: return 1;
    }
}

function renderAllUpgrades() {
    Object.entries(UPGRADE_LIST).forEach(([id, upgrade]) => {
        const container = elements[upgrade.containerId];
        if (!container.querySelector(`#${id}`)) {
            const elem = buildUpgradeElement(upgrade, id);
            container.insertAdjacentHTML('beforeend', elem);
        }
    });

    Object.entries(ONE_SHOT_UPGRADES).forEach(([type, upgradeGruop]) => {
        upgradeGruop.forEach((upgrade, index) => {
            const container = elements[upgrade.containerId];
            if (!container.querySelector(`#${type}${index}`)) {
                const elem = buildUpgradeElement(upgrade, type, index);
                container.insertAdjacentHTML('beforeend', elem);
            }
        });
    });
}

function buildUpgradeElement(upgrade, type, index) {
    const { unlockCondition, displayCondition, name, resource, cost, desc } = upgrade;
    const { resourceName, theme } = resources[resource];
    const isLocked = unlockCondition !== undefined; // 初始锁定
    const isHidden = displayCondition !== undefined; // 初始隐藏

    if (index === undefined) { // 非一次性升级
        const div = `
            <div class="upgrade ${isLocked ? 'locked' : ''} ${isHidden ? 'hidden' : ''}" id="${type}Upgrade">
                ${isLocked ? `<div class="mask ${theme}">达到${formatNumber(unlockCondition)}σ后解锁</div>` : ''}
                <div class="upgrade-stat">
                    <div class="upgrade-desc ${theme}">
                        <span class="upgrade-name">${name}(<span class="level-val">0</span>)</span>
                        <span class="effect-desc"></span>
                    </div>
                    <button data-id="${type}" class="upgrade-btn ${theme} disabled">花费：<span class="cost-val">0</span>${resourceName}</button>
                    <button data-id="${type}" class="upgrade-max-btn ${theme} disabled">购买最大</button>
                </div>
            </div>
        `;
        return div;
    }

    const div = `
        <button class="one-shot-card ${isHidden ? 'hidden' : ''} ${theme}" id="${type}${index}" data-type="${type}" data-index="${index}">
            <div class="upgrade-index">${type}${index + 1}</div>
            <div class="one-shot-desc">${desc}</div>
            <div class="one-shot-effect"></div>
            <div class="one-shot-cost">${cost}${resourceName}</div>
        </button>
    `;
    return div;
}

function updateUpgradesUI() {
    Object.entries(UPGRADE_LIST).forEach(([id, upgrade]) => {
        const tab = state.currentTab;
        const wrongTab = tab !== upgrade.updateTab;
        const wrongSubTab = upgrade.updateSubTab && state.currentSubTab[tab] !== upgrade.updateSubTab;
        if (wrongTab || wrongSubTab) return;
        const container = elements[`${id}Upgrade`];

        const level = getUpgradeLevel(id);
        const effect = upgrade.effect(level);
        const { unlockCondition, displayCondition } = upgrade;
        const resource = state[upgrade.resource];
        const cost = getUpgradeCost(upgrade, id, level);

        const levelSpan = container.querySelector('.level-val');
        levelSpan.textContent = formatNumber(level);
        const effectSpan = container.querySelector('.effect-desc');
        effectSpan.textContent = upgrade.effectText(effect);
        const costSpan = container.querySelector('.cost-val');
        costSpan.textContent = formatNumber(cost);

        const buyBtn = container.querySelector('.upgrade-btn');
        const maxBtn = container.querySelector('.upgrade-max-btn');
        const canAfford = resource.gte(cost);

        if (canAfford) {
            buyBtn.classList.remove('disabled');
            maxBtn.classList.remove('disabled');
        } else {
            buyBtn.classList.add('disabled');
            maxBtn.classList.add('disabled');
        }

        if (unlockCondition && state.luckiestRecord.value.gte(unlockCondition)) {
            container.classList.remove('locked');
        }
        if (displayCondition && displayCondition(state)) {
            container.classList.remove('hidden');
        }
    });

    Object.entries(ONE_SHOT_UPGRADES).forEach(([type, upgradeGruop]) => {
        upgradeGruop.forEach((upgrade, index) => {
            const tab = state.currentTab;
            const wrongTab = tab !== upgrade.updateTab;
            const wrongSubTab = upgrade.updateSubTab && state.currentSubTab[tab] !== upgrade.updateSubTab;
            if (wrongTab || wrongSubTab) return;
            const container = elements[`${type}${index}`];

            const purchased = state.oneShotPurchased[type][index];
            const resource = state[upgrade.resource];
            const canAfford = resource.gte(upgrade.cost);

            const { displayCondition } = upgrade;
            if (displayCondition && displayCondition(state)) {
                container.classList.remove('hidden');
            }

            if (upgrade.effectText) {
                const effect = upgrade.effect(state);
                const effectSpan = container.querySelector('.one-shot-effect');
                effectSpan.textContent = upgrade.effectText(effect);
            }

            const costDiv = container.querySelector('.one-shot-cost');
            if (purchased) {
                costDiv.textContent = '已购买';
                container.classList.remove('disabled');
                container.classList.add('purchased');
            } else if (canAfford) {
                container.classList.remove('disabled');
            } else container.classList.add('disabled');
        });
    });
}

function purchaseUpgrade(id, isMax = false) {
    const upgrade = UPGRADE_LIST[id];
    const currentLevel = getUpgradeLevel(id);
    const resource = state[upgrade.resource];
    const cost = getUpgradeCost(upgrade, id, currentLevel);
    if (resource.lt(cost)) return;

    let k = isMax ? maxBuyableUpgrades(upgrade, id, currentLevel, resource) : new OmegaNum(1);
    const totalCost = getTotalCost(upgrade, id, currentLevel, k);
    state[upgrade.resource] = resource.sub(totalCost);
    setUpgradeLevel(id, currentLevel.add(k));
    if (upgrade.onBuy) upgrade.onBuy(state);
    if (!isMax) {
        state.singlePurchaseCount++;
        if (!state.completedHiddenAchievements[1][1] && state.singlePurchaseCount >= 10000) {
            completeHiddenAchievement(2, 2);
        }
    }
    updateUI();
}

function purchaseOneShot(type, index) {
    const upgrade = ONE_SHOT_UPGRADES[type][index];
    if (state.oneShotPurchased[type][index]) return;
    const resource = state[upgrade.resource];
    if (resource.lt(upgrade.cost)) return;
    state[upgrade.resource] = resource.sub(upgrade.cost);
    state.oneShotPurchased[type][index] = true;
    if (upgrade.onPurchase) upgrade.onPurchase(state);
    updateUI();
}

function getUpgradeLevel(type) {
    return state.upgradeLevels[type];
}

function setUpgradeLevel(type, value) {
    state.upgradeLevels[type] = value;
}

function getUpgradeEffect(type, level = getUpgradeLevel(type)) {
    const cfg = UPGRADE_LIST[type];
    return cfg.effect(level);
}

function getOneShotEffect(type, index) {
    const cfg = ONE_SHOT_UPGRADES[type][index];
    return cfg.effect(state);
}

function getUpgradeCost(cfg, id, level) {
    const baseCost = cfg.baseCost;
    const divisor = calcDivisors(id);
    if (cfg.costType === 'geometric') {
        return OmegaNum.pow(cfg.ratio, level).mul(baseCost).div(divisor);
    }
    return level.add(1).mul(baseCost).div(divisor);
}

function getTotalCost(cfg, id, currentLevel, k) {
    const L = currentLevel;
    const divisor = calcDivisors(id);
    if (cfg.costType === 'geometric') {
        const a = cfg.baseCost;
        const r = cfg.ratio;
        // 等比求和：a * r^L * (r^k - 1) / (r - 1)
        const firstTerm = OmegaNum.pow(r, L).mul(a);
        const numerator = OmegaNum.pow(r, k).sub(1);
        const denominator = r - 1;
        return firstTerm.mul(numerator).div(denominator).div(divisor);
    } else {
        const baseCost = cfg.baseCost;
        // 等差求和：baseCost * [k * (2L + k + 1) / 2]
        const sum = L.add(k.add(1).div(2)).mul(baseCost).mul(k).div(divisor);
        return sum;
    }
}

function maxBuyableUpgrades(cfg, id, currentLevel, resource) {
    const L = currentLevel;
    const x = resource.mul(calcDivisors(id));
    if (cfg.costType === 'geometric') {
        const a = cfg.baseCost;
        const r = cfg.ratio;
        const firstCost = OmegaNum.pow(r, L).mul(a);
        // 解不等式：a * r^L * (r^k - 1)/(r-1) <= x
        // => r^k <= 1 + x*(r-1)/(a*r^L)
        const numerator = x.mul(r - 1).div(a).div(OmegaNum.pow(r, L)).add(1);
        // 取对数：k <= log_r(numerator)
        const k = numerator.logBase(r).floor();
        return k;
    } else {
        const baseCost = cfg.baseCost;
        // 总成本公式：sum_{i=0}^{k-1} (L+i+1)*baseCost = baseCost * (k*(2L + k + 1)/2)
        // 解二次方程：k^2 + (2L+1)k - 2P/baseCost <= 0
        const b = L.mul(2).add(1);
        const c = x.mul(2).div(baseCost).neg();
        // 判别式 Δ = b^2 - 4ac
        const discriminant = b.mul(b).sub(c.mul(4));
        const sqrtD = discriminant.sqrt();
        const k = sqrtD.sub(b).div(2).floor();
        return k;
    }
}