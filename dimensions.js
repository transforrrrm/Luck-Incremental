const DRAWER_BASE_COST = [1, 1e4, 1e5, 1e7, 1e9, 1e11, 1e13, 1e15];
const DRAWER_COST_SCALING = [1e3, 1e4, 1e5, 1e6, 1e8, 1e10, 1e12, 1e15];
const CLICKER_UNLOCK = [1e30, 1e66, 1e69, 1e73, 1e78, 1e84, 1e91, 1e99];
const CLICKER_BASE_COST = [1e17, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10];
const CLICKER_COST_SCALING = [1e3, 1e6, 1e8, 1e10, 1e15, 1e20, 1e25, 1e30];

function createDimUpgrade(type, index) {
    return {
        name: `自动${type === 'drawer' ? '抽取' : '点击'}器 #${index}`,
        resource: 'luckyEssence',
        baseCost: (type === 'drawer' ? DRAWER_BASE_COST : CLICKER_BASE_COST)[index - 1],
        costType: 'geometric',
        ratio: (type === 'drawer' ? DRAWER_COST_SCALING : CLICKER_COST_SCALING)[index - 1],
        effect: (level) => ({
            mult: OmegaNum.pow(2, level).mul(calcExtraMults(type, index)),
            production: getDimAmount(type, index).mul(OmegaNum.pow(2, level)).mul(calcExtraMults(type, index)),
        }),
        effectText: (effect) => {
            const amount = getDimAmount(type, index);
            let rateText = '';
            if (index !== 8) {
                const delta = getUpgradeEffect(`${type}${index + 1}`).production.div(20);
                rateText = formatRate(amount, delta, 0.05);
            }
            return `${formatNumber(amount)}${rateText} ×${formatNumber(effect.mult)}`;
        },
        ...(type !== 'drawer' ? { unlockCondition: CLICKER_UNLOCK[index - 1] } : {}),
        displayCondition: (state) => {
            if (index === 1) return true;
            return getUpgradeLevel(`${type}${index - 1}`).gt(0);
        },
        onBuy: (state) => {
            produceDim(type, index, 1);
            if (type === 'drawer' && (index === 1 || index === 8)) {
                const achCol = (index === 1) ? 1 : 7;
                if (!state.completedAchievements[2][achCol - 1]) completeAchievement(3, achCol);
            }
        },
        containerId: `${type}UpgradeBlock`,
        updateTab: 'automation'
    };
}

for (let i = 1; i <= 8; i++) {
    UPGRADE_LIST[`drawer${i}`] = createDimUpgrade('drawer', i);
    UPGRADE_LIST[`clicker${i}`] = createDimUpgrade('clicker', i);
}

function getDimAmount(type, index) {
    return state.dimensions[type][index - 1];
}

function setDimAmount(type, index, value) {
    state.dimensions[type][index - 1] = value;
}

function produceDim(type, index, value) {
    state.dimensions[type][index - 1] = state.dimensions[type][index - 1].add(value);
}

function calcExtraMults(type, index) {
    switch (type) {
        case 'drawer':
            switch (index) {
                case 1:
                    const completedRow3 = state.completedAchievements[2].filter(v => v === true).length;
                    return Math.pow(1.1, completedRow3);
                default:
                    return 1;
            }
        case 'clicker':
            return 1;
    }
}

function processDimension(type) {
    const dims = state.dimensions[type];
    const dimTimer = dimTimers[type];
    for (let i = dims.length - 1; i >= 0; i--) {
        const production = getUpgradeEffect(`${type}${i + 1}`).production;
        if (production.eq(0)) continue;
        if (production.lt(20)) {
            dimTimer[i] += .05;
            const interval = production.rec().toNumber();
            if (dimTimer[i] >= interval) {
                dimTimer[i] -= interval;
                if (i === 0) type === 'drawer' ? performDraw(true) : increaseLucky(true);
                else dims[i - 1] = dims[i - 1].add(1);
            }
        } else {
            if (i === 0) {
                if (type === 'drawer') {
                    performDraw(true);
                    if (!state.completedAchievements[2][1] && production.gte(100)) {
                        completeAchievement(3, 2);
                    }
                }
                else increaseLucky(true);
            }
            else dims[i - 1] = dims[i - 1].add(production.div(20));
        }
    }
}