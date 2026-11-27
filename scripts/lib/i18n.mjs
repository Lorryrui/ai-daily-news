// 站点文案与路由的双语定义。
// zh 是默认语言（放在站点根），en 放在 /en/ 下。

export const LANGS = ['zh', 'en'];
export const DEFAULT_LANG = 'zh';

export const HTML_LANG = { zh: 'zh-CN', en: 'en' };
export const OG_LOCALE = { zh: 'zh_CN', en: 'en_US' };
export const LANG_SWITCH_TITLE = { zh: 'Switch to English', en: '切换到中文' };

/** 站点根下各语言目录的前缀。 */
export const LANG_PREFIX = { zh: '', en: 'en/' };

/** 语言内相对路径（不含语言目录前缀），结果与语言无关。 */
export function langPaths() {
  return {
    home: 'index.html',
    archive: 'archive.html',
    issue: (date) => `issue/${date}.html`,
    feed: 'feed.xml',
    searchIndex: 'search-index.json',
  };
}

/** 页面在站点里的深度（相对站点根），用于跨语言链接。 */
export function depthOf(lang, page) {
  return (lang === 'en' ? 1 : 0) + (page === 'issue' ? 1 : 0);
}

/** 页面到当前语言根目录的相对前缀。 */
export function langBase(page) {
  return page === 'issue' ? '../' : '';
}

const ZH = {
  siteName: 'AI 日报',
  tagline: '每天 06:00 更新的 AI 产品与行业动态',
  description:
    '自动抓取 Product Hunt、TechCrunch 等来源的 AI 动态，每天北京时间 06:00 更新的中文日报。',
  brandSub: ' · 每日 06:00',
  skipLink: '跳到主要内容',
  navLabel: '主导航',
  navToday: '今日',
  navArchive: '归档',
  searchLabel: '搜索（快捷键 /）',
  themeLabel: '主题：跟随系统',
  searchPlaceholder: '搜索产品、公司、关键词…  （按 / 聚焦）',
  searchAria: '搜索全部日报内容',
  searchEmpty: '没有找到匹配的内容，换个关键词试试。',
  footerNote: '内容来自各源站，版权归原作者所有',
  footerArchive: '全部归档',
  footerLatest: '最新一期',
  footerSource: '源码',
  langSwitch: 'English',
  zhBadge: '中文',
  listSep: '；',
  relatedSep: '、',
  kindFallback: '资讯',
  kindLabels: {
    product: '产品',
    news: '媒体',
    official: '官方',
    insight: '深度',
    community: '社区',
  },
  sections: {
    product: { title: '今日新产品', hint: '来自 Product Hunt 等产品社区的 AI 新应用' },
    news: { title: '行业动态', hint: '科技媒体的 AI 报道精选' },
    official: { title: '官方更新', hint: '头部 AI 实验室与公司的一手消息' },
    insight: { title: '深度分析', hint: '长文解读、行业观察与研究报告' },
    community: { title: '社区热议', hint: 'Hacker News 上被讨论最多的 AI 话题' },
  },
  issue: {
    eyebrow: (weekday, sequence) => `${weekday} · 第 ${sequence} 期`,
    title: (date) => `<span class="date-part">${date}</span> AI 日报`,
    docTitle: (date) => `${date} AI 日报`,
    lede: (total, sources, merged) =>
      `从 ${sources} 个来源抓取，聚合 ${total} 条 AI 产品与行业动态${merged ? `（合并 ${merged} 条重复报道）` : ''}。`,
    statsLine: (total, products, industryOfficial, time) =>
      `共 ${total} 条动态 · ${products} 个新产品 · ${industryOfficial} 条行业与官方消息 · 生成于北京时间 ${time}`,
    kindTabsLabel: '内容分类',
    highlights: '今日要点',
    highlightMeta: (total) => `另有 ${total} 家媒体报道`,
    prev: '上一期',
    next: '下一期',
    pagerLabel: '往期翻页',
    itemCount: (total) => `${total} 条`,    empty: '本期暂无内容。',
    footerNote: (time) => `本页于 ${time} 生成`,
    related: (links) => `另有 ${links} 报道`,
  },
  sidebar: {
    label: '侧栏',
    archive: '往期归档',
    viewAll: (total) => `查看全部 ${total} 期 →`,
  },
  sources: {
    title: '本期来源',
    more: (count) => `另有 ${count} 个来源未列出`,
  },
  archive: {
    eyebrow: (total) => `共 ${total} 期`,
    title: '日报归档',
    docTitle: '日报归档',
    description: (total) => `全部 ${total} 期 AI 日报归档，按日期浏览。`,
    intro: (sample) =>
      `每天北京时间 06:00 自动更新一期。按日期浏览历史日报，或输入日期快速定位，例如 <kbd>${sample}</kbd>。`,
    filterPlaceholder: '筛选日期，如 2026-11',
    filterAria: '按日期筛选归档',
    noMatch: '没有匹配的日期。',
    empty: '还没有归档内容，等待第一次构建。',
    yearHead: (year, total) => `${year} 年 · ${total} 期`,
    card: (weekday, total) => `${weekday} · ${total} 条动态`,
    footerNote: (time) => `归档于 ${time} 更新`,
  },
  home: {
    emptyTitle: '还没有内容',
    emptyBody: '运行 <code>npm run build</code> 生成第一期日报。',
  },
};

