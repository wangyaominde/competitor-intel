/**
 * 参数级对比（规格 / 价格 / 品类 / 渠道）
 * 独立于威胁判定：只做细致字段遍历，输出表格数据，不写 threat_score。
 */

function normalizeKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .replace(/[_\s\-/·.]+/g, '')
    .trim();
}

function stringifyVal(v) {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === 'string' ? x : x?.name || JSON.stringify(x)))
      .filter(Boolean)
      .join('、');
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).trim();
}

/** 从产品/竞品抽出可对比参数（基础字段 + specs 扁平键值） */
function collectParams(entity) {
  const rows = [];
  if (!entity) return rows;

  if (entity.price != null && entity.price !== '') {
    rows.push({
      key: '标价',
      norm: normalizeKey('标价'),
      value: stringifyVal(entity.price) + (entity.price_unit ? ` ${entity.price_unit}` : ''),
      raw: entity.price,
      group: 'base',
    });
  }
  if (entity.price_range) {
    rows.push({
      key: '价格区间',
      norm: normalizeKey('价格区间'),
      value: stringifyVal(entity.price_range),
      group: 'base',
    });
  }
  if (entity.category) {
    rows.push({
      key: '品类',
      norm: normalizeKey('品类'),
      value: stringifyVal(entity.category),
      group: 'base',
    });
  }
  const channels = entity.channels;
  if (Array.isArray(channels) && channels.length) {
    rows.push({
      key: '渠道',
      norm: normalizeKey('渠道'),
      value: stringifyVal(channels),
      group: 'base',
    });
  }

  const specs = entity.specs && typeof entity.specs === 'object' ? entity.specs : {};
  for (const [k, v] of Object.entries(specs)) {
    if (k == null || String(k).trim() === '') continue;
    const val = stringifyVal(v);
    if (val === '') continue;
    rows.push({
      key: String(k).trim(),
      norm: normalizeKey(k),
      value: val,
      raw: v,
      group: 'specs',
    });
  }
  return rows;
}

function pickStatus(ourVal, theirVal, ourRaw, theirRaw) {
  const o = (ourVal || '').trim();
  const t = (theirVal || '').trim();
  if (!o && !t) return 'empty';
  if (o && !t) return 'ours_only';
  if (!o && t) return 'theirs_only';
  if (o.toLowerCase() === t.toLowerCase()) return 'same';

  const on = Number(ourRaw != null ? ourRaw : o.replace(/[^\d.-]/g, ''));
  const tn = Number(theirRaw != null ? theirRaw : t.replace(/[^\d.-]/g, ''));
  if (Number.isFinite(on) && Number.isFinite(tn) && (String(o).match(/\d/) || String(t).match(/\d/))) {
    if (on === tn) return 'same';
    return on > tn ? 'ours_higher' : 'theirs_higher';
  }
  return 'diff';
}

const STATUS_LABEL = {
  same: '相同',
  diff: '不同',
  ours_only: '仅我方',
  theirs_only: '仅竞品',
  ours_higher: '我方数值高',
  theirs_higher: '竞品数值高',
  empty: '—',
};

/**
 * 单个 我方产品 × 竞品 的参数遍历对比
 */
function comparePair(product, competitor) {
  const ours = collectParams(product);
  const theirs = collectParams(competitor);

  const theirByNorm = new Map();
  for (const r of theirs) {
    if (!theirByNorm.has(r.norm)) theirByNorm.set(r.norm, r);
  }
  const usedTheir = new Set();

  const params = [];
  for (const o of ours) {
    const t = theirByNorm.get(o.norm);
    if (t) usedTheir.add(t.norm);
    const status = pickStatus(o.value, t?.value, o.raw, t?.raw);
    params.push({
      param: o.key,
      paramAlt: t && t.key !== o.key ? t.key : null,
      ourValue: o.value || '',
      theirValue: t?.value || '',
      status,
      statusLabel: STATUS_LABEL[status] || status,
      group: o.group,
    });
  }
  for (const t of theirs) {
    if (usedTheir.has(t.norm)) continue;
    const status = pickStatus('', t.value, null, t.raw);
    params.push({
      param: t.key,
      paramAlt: null,
      ourValue: '',
      theirValue: t.value || '',
      status,
      statusLabel: STATUS_LABEL[status] || status,
      group: t.group,
    });
  }

  const stats = {
    total: params.length,
    same: params.filter((p) => p.status === 'same').length,
    diff: params.filter((p) => p.status === 'diff' || p.status === 'ours_higher' || p.status === 'theirs_higher')
      .length,
    oursOnly: params.filter((p) => p.status === 'ours_only').length,
    theirsOnly: params.filter((p) => p.status === 'theirs_only').length,
  };

  return {
    productId: product?.id || null,
    productName: product?.name || '',
    competitorId: competitor?.id || null,
    competitorName: competitor?.name || '',
    company: competitor?.company || '',
    params,
    stats,
  };
}

/**
 * 全量：每个我方产品 × 每个竞品，参数一条一条对比
 * @returns 表格用扁平行 + 分块明细
 */
function buildParamCompareMatrix(products, competitors, options = {}) {
  const productList = (products || []).filter((p) => p && p.name);
  const compList = competitors || [];
  const onProgress = options.onProgress || (() => {});
  const total = Math.max(productList.length * compList.length, 1);
  let done = 0;

  const pairs = [];
  const flatRows = [];

  for (let pi = 0; pi < productList.length; pi++) {
    const p = productList[pi];
    for (let ci = 0; ci < compList.length; ci++) {
      const c = compList[ci];
      onProgress({
        stage: 'param-compare',
        productIndex: pi + 1,
        productTotal: productList.length,
        competitorIndex: ci + 1,
        competitorTotal: compList.length,
        productName: p.name,
        competitorName: c.name,
        message: `参数对比 (${done + 1}/${total}): ${p.name} × ${c.name}`,
        percent: Math.round((done / total) * 100),
      });

      const pair = comparePair(p, c);
      pairs.push(pair);

      for (const row of pair.params) {
        flatRows.push({
          productId: pair.productId,
          productName: pair.productName,
          competitorId: pair.competitorId,
          competitorName: pair.competitorName,
          company: pair.company,
          param: row.param,
          paramAlt: row.paramAlt,
          ourValue: row.ourValue,
          theirValue: row.theirValue,
          status: row.status,
          statusLabel: row.statusLabel,
          group: row.group,
        });
      }
      done += 1;
    }
  }

  onProgress({
    stage: 'done',
    message: `参数对比完成：${productList.length} 我方产品 × ${compList.length} 竞品 · ${flatRows.length} 行参数`,
    percent: 100,
  });

  return {
    type: 'param-compare',
    updatedAt: new Date().toISOString(),
    products: productList.map((p) => ({ id: p.id, name: p.name })),
    competitorCount: compList.length,
    productCount: productList.length,
    paramRowCount: flatRows.length,
    pairs,
    rows: flatRows,
  };
}

module.exports = {
  normalizeKey,
  collectParams,
  comparePair,
  buildParamCompareMatrix,
  STATUS_LABEL,
};
