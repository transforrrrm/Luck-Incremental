const DEFAULT_GAME = {
    gameTime: 0,
    luckPoints: new OmegaNum(0),
    luckyFactor: new OmegaNum(1),
    drawCooldown: 1000,
    upgradeExpLevel: new OmegaNum(0),
    upgradeSigLevel: new OmegaNum(0),
    luckyUpgradeUnlocked: false,
    expUpgradeUnlocked: false,
    sigUpgradeUnlocked: false,

    hasPrestiged: false,
    luckyEssence: new OmegaNum(0),
    luckGeneratorUnlocked: false,
    investedEssence: new OmegaNum(0),
    luckValue: new OmegaNum(0),

    totalLuckPoints: new OmegaNum(0),
    totalDraws: new OmegaNum(0),
    maxSingleReward: new OmegaNum(0),
    luckiestRecord: { value: new OmegaNum(0), recChance: new OmegaNum(0) },
    prestigeCount: new OmegaNum(0),
    totalLuckEssence: new OmegaNum(0),
    maxSingleEssence: new OmegaNum(0),
    fastestPrestige: Infinity,
    timeSincePrestige: 0,
    luckiestThisPrestige: { value: new OmegaNum(0), recChance: new OmegaNum(0) },
    currentTab: 'home',
    currentSubTab: { achievements: 'normal' },
    completedAchievements: [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false]
    ],
    completedHiddenAchievements: [
        [false, false, false, false, false, false, false, false],
        [false]
    ]
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
    if (Array.isArray(target)) {
        const result = new Array(target.length);
        for (let i = 0; i < target.length; i++) {
            const targetVal = target[i];
            const sourceVal = source?.[i];
            if (targetVal instanceof Object && !(targetVal instanceof OmegaNum)) {
                result[i] = deepMerge(targetVal, sourceVal || {});
            } else {
                result[i] = sourceVal !== undefined ? sourceVal : targetVal;
            }
        }
        return result;
    }

    if (target instanceof Object) {
        const result = { ...target };
        for (const key in target) {
            const targetVal = target[key];
            const sourceVal = source?.[key];
            if (targetVal instanceof Object && !(targetVal instanceof OmegaNum)) {
                result[key] = deepMerge(targetVal, sourceVal || {});
            } else {
                result[key] = sourceVal !== undefined ? sourceVal : targetVal;
            }
        }
        return result;
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