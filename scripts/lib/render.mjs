import {
  chinaDateKey,
  chinaTime,
  esc,
  longDate,
  monthLabel,
  shortDate,
  truncate,
  weekdayOf,
} from './util.mjs';
import { KIND_LABELS } from './sources.mjs';

export const SITE = {
  name: 'AI 日报',
  tagline: '每天 06:00 更新的 AI 产品与行业动态',
  description: '自动抓取 Product Hunt、TechCrunch 等来源的 AI 动态，每天北京时间 06:00 更新的中文日报。',
};

const SECTION_META = {
  product: { title: '今日新产品', hint: '来自 Product Hunt 等产品社区的 AI 新应用' },
  news: { title: '行业动态', hint: '科技媒体的 AI 报道精选' },
  official: { title: '官方更新', hint: '头部 AI 实验室与公司的一手消息' },
  community: { title: '社区热议', hint: 'Hacker News 上被讨论最多的 AI 话题' },
};

const SECTION_ORDER = ['product', 'news', 'official', 'community'];

const THEME_BOOTSTRAP = `(function(){try{var m=localStorage.getItem('ainews-theme');if(m==='light'||m==='dark'){document.documentElement.setAttribute('data-theme',m);}}catch(e){}})();`;

const SEARCH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const ICONS = {
  auto: '<svg class="icon-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 21a9 9 0 0 0 0-18" fill="currentColor" stroke="none" opacity=".35"/></svg>',
  sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"/></svg>',
  moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};

function layout({ base, title, description, canonical, current, body, bodyClass = '', footerNote = '' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)}" href="${base}feed.xml">
<link rel="stylesheet" href="${base}styles.css">
<script>${THEME_BOOTSTRAP}</script>
</head>
<body class="${esc(bodyClass)}">
<a class="skip-link" href="#main">跳到主要内容</a>
<header class="site-header">
  <div class="shell site-header__inner">
    <a class="brand" href="${base}index.html">
      <span class="brand__mark" aria-hidden="true">AI</span>
      <span>${esc(SITE.name)}<span class="brand__sub"> · 每日 06:00</span></span>
    </a>
    <nav class="header-nav" aria-label="主导航">
      <a href="${base}index.html"${current === 'latest' ? ' aria-current="page"' : ''}>今日</a>
      <a href="${base}archive.html"${current === 'archive' ? ' aria-current="page"' : ''}>归档</a>
      <button class="icon-btn" type="button" data-search-toggle aria-expanded="false" aria-label="搜索（快捷键 /）" title="搜索（快捷键 /）">${ICONS.search}</button>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle data-mode="auto" aria-label="主题：跟随系统" title="主题：跟随系统（点击切换）">${ICONS.auto}${ICONS.sun}${ICONS.moon}</button>
    </nav>
  </div>
</header>
<div class="shell">
  <div class="search-panel" data-search-panel data-index="${base}search-index.json" data-open="false">
    <div class="search-bar">
      ${SEARCH_ICON}
      <input type="search" placeholder="搜索产品、公司、关键词…  （按 / 聚焦）" aria-label="搜索全部日报内容" autocomplete="off">
    </div>
    <p class="search-hint" data-search-hint></p>
    <div class="search-results" data-search-results></div>
  </div>
</div>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="shell site-footer__inner">
    <p style="margin:0">${esc(SITE.name)} · 内容来自各源站，版权归原作者所有${footerNote ? ` · ${esc(footerNote)}` : ''}</p>
    <p style="margin:0">
      <a href="${base}archive.html">全部归档</a>
      <span class="sep">/</span>
      <a href="${base}index.html">最新一期</a>
      <span class="sep">/</span>
      <a href="https://github.com/Lorryrui/ai-daily-news" rel="noopener">源码</a>
    </p>
  </div>
</footer>
<script src="${base}app.js" defer></script>
</body>
</html>
`;
}

function timeLabel(item, issueKey) {
  const date = new Date(item.publishedAt);
  const key = chinaDateKey(date);
  const time = chinaTime(date);
  return key === issueKey ? time : `${shortDate(key)} ${time}`;
}

function badge(item) {
  return `<span class="badge badge--${esc(item.kind)}">${esc(item.sourceName)}</span>`;
}

function relatedLine(item) {
  if (!item.related?.length) return '';
  const links = item.related
    .slice(0, 3)
    .map(
      (entry) =>
        `<a href="${esc(entry.url)}" rel="noopener" target="_blank" title="${esc(entry.title)}">${esc(entry.sourceName)}</a>`,
    )
    .join('、');
  return `<span class="related">另有 ${links} 报道</span>`;
}

function card(item, issueKey) {
  const image = item.image
    ? `<div class="card__media"><img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>`
    : '';
  const tags = (item.tags ?? [])
    .slice(0, 2)
    .map((tag) => `<span class="tag">${esc(truncate(tag, 18))}</span>`)
    .join('');
  return `<article class="card${image ? ' card--with-image' : ''}">
  <div class="card__body">
    <div class="card__top">
      ${badge(item)}
      <span class="card__time">${esc(timeLabel(item, issueKey))}</span>
      ${item.lang === 'zh' ? '<span class="badge">中文</span>' : ''}
    </div>
    <h3><a href="${esc(item.url)}" rel="noopener" target="_blank">${esc(item.title)}</a></h3>
    ${item.summary ? `<p class="card__summary">${esc(item.summary)}</p>` : ''}
    <div class="card__foot">
      <span>${esc(KIND_LABELS[item.kind] ?? '资讯')}</span>
      ${tags}
      ${relatedLine(item)}
    </div>
  </div>
  ${image}
