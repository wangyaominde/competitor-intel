/**
 * 与桌面端同壳的交互 Demo
 * 样式复用 styles/app.css；仅逻辑与数据为浏览器模拟
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.DEMO;
  if (!D) {
    console.error('DEMO data missing');
    return;
  }

  const state = {
    page: 'dashboard',
    scanning: false,
    compareRows: null,
    filterStatus: '',
  };

  const TITLES = {
    dashboard: ['仪表盘', '威胁态势与待确认竞品'],
    competitors: ['竞品库', '筛选 · 卡片 · 点开详情'],
    scan: ['智能扫描', 'LLM 研究 + BM25/RAG 自动威胁（Demo 动画）'],
    compare: ['参数对比', '规格参数逐项对齐 · 不写入威胁判定'],
    product: ['我的产品', 'Demo 基准产品画像'],
    space: ['威胁空间', '轻量 2D 示意（桌面端为 Three.js 3D）'],
    settings: ['设置', 'Demo 只读展示'],
  };

  const PIPE = [
    { id: 'start', label: '启动', hint: '初始化任务', color: 'cyan' },
    { id: 'discover', label: '发现', hint: 'Discover 研究候选', color: 'violet' },
    { id: 'enrich', label: '补全', hint: 'Enrich 价格/规格/渠道', color: 'amber' },
    { id: 'threat', label: '威胁', hint: 'BM25 + RAG 评分', color: 'rose' },
    { id: 'verify', label: '校验', hint: 'Agent 交叉确认', color: 'teal' },
    { id: 'done', label: '完成', hint: '入库待筛选', color: 'lime' },
  ];

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function pct(n) {
    return Math.round((Number(n) || 0) * 100);
  }
  function threatClass(s) {
    if (s >= 0.65) return 'threat-high';
    if (s >= 0.4) return 'threat-mid';
    return 'threat-low';
  }
  function money(v) {
    if (v == null || v === '') return '—';
    return `$${v}`;
  }
  function clampText(s, max = 48) {
    const t = String(s ?? '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
  }
  function toast(msg, type = 'info') {
    const root = $('#toasts');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function avatarText(name) {
    return String(name || '?').trim().charAt(0).toUpperCase();
  }
  function normKey(k) {
    return String(k || '')
      .toLowerCase()
      .replace(/（[^）]*）|\([^)]*\)/g, '')
      .replace(/[_\s\-/·.]+/g, '');
  }
  function collectParams(entity) {
    const rows = [];
    if (entity.price != null) rows.push({ key: '标价', value: String(entity.price) });
    if (entity.price_range) rows.push({ key: '价格区间', value: entity.price_range });
    if (entity.category) rows.push({ key: '品类', value: entity.category });
    if (entity.channels?.length) rows.push({ key: '渠道', value: entity.channels.join('、') });
    for (const [k, v] of Object.entries(entity.specs || {})) {
      rows.push({ key: k, value: String(v) });
    }
    return rows.map((r) => ({ ...r, norm: normKey(r.key) }));
  }
  function comparePair(product, comp) {
    const ours = collectParams(product);
    const theirs = collectParams(comp);
    const map = new Map(theirs.map((t) => [t.norm, t]));
    const used = new Set();
    const out = [];
    const label = {
      same: '相同',
      diff: '不同',
      ours_only: '仅我方',
      theirs_only: '仅竞品',
    };
    for (const o of ours) {
      const t = map.get(o.norm);
      if (t) used.add(t.norm);
      let status = 'diff';
      if (!t) status = 'ours_only';
      else if ((o.value || '').toLowerCase() === (t.value || '').toLowerCase()) status = 'same';
      out.push({
        productName: product.name,
        competitorName: comp.name,
        competitorId: comp.id,
        param: o.key,
        ourValue: o.value,
        theirValue: t?.value || '',
        status,
        statusLabel: label[status],
      });
    }
    for (const t of theirs) {
      if (used.has(t.norm)) continue;
      out.push({
        productName: product.name,
        competitorName: comp.name,
        competitorId: comp.id,
        param: t.key,
        ourValue: '',
        theirValue: t.value,
        status: 'theirs_only',
        statusLabel: label.theirs_only,
      });
    }
    return out;
  }

  function compCard(c) {
    const channels = (c.channels || [])
      .slice(0, 3)
      .map((ch) => `<span class="chip" title="${esc(ch)}">${esc(clampText(ch, 18))}</span>`)
      .join('');
    return `
      <div class="comp-card" data-open="${esc(c.id)}">
        <div class="comp-card-head">
          <div class="avatar">${esc(avatarText(c.name))}</div>
          <div class="item-main">
            <div class="item-title" title="${esc(c.name)}">${esc(c.name)}</div>
            <div class="item-sub">${esc(c.company || '—')}</div>
          </div>
          <span class="threat-pill ${threatClass(c.threat)}">${pct(c.threat)}%</span>
        </div>
        <div class="threat-bar"><i style="width:${pct(c.threat)}%"></i></div>
        <div class="comp-card-meta">
          <div>
            <div class="k">价格</div>
            <div class="v" title="${esc(c.price_range || '')}">
              <span class="price-main">${esc(money(c.price))}</span>
              ${c.price_range ? `<span class="price-range"> · ${esc(clampText(c.price_range, 40))}</span>` : ''}
            </div>
          </div>
          <div>
            <div class="k">状态</div>
            <div class="v is-short"><span class="status-dot status-${c.status === 'pending' ? 'pending' : 'confirmed'}"></span>${
              c.status === 'pending' ? '待确认' : '已确认'
            }</div>
          </div>
          <div>
            <div class="k">方法</div>
            <div class="v is-short">RAG+BM25</div>
          </div>
          <div>
            <div class="k">渠道数</div>
            <div class="v is-short">${(c.channels || []).length}</div>
          </div>
        </div>
        <div class="comp-card-channels">${channels || '<span class="muted">无渠道</span>'}</div>
        <div class="comp-card-actions">
          <button type="button" class="btn sm" data-open="${esc(c.id)}">详情</button>
          ${c.status === 'pending' ? '<button type="button" class="btn sm success" data-demo-confirm>确认</button>' : ''}
        </div>
      </div>`;
  }

  function pageDashboard() {
    const list = D.competitors;
    const high = list.filter((c) => c.threat >= 0.5).length;
    const pending = list.filter((c) => c.status === 'pending').length;
    const avg = list.reduce((s, c) => s + c.threat, 0) / Math.max(list.length, 1);
    const top = list
      .slice()
      .sort((a, b) => b.threat - a.threat)
      .map(
        (c) => `
      <div class="list-item" data-open="${esc(c.id)}">
        <div class="avatar">${esc(avatarText(c.name))}</div>
        <div class="item-main">
          <div class="item-title">${esc(c.name)}</div>
          <div class="item-sub">${esc(c.company)} · ${esc(c.price_range || money(c.price))}</div>
        </div>
        <span class="threat-pill ${threatClass(c.threat)}">${pct(c.threat)}%</span>
      </div>`
      )
      .join('');

    return `
      <div class="banner">
        <span>Demo 数据 · 基准产品 <strong>${esc(D.product.name)}</strong> · 与桌面端同壳同样式</span>
        <button type="button" class="btn sm" data-goto="scan">去扫描</button>
      </div>
      <div class="grid stats">
        <div class="card stat-card">
          <div class="stat-label">竞品总量</div>
          <div class="stat-value">${list.length}</div>
          <div class="stat-hint">已确认 ${list.length - pending} · 待确认 ${pending}</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">高威胁</div>
          <div class="stat-value" style="color:var(--danger)">${high}</div>
          <div class="stat-hint">威胁指数 ≥ 50%（Demo）</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">平均威胁</div>
          <div class="stat-value">${pct(avg)}%</div>
          <div class="stat-hint">示例库均值</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">就绪度</div>
          <div class="stat-value">100%</div>
          <div class="stat-hint">Demo 已配置完成</div>
        </div>
      </div>
      <div class="grid two section-gap">
        <div class="card">
          <h3>最具威胁</h3>
          ${top}
        </div>
        <div class="card">
          <h3>待确认队列</h3>
          ${
            list
              .filter((c) => c.status === 'pending')
              .map(
                (c) => `
            <div class="list-item" data-open="${esc(c.id)}">
              <div class="avatar">${esc(avatarText(c.name))}</div>
              <div class="item-main">
                <div class="item-title">${esc(c.name)}</div>
                <div class="item-sub">待人工确认 · ${pct(c.threat)}%</div>
              </div>
              <div class="row-actions">
                <button type="button" class="btn sm success" data-demo-confirm>确认</button>
              </div>
            </div>`
              )
              .join('') || '<p class="muted empty-hint">没有待确认项</p>'
          }
        </div>
      </div>`;
  }

  function pageCompetitors() {
    return `
      <div class="banner">
        <span>自动：BM25+RAG 威胁分 · <strong>参数对比</strong>不改判定</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn sm primary" data-goto="compare">参数对比表</button>
          <button type="button" class="btn sm" data-demo-toast="Demo：全库重算仅演示">全库重算判定</button>
        </div>
      </div>
      <div class="toolbar">
        <input class="search" type="text" placeholder="搜索名称 / 公司…" id="comp-search" />
        <select id="comp-status">
          <option value="">全部状态</option>
          <option value="pending">待人工确认</option>
          <option value="confirmed">已确认</option>
        </select>
        <div class="view-tabs">
          <button type="button" class="active">卡片</button>
          <button type="button" data-goto="space">空间图</button>
          <button type="button" data-goto="compare">参数对比</button>
        </div>
        <div class="spacer"></div>
        <button type="button" class="btn primary" data-goto="scan">去扫描</button>
      </div>
      <div class="comp-grid" id="comp-grid">
        ${D.competitors.map(compCard).join('')}
      </div>`;
  }

  function pageScan() {
    const lamps = PIPE.map(
      (step, i) => `
      <div class="scan-pipe-step" data-step="${step.id}" data-color="${step.color}">
        ${i > 0 ? '<div class="scan-pipe-link" aria-hidden="true"><i></i></div>' : ''}
        <div class="scan-lamp">
          <span class="scan-lamp-core"></span>
          <span class="scan-lamp-ring"></span>
          <span class="scan-lamp-glow"></span>
        </div>
        <div class="scan-pipe-meta">
          <strong>${esc(step.label)}</strong>
          <span class="scan-step-hint">${esc(step.hint)}</span>
        </div>
      </div>`
    ).join('');

    return `
      <div class="card scan-hero-card">
        <div class="scan-pipeline idle" id="scan-pipeline">
          <div class="scan-pipeline-head">
            <div class="scan-pipeline-head-main">
              <div class="scan-pipeline-title">流水线状态</div>
              <div class="scan-pipeline-sub" id="scan-stage">就绪 · 点击开始扫描演示</div>
              <div class="scan-live-row">
                <span class="scan-live-dot"></span>
                <span class="scan-live-text" id="scan-live-text">待命</span>
                <span class="scan-live-sep">·</span>
                <span class="scan-elapsed" id="scan-elapsed">0s</span>
                <span class="scan-live-sep">·</span>
                <span class="scan-activity" id="scan-activity">Demo 动画，无真实 API</span>
              </div>
            </div>
            <div class="scan-pipeline-pct"><span id="scan-pct-num">0</span>%</div>
          </div>
          <div class="scan-pipeline-track">${lamps}<div class="scan-pipeline-sweep" aria-hidden="true"></div></div>
          <div class="progress scan-progress-bar"><i id="scan-progress"></i></div>
        </div>
      </div>
      <div class="scan-layout">
        <div class="card scan-form-card">
          <h3>发起扫描</h3>
          <div class="form-group">
            <label>搜索意图（可选）</label>
            <textarea id="scan-query" placeholder="例如：AI 简历 ATS 求职工具">AI 简历 ATS 优化 求职工具</textarea>
            <div class="hint">Demo 忽略输入，固定播放示例流程</div>
          </div>
          <div class="form-group">
            <label>候选数量</label>
            <select><option>8</option></select>
          </div>
          <div class="flex-between scan-form-actions">
            <span class="muted" style="font-size:12px">指示灯随阶段变色闪烁</span>
            <button type="button" class="btn primary" id="btn-run-scan"><span class="btn-label">开始扫描</span></button>
          </div>
        </div>
        <div class="card scan-log-card">
          <div class="scan-log-head">
            <h3>运行日志</h3>
            <span class="muted" style="font-size:12px">结构化 · Demo</span>
          </div>
          <div class="scan-console" id="scan-console">
            <div class="scan-log-placeholder muted">等待扫描任务…</div>
          </div>
        </div>
      </div>`;
  }

  function pageCompare() {
    if (!state.compareRows) {
      return `
        <div class="card compare-empty">
          <h3 style="margin-bottom:8px">参数对比表</h3>
          <p class="muted" style="margin-bottom:14px;line-height:1.65">
            对 <strong>${esc(D.product.name)}</strong> × 各竞品，把<strong>规格参数逐项</strong>对齐（标价、品类、渠道 + specs）。
            <br/>只做分析，<strong>不写入威胁判定</strong>——与桌面端一致。
          </p>
          <button type="button" class="btn primary" id="btn-build-compare">生成参数对比表</button>
        </div>`;
    }
    const st = state.filterStatus;
    const rows = state.compareRows.filter((r) => {
      if (!st) return true;
      if (st === 'diff') return r.status === 'diff' || r.status === 'ours_only' || r.status === 'theirs_only';
      return r.status === st;
    });
    return `
      <div class="card compare-toolbar">
        <div>
          <h3 style="margin:0 0 4px">参数对比 · 1 我方 × ${D.competitors.length} 竞品</h3>
          <p class="muted" style="font-size:12px;margin:0">共 ${state.compareRows.length} 行 · 显示 ${rows.length} · <strong>不改判定</strong></p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select id="cmp-filter">
            <option value="">全部状态</option>
            <option value="diff" ${st === 'diff' ? 'selected' : ''}>不同 / 仅一方</option>
            <option value="same" ${st === 'same' ? 'selected' : ''}>相同</option>
            <option value="ours_only" ${st === 'ours_only' ? 'selected' : ''}>仅我方</option>
            <option value="theirs_only" ${st === 'theirs_only' ? 'selected' : ''}>仅竞品</option>
          </select>
          <button type="button" class="btn sm" id="btn-build-compare">重新生成</button>
        </div>
      </div>
      <div class="dim-table-wrap compare-table-wrap">
        <table class="table compare-table param-compare-table">
          <thead>
            <tr>
              <th class="sticky-col">我方产品</th>
              <th>竞品</th>
              <th>参数</th>
              <th>我方值</th>
              <th>竞品值</th>
              <th>对比</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr class="param-row status-${esc(r.status)}" data-open="${esc(r.competitorId)}">
                <td class="sticky-col"><div class="item-title">${esc(r.productName)}</div></td>
                <td><div class="item-title">${esc(r.competitorName)}</div></td>
                <td><strong>${esc(r.param)}</strong></td>
                <td class="param-val">${esc(r.ourValue || '—')}</td>
                <td class="param-val">${esc(r.theirValue || '—')}</td>
                <td><span class="param-status st-${esc(r.status)}">${esc(r.statusLabel)}</span></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="muted" style="font-size:12px;margin-top:8px">点击行打开竞品详情。</p>`;
  }

  function pageProduct() {
    const p = D.product;
    const specs = Object.entries(p.specs || {})
      .map(([k, v]) => `<span class="chip blue">${esc(k)}: ${esc(v)}</span>`)
      .join(' ');
    return `
      <div class="card">
        <h3>当前基准</h3>
        <div class="kv">
          <div class="k">名称</div><div>${esc(p.name)}</div>
          <div class="k">品类</div><div>${esc(p.category || '—')}</div>
          <div class="k">渠道</div><div>${esc((p.channels || []).join('、') || '—')}</div>
        </div>
        <h3 style="margin:16px 0 8px;font-size:13px">规格</h3>
        <div>${specs}</div>
        <p class="hint muted" style="margin-top:14px">Demo 只读。桌面端可上传规格书、多产品切换。</p>
      </div>`;
  }

  function pageSpace() {
    return `
      <div class="card" style="padding:0;overflow:hidden">
        <div class="demo-space">
          <canvas id="space-canvas"></canvas>
          <div class="hint">蓝钻 = ${esc(D.product.name)} · 球 = 竞品（桌面端为可旋转 3D）</div>
        </div>
      </div>
      <p class="muted" style="font-size:12px;margin-top:8px">完整 Three.js 交互请下载桌面版 Release。</p>`;
  }

  function pageSettings() {
    return `
      <div class="card">
        <h3>LLM 配置</h3>
        <div class="form-group">
          <label>Base URL</label>
          <input type="text" value="https://api.openai.com/v1" disabled />
        </div>
        <div class="form-group">
          <label>Model</label>
          <input type="text" value="gpt-4o-mini" disabled />
        </div>
        <div class="form-group">
          <label>API Key</label>
          <input type="password" value="••••••••demo" disabled />
          <div class="hint">Demo 不保存、不请求真实密钥。请在桌面端设置。</div>
        </div>
        <button type="button" class="btn primary" data-demo-toast="请使用桌面版配置 LLM">保存（Demo 禁用）</button>
      </div>`;
  }

  function setPipe(activeIdx, done = false) {
    const root = $('#scan-pipeline');
    if (!root) return;
    root.classList.remove('idle', 'running', 'done', 'error');
    root.classList.add(done ? 'done' : 'running');
    $$('.scan-pipe-step', root).forEach((el, i) => {
      el.classList.remove('active', 'done', 'error');
      if (done || i < activeIdx) el.classList.add('done');
      if (!done && i === activeIdx) el.classList.add('active');
    });
  }

  function appendScanLog(message, level = 'info') {
    const box = $('#scan-console');
    if (!box) return;
    box.querySelector('.scan-log-placeholder')?.remove();
    const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const line = document.createElement('div');
    line.className = `scan-log-row level-${level}`;
    line.innerHTML = `
      <span class="scan-log-time">${esc(t)}</span>
      <span class="scan-log-badge stage-info">扫描</span>
      <span class="scan-log-msg">${esc(message)}</span>`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  async function runScan() {
    if (state.scanning) return;
    state.scanning = true;
    const btn = $('#btn-run-scan');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('is-loading');
      const lab = btn.querySelector('.btn-label');
      if (lab) lab.textContent = '扫描中…';
    }
    const consoleEl = $('#scan-console');
    if (consoleEl) consoleEl.innerHTML = '';
    const seq = [
      [0, 8, '启动扫描 · 基准 TailorCV'],
      [1, 22, 'Agent 研究竞品候选…'],
      [1, 35, '发现 4 个候选：Rezi、Teal、Huntr、Careerflow'],
      [2, 50, '补全情报 (1/4): Rezi'],
      [2, 58, '补全情报 (2/4): Teal'],
      [3, 72, '威胁判定 · BM25 召回 + RAG'],
      [3, 84, 'Rezi 55% · Teal 58%'],
      [4, 92, 'Agent 交叉校验…'],
      [5, 100, '完成：发现 4，待确认 2'],
    ];
    const t0 = Date.now();
    for (const [step, p, msg] of seq) {
      setPipe(step, step === 5 && p === 100);
      const bar = $('#scan-progress');
      if (bar) bar.style.width = `${p}%`;
      const n = $('#scan-pct-num');
      if (n) n.textContent = String(p);
      const stage = $('#scan-stage');
      if (stage) stage.textContent = msg;
      const live = $('#scan-live-text');
      if (live) live.textContent = p >= 100 ? '已完成' : '运行中';
      const el = $('#scan-elapsed');
      if (el) el.textContent = `${Math.round((Date.now() - t0) / 1000)}s`;
      const act = $('#scan-activity');
      if (act) act.textContent = msg;
      appendScanLog(msg, p >= 100 ? 'ok' : 'work');
      await new Promise((r) => setTimeout(r, 380 + Math.random() * 220));
    }
    setPipe(5, true);
    state.scanning = false;
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      const lab = btn.querySelector('.btn-label');
      if (lab) lab.textContent = '再扫一次';
    }
    toast('Demo 扫描完成', 'success');
  }

  function buildCompare() {
    const rows = [];
    for (const c of D.competitors) rows.push(...comparePair(D.product, c));
    state.compareRows = rows;
    render();
    toast(`已生成 ${rows.length} 行参数对比`, 'success');
  }

  function openDetail(id) {
    const c = D.competitors.find((x) => x.id === id);
    if (!c) return;
    const specs = Object.entries(c.specs || {})
      .map(([k, v]) => `<span class="chip blue">${esc(k)}: ${esc(v)}</span>`)
      .join(' ');
    const channels = (c.channels || []).map((ch) => `<span class="chip purple">${esc(ch)}</span>`).join(' ');
    $('#modal-card').innerHTML = `
      <div class="flex-between">
        <div>
          <h2 style="font-size:20px">${esc(c.name)}</h2>
          <p class="muted" style="margin-top:4px">${esc(c.company)} · ${c.status === 'pending' ? '待确认' : '已确认'}</p>
        </div>
        <span class="threat-pill ${threatClass(c.threat)}">${pct(c.threat)}%</span>
      </div>
      <div class="kv section-gap">
        <div class="k">价格</div><div>${esc(c.price_range || money(c.price))}</div>
        <div class="k">方法</div><div>RAG+BM25 · Demo</div>
      </div>
      <h3 style="margin:14px 0 8px;font-size:13px">规格</h3>
      <div>${specs}</div>
      <h3 style="margin:14px 0 8px;font-size:13px">渠道</h3>
      <div>${channels}</div>
      <div class="flex-between section-gap" style="margin-top:20px">
        <span class="muted" style="font-size:12px">Demo 详情</span>
        <button type="button" class="btn" data-close-modal>关闭</button>
      </div>`;
    $('#modal').classList.remove('hidden');
  }

  function drawSpace() {
    const canvas = $('#space-canvas');
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || 360;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 10; i++) {
      const x = (w / 10) * i;
      const y = (h / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const cx = w * 0.5;
    const cy = h * 0.52;
    ctx.fillStyle = '#6b9bff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.lineTo(cx + 10, cy + 9);
    ctx.lineTo(cx - 10, cy + 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9db9ff';
    ctx.font = '12px sans-serif';
    ctx.fillText(D.product.name, cx + 14, cy + 4);
    D.competitors.forEach((c, i) => {
      const ang = (i / D.competitors.length) * Math.PI * 2 - 0.5;
      const r = 48 + c.threat * 100;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r * 0.62;
      const rad = 7 + c.threat * 10;
      const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, rad);
      if (c.threat >= 0.5) {
        g.addColorStop(0, '#fda4af');
        g.addColorStop(1, '#e11d48');
      } else {
        g.addColorStop(0, '#6ee7b7');
        g.addColorStop(1, '#0f766e');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${c.name} ${pct(c.threat)}%`, x + rad + 5, y + 3);
    });
  }

  function render() {
    const t = TITLES[state.page] || ['Demo', ''];
    $('#page-title').textContent = t[0];
    $('#page-sub').textContent = t[1];
    $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.page === state.page));

    const map = {
      dashboard: pageDashboard,
      competitors: pageCompetitors,
      scan: pageScan,
      compare: pageCompare,
      product: pageProduct,
      space: pageSpace,
      settings: pageSettings,
    };
    $('#content').innerHTML = (map[state.page] || pageDashboard)();

    // bind page-local
    $('#btn-run-scan')?.addEventListener('click', runScan);
    $('#btn-build-compare')?.addEventListener('click', buildCompare);
    $('#cmp-filter')?.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      render();
    });
    $('#comp-search')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('#comp-grid .comp-card').forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
    $('#comp-status')?.addEventListener('change', (e) => {
      const st = e.target.value;
      D.competitors.forEach((c, i) => {
        const card = $$('#comp-grid .comp-card')[i];
        if (!card) return;
        card.style.display = !st || c.status === st ? '' : 'none';
      });
    });
    if (state.page === 'space') requestAnimationFrame(drawSpace);
  }

  function navigate(page) {
    state.page = page;
    render();
  }

  // global binds
  $$('.nav-item').forEach((btn) =>
    btn.addEventListener('click', () => navigate(btn.dataset.page))
  );
  $('#btn-quick-scan')?.addEventListener('click', () => navigate('scan'));
  $('#btn-export-demo')?.addEventListener('click', () => toast('Demo 不导出文件', 'info'));

  document.addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) {
      navigate(goto.dataset.goto);
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open?.dataset.open) {
      openDetail(open.dataset.open);
      return;
    }
    if (e.target.closest('[data-close-modal]') || e.target.id === 'modal') {
      if (e.target.matches('[data-close-modal]') || e.target.id === 'modal' || e.target.classList.contains('modal-backdrop')) {
        $('#modal').classList.add('hidden');
      }
    }
    if (e.target.closest('[data-demo-confirm]')) {
      toast('Demo：已模拟确认入库', 'success');
    }
    const t = e.target.closest('[data-demo-toast]');
    if (t) toast(t.dataset.demoToast || 'Demo', 'info');
  });

  window.addEventListener('resize', () => {
    if (state.page === 'space') drawSpace();
  });

  render();
})();
