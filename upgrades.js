const UPGRADES = {
    exponent: {
        baseCost: 100, costType: 'linear', resource: 'luckPoints', levelRef: 'upgradeExpLevel', onBuy() { },
        effect: (level) => ({ luckyFactorMult: OmegaNum.pow(1.1, level.add(1)), luckyFactorExp: level.add(1) })
    },
    sigma: {
        baseCost: 1500, costType: 'linear', resource: 'luckPoints', levelRef: 'upgradeSigLevel', onBuy() {
            if (!state.completedAchievements[0][3]) completeAchievement(1, 4);
            checkSigma();
        },
        effect: (level) => ({ SigmaMult: level.add(1).sqrt() })
    },
    essence: {
        baseCost: 2, ratio: 2, costType: 'geometric', resource: 'luckyEssence', levelRef: 'upgradeEssLevel', onBuy() {
            checkSigma();
        },
        effect: (level) => ({ SigmaMult: OmegaNum.pow(2, level.div(2)) })
    }
};

function getUpgradeEffect(type, level) {
    const cfg = UPGRADES[type];
    return cfg.effect(level);
}

function getUpgradeCost(type, level) {
    const cfg = UPGRADES[type];
    const baseCost = cfg.baseCost;
    if (cfg.costType === 'geometric') {
        return OmegaNum.pow(cfg.ratio, level).mul(baseCost);
    } else {
        return level.add(1).mul(baseCost);
    }
}

function getTotalCost(cfg, currentLevel, k) {
    const L = currentLevel;
    if (cfg.costType === 'geometric') {
        const a = cfg.baseCost;
        const r = cfg.ratio;
        // 等比求和：a * r^L * (r^k - 1) / (r - 1)
        const firstTerm = OmegaNum.pow(r, L).mul(a);
        const numerator = OmegaNum.pow(r, k).sub(1);
        const denominator = r - 1;
        return firstTerm.mul(numerator).div(denominator);
    } else {
        const baseCost = cfg.baseCost;
        // 等差求和：baseCost * [k * (2L + k + 1) / 2]
        const sum = L.add(k.add(1).div(2)).mul(baseCost).mul(k);
        return sum;
    }
}

function maxBuyableUpgrades(cfg, currentLevel, resource) {
    const L = currentLevel;
    const x = resource;
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

function purchaseUpgrade(type, max = false) {
    const cfg = UPGRADES[type];

    const currentLevel = state[cfg.levelRef];
    const resource = state[cfg.resource];

    const cost = getUpgradeCost(type, currentLevel);
    if (resource.lt(cost)) return;

    let k = new OmegaNum(1);
    if (max) k = maxBuyableUpgrades(cfg, currentLevel, resource);

    const totalCost = getTotalCost(cfg, currentLevel, k);
    state[cfg.resource] = resource.sub(totalCost);
    state[cfg.levelRef] = currentLevel.add(k);

    if (cfg.onBuy) cfg.onBuy();
    updateUI();
}