</article>`;
}

function pickHighlights(issue, limit = 5) {
  const ranked = issue.items
    .map((item) => {
      const crossSource = item.related?.length ?? 0;
      const weight =
        crossSource * 3 +
        (item.kind === 'news' || item.kind === 'official' ? 1.6 : 0) +
        (item.image ? 0.4 : 0) +
        (item.summary ? 0.3 : 0);
      return { item, weight };
    })
    .sort((a, b) => b.weight - a.weight || new Date(b.item.publishedAt) - new Date(a.item.publishedAt));

  const picked = [];
  const perSource = new Map();
  for (const { item } of ranked) {
    const used = perSource.get(item.source) ?? 0;
    if (used >= 2) continue;
    perSource.set(item.source, used + 1);
    picked.push(item);
    if (picked.length >= limit) break;
  }
  for (const { item } of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked;
}

function archiveSidebar(issues, currentKey, base) {
  const groups = new Map();
  for (const issue of issues) {
    const label = monthLabel(issue.date);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(issue);
  }
  const blocks = [...groups.entries()]
    .slice(0, 6)
    .map(
      ([label, list]) => `<div class="month-group">
      <p>${esc(label)}</p>
      <ul class="archive-list">
        ${list
          .map(
            (issue) => `<li><a href="${base}issue/${issue.date}.html"${issue.date === currentKey ? ' aria-current="page"' : ''}>
          <span>${esc(shortDate(issue.date))} ${esc(weekdayOf(issue.date))}</span>
          <span class="n">${issue.total}</span>
        </a></li>`,
          )
          .join('')}
      </ul>
    </div>`,
    )
    .join('');

  return `<aside class="sidebar" aria-label="侧栏">
  <section class="panel">
    <h2>往期归档</h2>
    ${blocks}
    <p style="margin:14px 0 0;font-size:.82rem"><a href="${base}archive.html" style="color:var(--accent)">查看全部 ${issues.length} 期 →</a></p>
  </section>
</aside>`;
}

function sourcesPanel(issue) {
  if (!issue.sources?.length) return '';
  const max = Math.max(...issue.sources.map((source) => source.count));
  return `<section class="panel">
    <h2>本期来源</h2>
    <ul class="source-list">
      ${issue.sources
        .filter((source) => source.count > 0)
        .sort((a, b) => b.count - a.count)
        .map(
          (source) => `<li>
        <span>${esc(source.name)}</span>
        <span class="bar" style="width:${Math.max(6, Math.round((source.count / max) * 46))}px"></span>
        <span class="n">${source.count}</span>
      </li>`,
        )
        .join('')}
    </ul>
  </section>`;
}

export function renderIssue({
  issue,
  issues,
  prev,
  next,
  base = '',
  canonicalBase = '',
  canonical,
  current = 'latest',
}) {
  const key = issue.date;
  const sections = SECTION_ORDER.map((kind) => {
    const items = issue.items.filter((item) => item.kind === kind);
    if (!items.length) return '';
    const meta = SECTION_META[kind];
    return `<section class="section" id="${kind}">
  <div class="section__head">
    <h2>${esc(meta.title)}</h2>
    <span class="count">${items.length}</span>
    <span class="section__hint">${esc(meta.hint)}</span>
  </div>
  <div class="cards">
    ${items.map((item) => card(item, key)).join('\n    ')}
  </div>
</section>`;
  })
    .filter(Boolean)
    .join('\n');

  const highlights = pickHighlights(issue);
  const highlightBlock = highlights.length
    ? `<section class="highlights" aria-labelledby="hl-title">
  <h2 id="hl-title"><span class="dot" aria-hidden="true"></span>今日要点</h2>
  <ol>
    ${highlights
      .map(
        (item) => `<li>
      <a href="${esc(item.url)}" rel="noopener" target="_blank">${esc(item.title)}</a>
      <span class="meta">${esc(item.sourceName)} · ${esc(timeLabel(item, key))}${item.related?.length ? ` · 另有 ${item.related.length} 家媒体报道` : ''}</span>
    </li>`,
      )
      .join('\n    ')}
  </ol>
