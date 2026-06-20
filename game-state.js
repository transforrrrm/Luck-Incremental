const DEFAULT_GAME = {
    gameTime: 0,
    luckPoints: new OmegaNum(0),
    luckyFactor: new OmegaNum(1),
    drawCooldown: 1000,
    upgradeLevels: {
        luck: new OmegaNum(0),
        sigma: new OmegaNum(0),
        essence: new OmegaNum(0),
        drawer1: new OmegaNum(0),
        drawer2: new OmegaNum(0),
        drawer3: new OmegaNum(0),
        drawer4: new OmegaNum(0),
        drawer5: new OmegaNum(0),
        drawer6: new OmegaNum(0),
        drawer7: new OmegaNum(0),
        drawer8: new OmegaNum(0),
        clicker1: new OmegaNum(0),
        clicker2: new OmegaNum(0),
        clicker3: new OmegaNum(0),
        clicker4: new OmegaNum(0),
        clicker5: new OmegaNum(0),
        clicker6: new OmegaNum(0),
        clicker7: new OmegaNum(0),
        clicker8: new OmegaNum(0)
    },
    oneShotPurchased: {
        U: [false, false, false, false, false, false, false, false, false]
    },
    luckyUpgradeUnlocked: false,
    sigUpgradeUnlocked: false,

    hasPrestiged: false,
    luckyEssence: new OmegaNum(0),
    luckGeneratorUnlocked: false,
    investedEssence: new OmegaNum(0),
    luckValue: new OmegaNum(0),
    chanceUpgradeUnlocked: false,

    automationUnlocked: false,
    clickersUnlocked: false,
    dimensions: {
        drawer: [new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0)],
        clicker: [new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0), new OmegaNum(0)]
    },

    totalLuckPoints: new OmegaNum(0),
    totalDraws: new OmegaNum(0),
    maxSingleReward: new OmegaNum(0),
    luckiestRecord: { value: new OmegaNum(0), recChance: new OmegaNum(0) },
    prestigeCount: new OmegaNum(0),
    totalLuckEssence: new OmegaNum(0),
    maxSingleEssence: new OmegaNum(0),
    fastestPrestige: 1.79e308,
    timeSincePrestige: 0,
    luckiestThisPrestige: { value: new OmegaNum(0), recChance: new OmegaNum(0) },
    currentTab: 'home',
    currentSubTab: { prestige: 'generator', achievements: 'normal' },
    completedAchievements: [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false]
    ],
    completedHiddenAchievements: [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false]
    ],
    maxLuckValue: new OmegaNum(0),
    hasLuckValueExceeded40: false,

    singlePurchaseCount: 0,

    version: '0.1.3'
};

const SAVE_KEY = 'LuckyIncrementalSave';

function saveGame() {
    localStorage.setItem(SAVE_KEY, btoa(JSON.stringify(state)));
    showNotification("游戏已保存", 'success');
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
        const data = convertToOmegaNum(JSON.parse(atob(raw)));
        state = deepMerge(DEFAULT_GAME, data);
    } catch (e) {
        console.warn(e);
    }
}

function deepMerge(target, source) {
    if (source === undefined) return target;

    if (Array.isArray(target)) {
        if (!Array.isArray(source)) return target;
        const result = new Array(target.length);
        for (let i = 0; i < target.length; i++) {
            result[i] = deepMerge(target[i], source[i]);
        }
        return result;
    }

    if (target instanceof OmegaNum) {
        if (typeof source === 'number' || source instanceof OmegaNum) {
            return new OmegaNum(source);
        }
        return target;
    }

    if (target !== null && typeof target === 'object') {
        if (source === null || typeof source !== 'object' || Array.isArray(source) || source instanceof OmegaNum) {
            return target;
        }
        const result = { ...target };
        for (const key in target) {
            result[key] = deepMerge(target[key], source[key]);
        }
        return result;
    }

    if (typeof source === typeof target) {
        return source;
    } else {
        return target;
    }
}

function isOmegaNumObject(obj) {
    return obj && typeof obj === 'object' &&
        Array.isArray(obj.array) && typeof obj.sign === 'number';
}

function convertToOmegaNum(obj) {
    for (const key in obj) {
        const val = obj[key];
        if (isOmegaNumObject(val)) {
            obj[key] = new OmegaNum(val);
        } else if (val && typeof val === 'object') {
            convertToOmegaNum(val);
        }
    }
    return obj;
}