const EN = {
  siteName: 'AI Daily Brief',
  tagline: 'AI product and industry news, refreshed at 06:00 daily',
  description:
    'A daily digest of AI product launches and industry news, aggregated from Product Hunt, TechCrunch and 40+ other sources. Published at 06:00 Beijing time.',
  brandSub: ' · 06:00 daily',
  skipLink: 'Skip to main content',
  navLabel: 'Primary',
  navToday: 'Today',
  navArchive: 'Archive',
  searchLabel: 'Search (press /)',
  themeLabel: 'Theme: follow system',
  searchPlaceholder: 'Search products, companies, keywords…  (press /)',
  searchAria: 'Search all issues',
  searchEmpty: 'Nothing matched. Try another keyword.',
  footerNote: 'Content belongs to the original publishers',
  footerArchive: 'All issues',
  footerLatest: 'Latest issue',
  footerSource: 'Source',
  langSwitch: '中文',
  zhBadge: 'Chinese',
  listSep: '; ',
  relatedSep: ', ',
  kindFallback: 'Story',
  kindLabels: {
    product: 'Product',
    news: 'News',
    official: 'Official',
    insight: 'Deep dive',
    community: 'Community',
  },
  sections: {
    product: { title: 'New products', hint: 'Fresh AI apps from Product Hunt and other launch platforms' },
    news: { title: 'Industry news', hint: 'Selected AI coverage from tech media' },
    official: { title: 'From the labs', hint: 'First-hand posts from AI labs and companies' },
    insight: { title: 'Deep dives', hint: 'Long reads, analysis and research notes' },
    community: { title: 'Community', hint: 'The most discussed AI stories on Hacker News' },
  },
  issue: {
    eyebrow: (weekday, sequence) => `${weekday} · Issue ${sequence}`,
    title: (date) => `<span class="date-part">${date}</span> AI Daily Brief`,
    docTitle: (date) => `${date} · AI Daily Brief`,
    lede: (total, sources, merged) =>
      `${total} AI product and industry updates from ${sources} sources${merged ? ` (${merged} duplicate report${merged > 1 ? 's' : ''} merged)` : ''}.`,
    statsLine: (total, products, industryOfficial, time) =>
      `${total} stories · ${products} new products · ${industryOfficial} industry & official · generated ${time} (CST)`,
    kindTabsLabel: 'Content sections',
    highlights: "Today's highlights",
    highlightMeta: (total) => `Also covered by ${total} outlet${total === 1 ? '' : 's'}`,
    prev: 'Previous',
    next: 'Next',
    pagerLabel: 'Issue pagination',
    itemCount: (total) => `${total} items`,
    empty: 'Nothing in this issue yet.',
    footerNote: (time) => `Generated at ${time} (Beijing time)`,
    related: (links) => `Also covered by ${links}`,
  },
  sidebar: {
    label: 'Sidebar',
    archive: 'Past issues',
    viewAll: (total) => `View all ${total} issues →`,
  },
  sources: {
    title: 'Sources this issue',
    more: (count) => `+${count} more sources`,
  },
  archive: {
    eyebrow: (total) => `${total} issues`,
    title: 'Archive',
    docTitle: 'Archive',
    description: (total) => `All ${total} issues of the AI daily brief, browsable by date.`,
    intro: (sample) =>
      `A new issue is published every day at 06:00 Beijing time. Browse by date, or type a date to filter, for example <kbd>${sample}</kbd>.`,
    filterPlaceholder: 'Filter by date, e.g. 2026-11',
    filterAria: 'Filter archive by date',
    noMatch: 'No matching dates.',
    empty: 'No issues yet — waiting for the first build.',
    yearHead: (year, total) => `${year} · ${total} issues`,
    card: (weekday, total) => `${weekday} · ${total} items`,
    footerNote: (time) => `Archive updated at ${time} (Beijing time)`,
  },
  home: {
    emptyTitle: 'Nothing here yet',
    emptyBody: 'Run <code>npm run build</code> to generate the first issue.',
  },
};

export const T = { zh: ZH, en: EN };

export const text = (lang) => T[lang] ?? ZH;
