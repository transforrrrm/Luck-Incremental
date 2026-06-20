const ACHIEVEMENTS = [
    [
        { name: '3σ原则', desc: '达到3σ。\n每完成一个第一行中的成就，抽取冷却时间/1.1。' },
        { name: '原子幸运', desc: '幸运乘数达到1e80。' },
        { name: '无限幸运', desc: '幸运乘数达到1.79e308。' },
        { name: '矮胖曲线', desc: '购买标准差升级。' },
        { name: '百倍标准差', desc: '达到100σ。' },
        { name: '这生产线该重建了', desc: 'σ达到10。' },
        { name: '浓缩的都是精华', desc: '进行一次推进重置。' },
        { name: '高级幸运', desc: '幸运值达到5。' }
    ],
    [
        { name: '你的重置速度击败了10%的玩家', desc: '在1min内进行一次推进重置。\n每完成一个第二行中的成就，抽取冷却时间/1.21。' },
        { name: '单调递增', desc: '在解锁幸运生成器后的连续10次抽取中，每一次的幸运点都比上一次高。' },
        { name: '臭死了哼哼啊', desc: '抽到超过114514幸运点。' },
        { name: '欧吃矛', desc: '在幸运乘数<10时达到10σ。' },
        { name: '无限猴子定理', desc: '幸运乘数达到e7.456e6。' },
        { name: '推进器', desc: '购买第一个推进升级。' },
        { name: '真·无限幸运', desc: '每次点击增加的幸运乘数超过1.79e308。' },
        { name: '这玩意已经没用了', desc: '在幸运乘数为1时进行一次推进重置。\n完成前两行成就后将去除抽取冷却时间。' }
    ],
    [
        { name: '自动纪元', desc: '购买第一个自动抽取器。\n每完成一个第三行中的成就，自动抽取速度×1.1。' },
        { name: '你不能加自动点击器！', desc: '自动抽取速度达到100/s。' },
        { name: '你刚才...重置了？', desc: '在0.05s内进行一次推进重置。' },
        { name: '我就升亿级', desc: '标准差升级达到1e8级。' },
        { name: '求求你别刷了', desc: '推进20000次。\n奖励：推进次数获取×10。' },
        { name: '你是一个一个一个', desc: '一次重置获得超过114514幸运精华。' },
        { name: '8次方增长', desc: '购买第八个自动抽取器。' },
        { name: '量子隧穿', desc: '幸运乘数达到e2.25e23。\n奖励：在生成器界面解锁一个升级。' } // 目前还没有
    ],
];

const HIDDEN_ACHIEVEMENTS = [
    [
        { name: '倒霉常数', descUnfinished: '你也够倒霉的。', descFinished: '连续22次抽取没有达到2σ。\n概率：1/2.7857, ≈1/e' },
        { name: '我免费了', descUnfinished: '我是免费的。', descFinished: '点击这个成就。' },
        { name: '安全第一', descUnfinished: '它已经够安全了。', descFinished: '在30s内手动保存100次。' },
        { name: '纯狗运', descUnfinished: '说明你运气很好了。', descFinished: '你每秒有1/100000的概率获得这个成就。' },
        { name: '就差一点', descUnfinished: '为什么不再点一下？', descFinished: '点击硬重置按钮9次后切换界面。' },
        { name: '666，开桂了', descUnfinished: '立马停止你的开桂行为！', descFinished: '打开控制台。' },
        { name: '洋务啥呢？', descUnfinished: '看这玩意干什么？玩游戏去！', descFinished: '盯着统计界面看15min。' },
        { name: '遵循指令', descUnfinished: '...你确实遵循了指令。', descFinished: '在导入文本时输入"文本"。' }
    ],
    [
        { name: '说明你是入机', descUnfinished: '因为你是入机。', descFinished: '连续80s幸运值没有增加。\n概率：1/60.55, ≈1/e⁴。' },
        { name: '我们应该告诉他购买最大吗...', descUnfinished: '你纯手点的啊？', descFinished: '买10000次单次升级。' },
        { name: '我们不招募开发者', descUnfinished: '这不是“加入我们”链接。', descFinished: '点10次版本号。' },
        { name: '不可能！绝对不可能！', descUnfinished: '说明你是真入机。', descFinished: '在购买U9后，幸运值降低到比购买U9后的最高幸运值还少10。' },
        { name: '我绝对不关连点器', descUnfinished: '你是不是开会员了？', descFinished: '在自动抽取速度大于100时，10s内点击200次以上抽取按钮。' },
        { name: '大起大落', descUnfinished: '你的人生充满戏剧性。', descFinished: '幸运值超过40后掉回0。' } // 这是我亲身经历啊!
    ]
];

function refreshDrawCooldown() {
    if (state.drawCooldown === 0) return;
    const completedRow1 = state.completedAchievements[0].filter(v => v === true).length;
    const completedRow2 = state.completedAchievements[1].filter(v => v === true).length;
    if (completedRow1 + completedRow2 === 16) {
        state.drawCooldown = 0;
        state.automationUnlocked = true;
        elements.drawBtn.textContent = '抽取随机数';
        elements.drawBtn.classList.remove('disabled');
        elements.automationTab.classList.remove('hidden');
    } else {
        const divisor1 = Math.pow(1.1, completedRow1);
        const divisor2 = Math.pow(1.21, completedRow2);
        state.drawCooldown = 1000 / (divisor1 * divisor2);
    }
}

