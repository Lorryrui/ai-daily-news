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
import { KIND_ORDER } from './sources.mjs';
import { HTML_LANG, LANG_PREFIX, LANG_SWITCH_TITLE, OG_LOCALE, depthOf, langPaths, text } from './i18n.mjs';
import { SITE_URL } from './site.mjs';

const THEME_BOOTSTRAP = `(function(){try{var m=localStorage.getItem('ainews-theme');if(m==='light'||m==='dark'){document.documentElement.setAttribute('data-theme',m);}}catch(e){}})();`;

/** 只在中文首页注入：非中文浏览器首次访问时送到英文版；手动切换过的用户按记录走。 */
const LANG_BOOTSTRAP = `(function(){try{var saved=localStorage.getItem('ainews-lang');if(saved==='zh')return;if(saved==='en'){location.replace('en/index.html');return;}var list=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<list.length;i++){var tag=(list[i]||'').toLowerCase();if(!tag||tag==='*'||tag==='und')continue;if(tag.indexOf('zh')!==0)location.replace('en/index.html');return;}}catch(e){}})();`;

const SEARCH_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

const ICONS = {
  auto: '<svg class="icon-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 21a9 9 0 0 0 0-18" fill="currentColor" stroke="none" opacity=".35"/></svg>',
  sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"/></svg>',
  moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  search:
    SEARCH_ICON.replace('stroke-width="2"', 'stroke-width="1.9"'),
};

/** 页面到当前语言根目录的相对前缀。 */
const baseOf = (page) => (page === 'issue' ? '../' : '');

/** 页面到站点根目录的相对前缀（跨语言切换需要）。 */
const siteBaseOf = (lang, page) => '../'.repeat(depthOf(lang, page));

/** 同一页面在两种语言下的地址：用于 hreflang 与语言切换按钮。 */
export function langLinks(lang, page, date) {
  const other = lang === 'zh' ? 'en' : 'zh';
  const file = page === 'issue' ? `issue/${date}.html` : page === 'archive' ? 'archive.html' : 'index.html';
  const absolute = (target) => `${SITE_URL}${LANG_PREFIX[target]}${file}`;
  return {
    'zh-CN': absolute('zh'),
    en: absolute('en'),
    'x-default': absolute('zh'),
    switchTo: `${siteBaseOf(lang, page)}${LANG_PREFIX[other]}${file}`,
  };
}