</section>`
    : '';

  const pager = `<nav class="pager" aria-label="上下期">
  ${prev ? `<a class="prev" href="${base}issue/${prev.date}.html"><span class="dir">← 上一期</span><span class="t">${esc(longDate(prev.date))} · ${prev.total} 条</span></a>` : '<span></span>'}
  ${next ? `<a class="next" href="${base}issue/${next.date}.html"><span class="dir">下一期 →</span><span class="t">${esc(longDate(next.date))} · ${next.total} 条</span></a>` : '<span></span>'}
</nav>`;

  const body = `<div class="hero shell">
  <span class="eyebrow">${esc(weekdayOf(key))} · 第 ${issue.sequence} 期</span>
  <h1><span class="date-part">${esc(longDate(key))}</span> AI 日报</h1>
  <p class="hero__lede">从 ${issue.sourceTotal} 个来源抓取，聚合 ${issue.total} 条 AI 产品与行业动态${issue.relatedTotal ? `（合并 ${issue.relatedTotal} 条重复报道）` : ''}。</p>
  <div class="hero__stats">
    <div class="stat"><strong>${issue.total}</strong><span>条动态</span></div>
    <div class="stat"><strong>${issue.stats.product}</strong><span>个新产品</span></div>
    <div class="stat"><strong>${issue.stats.news + issue.stats.official}</strong><span>条行业与官方消息</span></div>
    <div class="stat"><strong>${esc(chinaTime(new Date(issue.generatedAt)))}</strong><span>生成于北京时间</span></div>
  </div>
</div>
<div class="shell">
  <div class="layout">
    <div class="main-column">
      ${highlightBlock}
      ${sections || '<p class="search-hint">本期暂无内容。</p>'}
      ${pager}
    </div>
    <div class="sidebar-column">
      ${archiveSidebar(issues, key, base)}
    </div>
  </div>
</div>`;

  return layout({
    base,
    title: `${longDate(key)} AI 日报 · ${SITE.name}`,
    description: `${longDate(key)}（${weekdayOf(key)}）AI 日报，共 ${issue.total} 条动态：${highlights
      .slice(0, 2)
      .map((item) => item.title)
      .join('；')}`,
    canonical: canonical || `${canonicalBase}issue/${key}.html`,
    current: current || 'latest',
    body,
    footerNote: `本页于 ${chinaTime(new Date(issue.generatedAt))} 生成`,
  });
}

export function renderArchive({ issues, base = '', canonicalBase = '', generatedAt }) {
  const byYear = new Map();
  for (const issue of issues) {
    const year = issue.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(issue);
  }

  const grid = [...byYear.entries()]
    .map(
      ([year, list]) => `<h2 class="year-head" data-archive-year="${esc(year)}">${esc(year)} 年 · ${list.length} 期</h2>
    ${list
      .map(
        (issue) => `<a class="archive-card" href="${base}issue/${issue.date}.html" data-archive-card data-key="${esc(issue.date)}">
      <strong>${esc(longDate(issue.date))}</strong>
      <span>${esc(weekdayOf(issue.date))} · ${issue.total} 条动态</span>
    </a>`,
      )
      .join('\n    ')}`,
    )
    .join('\n    ');

  const body = `<div class="shell">
  <div class="page-head">
    <span class="eyebrow">共 ${issues.length} 期</span>
    <h1>日报归档</h1>
    <p>每天北京时间 06:00 自动更新一期。按日期浏览历史日报，或输入日期快速定位，例如 <kbd>${issues[0]?.date ?? '2026-11-27'}</kbd>。</p>
    <div class="search-bar" style="max-width:340px;margin-top:20px">
      ${SEARCH_ICON}
      <input type="search" data-archive-filter placeholder="筛选日期，如 2026-11" aria-label="按日期筛选归档">
    </div>
  </div>
  <p class="search-hint" data-archive-empty style="display:none">没有匹配的日期。</p>
  <div class="archive-grid">
    ${grid || '<p class="search-hint">还没有归档内容，等待第一次构建。</p>'}
  </div>
</div>`;

  return layout({
    base,
    title: `日报归档 · ${SITE.name}`,
    description: `全部 ${issues.length} 期 AI 日报归档，按日期浏览。`,
    canonical: `${canonicalBase}archive.html`,
    current: 'archive',
    body,
    footerNote: generatedAt ? `归档于 ${chinaTime(new Date(generatedAt))} 更新` : '',
  });
}

export function renderHome({ latest, issues, prev = null, next = null, base = '', canonicalBase = '' }) {
  if (!latest) {
    return layout({
      base,
      title: SITE.name,
      description: SITE.description,
      canonical: canonicalBase,
      current: 'latest',
      body: `<div class="shell page-head"><h1>还没有内容</h1><p>运行 <code>npm run build</code> 生成第一期日报。</p></div>`,
    });
  }
  return renderIssue({
    issue: latest.issue,
    issues,
    prev,
    next,
    base,
    canonicalBase,
    canonical: canonicalBase,
  });
}