function completeAchievement(row, col) {
    const i = row - 1;
    const j = col - 1;
    if (state.completedAchievements[i][j]) return;
    state.completedAchievements[i][j] = true;
    if (row === 1 || row === 2) refreshDrawCooldown();
    showNotification(`成就达成：${ACHIEVEMENTS[i][j].name}`, 'ach');
    const ach = elements.normalAch.querySelector(`.ach-card[data-index="${row}${col}"]`);
    ach.classList.add('completed');
    updateUI();
}

function completeHiddenAchievement(row, col) {
    const i = row - 1;
    const j = col - 1;
    if (state.completedHiddenAchievements[i][j]) return;
    state.completedHiddenAchievements[i][j] = true;
    showNotification(`隐藏成就解锁：${HIDDEN_ACHIEVEMENTS[i][j].name}`, 'ach');
    const ach = elements.hiddenAch.querySelector(`.ach-card[data-index="${row}${col}"]`);
    ach.classList.add('completed');
    const desc = HIDDEN_ACHIEVEMENTS[i][j].descFinished;
    ach.setAttribute('data-tooltip', desc);
    updateUI();
}

function checkLuckyFactor() {
    if (!state.completedAchievements[0][1] && state.luckyFactor.gte(1e80)) {
        completeAchievement(1, 2);
    }
    if (!state.completedAchievements[0][2] && state.luckyFactor.gte(OmegaNum.pow(2, 1024))) {
        completeAchievement(1, 3);
    }
    if (!state.completedAchievements[1][4] && state.luckyFactor.gte('e7.456e6')) {
        completeAchievement(2, 5);
    }
    if (!state.completedAchievements[2][7] && state.luckyFactor.gte('e2.25e23')) {
        completeAchievement(3, 8);
        state.chanceUpgradeUnlocked = true;
    }
}

function checkSigma() {
    if (!state.completedAchievements[0][5] && calcSigma().gte(10)) {
        completeAchievement(1, 6);
    }
}

function checkValue(value) {
    if (!state.completedHiddenAchievements[0][0] && !state.luckyUpgradeUnlocked) {
        if (value.lt(2)) {
            consecutiveBelow2Sigma++;
            if (consecutiveBelow2Sigma >= 22) {
                completeHiddenAchievement(1, 1);
                consecutiveBelow2Sigma = 0;
            }
        } else {
            consecutiveBelow2Sigma = 0;
        }
    }

    if (!state.completedAchievements[0][0] && value.gte(3)) completeAchievement(1, 1);
    if (!state.completedAchievements[0][4] && value.gte(100)) completeAchievement(1, 5);
    if (!state.completedAchievements[1][3] && value.gte(10) && state.luckyFactor.lt(10)) {
        completeAchievement(2, 4);
    }

    if (!state.luckyUpgradeUnlocked && value.gte(2)) {
        state.luckyUpgradeUnlocked = true;
        elements.luckUpgradeBlock.classList.remove('hidden');
        elements.luckUpgradeTitle.textContent = '幸运升级';
    }
    if (!state.sigUpgradeUnlocked && value.gte(80)) {
        state.sigUpgradeUnlocked = true;
        elements.sigUpgradeBlock.classList.remove('hidden');
        elements.sigmaUpgradeTitle.textContent = '标准差升级';
    }
    if (!state.clickersUnlocked && value.gte(1e9)) {
        state.clickersUnlocked = true;
        elements.clickerEffect.classList.remove('hidden');
    }
}

// 隐藏成就12检测
function setupAchievementClickHandler() {
    const hiddenAchContainer = elements.hiddenAch;
    hiddenAchContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.ach-card');
        if (!card) return;
        const index = card.getAttribute('data-index');
        if (index === '12' && !state.completedHiddenAchievements[0][1]) {
            completeHiddenAchievement(1, 2);
        }
    });
}

function checkHiddenAchievements() {
    setInterval(() => {
        const now = Date.now();
        if (!state.completedHiddenAchievements[0][3]) {
            if (Math.random() < 1 / 100000) completeHiddenAchievement(1, 4);
        }
        if (state.currentTab === 'stats' && !state.completedHiddenAchievements[0][6]) {

            if (now - lastStatsViewTimestamp >= 900000) completeHiddenAchievement(1, 7);
        }
    }, 1000);

    let devtoolsCheckTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(devtoolsCheckTimeout);
        devtoolsCheckTimeout = setTimeout(() => {
            if (!state.completedHiddenAchievements[0][5]) {
                const threshold = 160;
                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                if (widthThreshold || heightThreshold) completeHiddenAchievement(1, 6);
            }
        }, 1000); // 停止调整后 1 秒检查，避免高频触发
    });
}

function initAchievements() {
    setupAchievementClickHandler();
    checkHiddenAchievements();
}