function layout({
  lang = 'zh',
  page = 'home',
  date,
  title,
  description,
  canonical,
  current,
  body,
  footerNote = '',
  extraScript = '',
}) {
  const t = text(lang);
  const assetBase = siteBaseOf(lang, page);
  const langBase = baseOf(page);
  const paths = langPaths();
  const links = langLinks(lang, page, date);
  const local = (file) => `${langBase}${file}`;

  const altLinks = ['zh-CN', 'en', 'x-default']
    .map((code) => `<link rel="alternate" hreflang="${code}" href="${esc(links[code])}">`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${HTML_LANG[lang]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="${esc(t.siteName)}">
<meta property="og:locale" content="${esc(OG_LOCALE[lang])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(canonical)}">
${altLinks}
<link rel="icon" href="${assetBase}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(t.siteName)}" href="${local(paths.feed)}">
<link rel="stylesheet" href="${assetBase}styles.css">
<script>${THEME_BOOTSTRAP}</script>${extraScript ? `\n<script>${extraScript}</script>` : ''}
</head>
<body data-lang="${lang}">
<a class="skip-link" href="#main">${esc(t.skipLink)}</a>
<header class="site-header">
  <div class="shell site-header__inner">
    <a class="brand" href="${local(paths.home)}">
      <span class="brand__mark" aria-hidden="true">AI</span>
      <span>${esc(t.siteName)}<span class="brand__sub">${esc(t.brandSub)}</span></span>
    </a>
    <nav class="header-nav" aria-label="${esc(t.navLabel)}">
      <a href="${local(paths.home)}"${current === 'latest' ? ' aria-current="page"' : ''}>${esc(t.navToday)}</a>
      <a href="${local(paths.archive)}"${current === 'archive' ? ' aria-current="page"' : ''}>${esc(t.navArchive)}</a>
      <a class="lang-switch" href="${esc(links.switchTo)}" hreflang="${lang === 'zh' ? 'en' : 'zh-CN'}" title="${esc(LANG_SWITCH_TITLE[lang])}" data-lang-switch data-target-lang="${lang === 'zh' ? 'en' : 'zh'}">${esc(t.langSwitch)}</a>
      <button class="icon-btn" type="button" data-search-toggle aria-expanded="false" aria-label="${esc(t.searchLabel)}" title="${esc(t.searchLabel)}">${ICONS.search}</button>
      <button class="icon-btn theme-toggle" type="button" data-theme-toggle data-mode="auto" aria-label="${esc(t.themeLabel)}" title="${esc(t.themeLabel)}">${ICONS.auto}${ICONS.sun}${ICONS.moon}</button>
    </nav>
  </div>
</header>
<div class="shell">
  <div class="search-panel" data-search-panel data-index="${local(paths.searchIndex)}" data-open="false">
    <div class="search-bar">
      ${SEARCH_ICON}
      <input type="search" placeholder="${esc(t.searchPlaceholder)}" aria-label="${esc(t.searchAria)}" autocomplete="off">
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
    <p style="margin:0">${esc(t.siteName)} · ${esc(t.footerNote)}${footerNote ? ` · ${esc(footerNote)}` : ''}</p>
    <p style="margin:0">
      <a href="${local(paths.archive)}">${esc(t.footerArchive)}</a>
      <span class="sep">/</span>
      <a href="${local(paths.home)}">${esc(t.footerLatest)}</a>
      <span class="sep">/</span>
      <a href="https://github.com/Lorryrui/ai-daily-news" rel="noopener">${esc(t.footerSource)}</a>
    </p>
  </div>
</footer>
<script src="${assetBase}app.js" defer></script>
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

function relatedLine(item, lang) {
  if (!item.related?.length) return '';
  const t = text(lang);
  const links = item.related
    .slice(0, 3)
    .map(
      (entry) =>
        `<a href="${esc(entry.url)}" rel="noopener" target="_blank" title="${esc(entry.title)}">${esc(entry.sourceName)}</a>`,
    )
    .join(t.relatedSep);
  return `<span class="related">${esc(t.issue.related(links))}</span>`;
}

function card(item, issueKey, lang) {
  const t = text(lang);
  const image = item.image
    ? `<div class="card__media"><img src="${esc(item.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>`
    : '';
  const tags = (item.tags ?? [])
    .slice(0, 2)
    .map((tag) => `<span class="tag">${esc(truncate(tag, 18))}</span>`)
    .join('');
  const zhBadge = item.lang === 'zh' && lang === 'en' ? `<span class="badge">${esc(t.zhBadge)}</span>` : '';
  return `<article class="card${image ? ' card--with-image' : ''}">
  <div class="card__body">
    <div class="card__top">
      <span class="badge badge--${esc(item.kind)}">${esc(item.sourceName)}</span>
      <span class="card__time">${esc(timeLabel(item, issueKey))}</span>
      ${zhBadge}
    </div>
    <h3><a href="${esc(item.url)}" rel="noopener" target="_blank">${esc(item.title)}</a></h3>
    ${item.summary ? `<p class="card__summary">${esc(item.summary)}</p>` : ''}
    <div class="card__foot">
      <span>${esc(t.kindLabels[item.kind] ?? t.kindFallback)}</span>
      ${tags}
      ${relatedLine(item, lang)}
    </div>
  </div>
  ${image}
</article>`;
}

/** 今日要点：跨源报道数最多的条目优先，同一来源最多两条。 */
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

function archiveSidebar(issues, currentKey, lang, base) {
  const t = text(lang);
  const paths = langPaths();
  const groups = new Map();
  for (const issue of issues) {
    const label = monthLabel(issue.date, lang);
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
            (issue) => `<li><a href="${base}${paths.issue(issue.date)}"${issue.date === currentKey ? ' aria-current="page"' : ''}>
          <span>${esc(shortDate(issue.date))} ${esc(weekdayOf(issue.date, lang))}</span>
          <span class="n">${issue.total}</span>
        </a></li>`,
          )
          .join('')}
      </ul>
    </div>`,
    )
    .join('');

  return `<aside class="sidebar" aria-label="${esc(t.sidebar.label)}">
  <section class="panel">
    <h2>${esc(t.sidebar.archive)}</h2>
    ${blocks}
    <p style="margin:14px 0 0;font-size:.82rem"><a href="${base}${paths.archive}" style="color:var(--accent)">${esc(t.sidebar.viewAll(issues.length))}</a></p>
  </section>
</aside>`;
}

const SOURCE_PANEL_LIMIT = 12;

function sourcesPanel(issue, lang) {
  const ranked = (issue.sources ?? []).filter((source) => source.count > 0).sort((a, b) => b.count - a.count);
  if (!ranked.length) return '';
  const t = text(lang);
  const shown = ranked.slice(0, SOURCE_PANEL_LIMIT);
  const max = shown[0].count;
  const rest = ranked.length - shown.length;
  return `<aside class="sidebar" aria-label="${esc(t.sources.title)}">
  <section class="panel">
    <h2>${esc(t.sources.title)}</h2>
    <ul class="source-list">
      ${shown
        .map(
          (source) => `<li>
        <span class="name">${esc(source.name)}</span>
        <span class="bar" style="width:${Math.max(6, Math.round((source.count / max) * 46))}px"></span>
        <span class="n">${source.count}</span>
      </li>`,
        )
        .join('')}
    </ul>
    ${rest > 0 ? `<p class="source-more">${esc(t.sources.more(rest))}</p>` : ''}
  </section>
</aside>`;
}

function renderIssueBody({ issue, issues, prev, next, lang, page }) {
  const t = text(lang);
  const key = issue.date;
  const paths = langPaths();
  const base = baseOf(page);

  const sections = KIND_ORDER.map((kind) => {
    const items = issue.items.filter((item) => item.kind === kind);
    const meta = t.sections[kind];
    if (!items.length || !meta) return '';
    return `<section class="section" id="${kind}">
  <div class="section__head">
    <h2>${esc(meta.title)}</h2>
    <span class="count">${items.length}</span>
    <span class="section__hint">${esc(meta.hint)}</span>
  </div>
  <div class="cards">
    ${items.map((item) => card(item, key, lang)).join('\n    ')}
  </div>
</section>`;
  })
    .filter(Boolean)
    .join('\n');

  const highlights = pickHighlights(issue);
  const highlightBlock = highlights.length
    ? `<section class="highlights" aria-labelledby="hl-title">
  <h2 id="hl-title"><span class="dot" aria-hidden="true"></span>${esc(t.issue.highlights)}</h2>
  <ol>
    ${highlights
      .map(
        (item) => `<li>
      <a href="${esc(item.url)}" rel="noopener" target="_blank">${esc(item.title)}</a>
      <span class="meta">${esc(item.sourceName)} · ${esc(timeLabel(item, key))}${item.related?.length ? ` · ${esc(t.issue.highlightMeta(item.related.length))}` : ''}</span>
    </li>`,
      )
      .join('\n    ')}
  </ol>
</section>`
    : '';

  const pager = `<nav class="pager" aria-label="${esc(t.pagerLabel)}">
  ${
    prev
      ? `<a class="prev" href="${base}${paths.issue(prev.date)}"><span class="dir">← ${esc(t.issue.prev)}</span><span class="t">${esc(longDate(prev.date, lang))} · ${esc(t.issue.itemCount(prev.total))}</span></a>`
      : '<span></span>'
  }
  ${
    next
      ? `<a class="next" href="${base}${paths.issue(next.date)}"><span class="dir">${esc(t.issue.next)} →</span><span class="t">${esc(longDate(next.date, lang))} · ${esc(t.issue.itemCount(next.total))}</span></a>`
      : '<span></span>'
  }
</nav>`;

  const stats = t.issue.stats;
  return {
    highlights,
    body: `<div class="hero shell">
  <span class="eyebrow">${esc(t.issue.eyebrow(weekdayOf(key, lang), issue.sequence))}</span>
  <h1>${t.issue.title(esc(longDate(key, lang)))}</h1>
  <p class="hero__lede">${esc(t.issue.lede(issue.total, issue.sourceTotal, issue.relatedTotal))}</p>
  <div class="hero__stats">
    <div class="stat"><strong>${issue.total}</strong><span>${esc(stats[0])}</span></div>
    <div class="stat"><strong>${issue.stats.product}</strong><span>${esc(stats[1])}</span></div>
    <div class="stat"><strong>${issue.stats.news + issue.stats.official}</strong><span>${esc(stats[2])}</span></div>
    <div class="stat"><strong>${esc(chinaTime(new Date(issue.generatedAt)))}</strong><span>${esc(stats[3])}</span></div>
  </div>
</div>
<div class="shell">
  <div class="layout">
    <div class="main-column">
      ${highlightBlock}
      ${sections || `<p class="search-hint">${esc(t.issue.empty)}</p>`}
      ${pager}
    </div>
    <div class="sidebar-column">
      ${archiveSidebar(issues, key, lang, base)}
      ${sourcesPanel(issue, lang)}
    </div>
  </div>
</div>`,
  };
}

/** 单期页面（绝对地址 issue/<date>.html，或英文版 en/issue/<date>.html）。 */
export function renderIssue({ issue, issues, prev, next, lang = 'zh' }) {
  const t = text(lang);
  const key = issue.date;
  const { highlights, body } = renderIssueBody({ issue, issues, prev, next, lang, page: 'issue' });
  const links = langLinks(lang, 'issue', key);

  return layout({
    lang,
    page: 'issue',
    date: key,
    title: t.issue.docTitle(longDate(key, lang)),
    description: `${longDate(key, lang)} (${weekdayOf(key, lang)}) — ${t.issue.lede(issue.total, issue.sourceTotal, issue.relatedTotal)} ${highlights
      .slice(0, 2)
      .map((item) => item.title)
      .join(t.listSep)}`,
    canonical: links[HTML_LANG[lang]],
    current: 'latest',
    body,
    footerNote: t.issue.footerNote(chinaTime(new Date(issue.generatedAt))),
  });
}

export function renderArchive({ issues, lang = 'zh', generatedAt }) {
  const t = text(lang);
  const paths = langPaths();
  const base = baseOf('archive');
  const links = langLinks(lang, 'archive');

  const byYear = new Map();
  for (const issue of issues) {
    const year = issue.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(issue);
  }

  const grid = [...byYear.entries()]
    .map(
      ([year, list]) => `<h2 class="year-head" data-archive-year="${esc(year)}">${esc(t.archive.yearHead(year, list.length))}</h2>
    ${list
      .map(
        (issue) => `<a class="archive-card" href="${base}${paths.issue(issue.date)}" data-archive-card data-key="${esc(issue.date)}">
      <strong>${esc(longDate(issue.date, lang))}</strong>
      <span>${esc(t.archive.card(weekdayOf(issue.date, lang), issue.total))}</span>
    </a>`,
      )
      .join('\n    ')}`,
    )
    .join('\n    ');

  const body = `<div class="shell">
  <div class="page-head">
    <span class="eyebrow">${esc(t.archive.eyebrow(issues.length))}</span>
    <h1>${esc(t.archive.title)}</h1>
    <p>${t.archive.intro(issues[0]?.date ?? '2026-11-27')}</p>
    <div class="search-bar" style="max-width:340px;margin-top:20px">
      ${SEARCH_ICON}
      <input type="search" data-archive-filter placeholder="${esc(t.archive.filterPlaceholder)}" aria-label="${esc(t.archive.filterAria)}">
    </div>
  </div>
  <p class="search-hint" data-archive-empty style="display:none">${esc(t.archive.noMatch)}</p>
  <div class="archive-grid">
    ${grid || `<p class="search-hint">${esc(t.archive.empty)}</p>`}
  </div>
</div>`;

  return layout({
    lang,
    page: 'archive',
    title: `${t.archive.docTitle} · ${t.siteName}`,
    description: t.archive.description(issues.length),
    canonical: links[HTML_LANG[lang]],
    current: 'archive',
    body,
    footerNote: generatedAt ? t.archive.footerNote(chinaTime(new Date(generatedAt))) : '',
  });
}

export function renderHome({ latest, issues, prev = null, next = null, lang = 'zh' }) {
  const t = text(lang);
  if (!latest) {
    const links = langLinks(lang, 'home');
    return layout({
      lang,
      page: 'home',
      title: t.siteName,
      description: t.description,
      canonical: links[HTML_LANG[lang]],
      current: 'latest',
      body: `<div class="shell page-head"><h1>${esc(t.home.emptyTitle)}</h1><p>${t.home.emptyBody}</p></div>`,
    });
  }

  const issue = latest.issue;
  const key = issue.date;
  const { highlights, body } = renderIssueBody({ issue, issues, prev, next, lang, page: 'home' });
  const links = langLinks(lang, 'home');

  return layout({
    lang,
    page: 'home',
    title: t.issue.docTitle(longDate(key, lang)),
    description: `${longDate(key, lang)} (${weekdayOf(key, lang)}) — ${t.issue.lede(issue.total, issue.sourceTotal, issue.relatedTotal)} ${highlights
      .slice(0, 2)
      .map((item) => item.title)
      .join(t.listSep)}`,
    canonical: links[HTML_LANG[lang]],
    current: 'latest',
    body,
    footerNote: t.issue.footerNote(chinaTime(new Date(issue.generatedAt))),
    extraScript: lang === 'zh' ? LANG_BOOTSTRAP : '',
  });
}
