function erfcinv(x) {
    // 域判断：x 应在 [0, 2] 内
    if (x < 0 || x > 2) return NaN;
    if (x === 0) return Infinity;
    if (x === 2) return -Infinity;
    if (x === 1) return 0;

    // 系数（与 Octave/GNU 实现一致）
    const a = [
        -2.806989788730439e+01,
        1.562324844726888e+02,
        -1.951109208597547e+02,
        9.783370457507161e+01,
        -2.168328665628878e+01,
        1.772453852905383e+00
    ];
    const b = [
        -5.447609879822406e+01,
        1.615858368580409e+02,
        -1.556989798598866e+02,
        6.680131188771972e+01,
        -1.328068155288572e+01
    ];
    const c = [
        -5.504751339936943e-03,
        -2.279687217114118e-01,
        -1.697592457770869e+00,
        -1.802933168781950e+00,
        3.093354679843505e+00,
        2.077595676404383e+00
    ];
    const d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e+00,
        3.754408661907416e+00
    ];

    const pbreak = 0.9515;
    let y;

    if (x <= 1 + pbreak && x >= 1 - pbreak) {
        // 中段区域：x 接近 1
        const q = 0.5 * (1 - x);
        const r = q * q;

        // 分子多项式 (a0*r^5 + a1*r^4 + ... + a5) * q
        let num = a[0];
        for (let i = 1; i < a.length; i++) num = num * r + a[i];
        num *= q;

        // 分母多项式 (b0*r^4 + b1*r^3 + ... + b4*r + 1)
        let den = b[0];
        for (let i = 1; i < b.length; i++) den = den * r + b[i];
        den = den * r + 1;

        y = num / den;
        if (x < 1 - pbreak) y = -y;
    } else {
        // 尾段区域：x 接近 0 或 2
        let q;
        if (x < 1) {
            q = Math.sqrt(-2 * Math.log(0.5 * x));
        } else {
            q = Math.sqrt(-2 * Math.log(0.5 * (2 - x)));
        }

        // 分子多项式 (c0*q^5 + c1*q^4 + ... + c5) * q
        let num = c[0];
        for (let i = 1; i < c.length; i++) num = num * q + c[i];

        // 分母多项式 d0*q^4 + d1*q^3 + ... + d3*q + 1
        let den = d[0];
        for (let i = 1; i < d.length; i++) den = den * q + d[i];
        den = den * q + 1;

        y = num / den;
        if (x < 1) y = -y;
    }

    return y;
}

function erfcinv_asymptotic(neglnx) {
    const result = neglnx.sub(neglnx.ln().mul(.5)).sub(0.5 * Math.log(Math.PI)).sqrt();
    return result;
}

function formatNumber(num) {
    if (num.gte(1e6)) {
        const str = num.toStringWithDecimalPlaces(6, true);
        const pattern = /(\d*\.?\d+)?(e)([+-]?\d*\.?\d+)$/;
        const match = str.match(pattern);

        if (!match) return str;

        const fullMatch = match[0];
        const aStr = match[1];
        const bStr = match[3];

        let a = aStr !== undefined ? parseFloat(aStr) : undefined;
        let b = parseFloat(bStr);

        if (b >= 1000000) {
            const formattedB = b.toExponential(3).replace('+', '');
            return str.replace(fullMatch, `e${formattedB}`);
        } else {
            if (a === undefined) {
                const bFloor = Math.floor(b);
                const frac = b - bFloor;
                a = Math.pow(10, frac);
                b = bFloor;
            }

            let decimals;
            if (b < 1000) decimals = 3;
            else if (b < 10000) decimals = 2;
            else if (b < 100000) decimals = 1;
            else decimals = 0;

            const formattedA = a.toFixed(decimals);
            if (a == 10) formattedA -= Math.pow(10, -decimals);
            const newAeb = `${formattedA}e${b}`;
            return str.replace(fullMatch, newAeb);
        }
    } else if (num.gte(10000) || num.eq(0)) return num.toFixed(0);
    else if (num.gte(1)) return parseFloat(num.toPrecision(5));
    else if (num.gte(.01)) return parseFloat(num.toFixed(4));
    else return num.toExponential(3);
}

function formatTime(t) {
    if (t.isInfinite()) return 'Forever';
    if (t.gte(31536000)) {
        const y = t.div(31536000).floor();
        return `${formatNumber(y)}y ${y.gte(1e6) ? '' : `${formatTime(t.mod(31536000))}`}`;
    } else if (t.gte(86400)) {
        const d = t.div(86400).floor();
        return `${formatNumber(d)}d ${formatTime(t.mod(86400))}`;
    } else if (t.gte(3600)) {
        const h = t.div(3600).floor();
        return `${formatNumber(h)}h ${formatTime(t.mod(3600))}`;
    } else if (t.gte(60)) {
        const m = t.div(60).floor()
        return `${formatNumber(m)}m ${formatTime(t.mod(60))}`;
    } else return t.gt(0) ? `${formatNumber(t)}s` : ''
}

// 截断抽样：从半正态分布的顶部 1/L 部分抽取
function drawReward(L) {
    let recChance, value;
    if (L.gte(1e100)) {
        recChance = L;
        if (L.lt('ee6')) recChance = recChance.mul(1 / Math.random());
        value = erfcinv_asymptotic(recChance.ln());
    } else {
        const chance = Math.random() / L.toNumber();
        value = new OmegaNum(Math.sqrt(2) * erfcinv(chance));
        recChance = new OmegaNum(1 / chance);
    }
    return { value: value, recChance: recChance };
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
