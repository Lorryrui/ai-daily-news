import { createHash } from 'node:crypto';

export const TZ = 'Asia/Shanghai';
/** 每期日报在北京时间 06:00 截稿，因此一条内容的归属日期 = 北京时间 + 18 小时。 */
export const ISSUE_CUTOFF_HOUR = 6;

const DATE_KEY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const TIME_FMT = new Intl.DateTimeFormat('zh-CN', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const WEEKDAY_FMT = new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', weekday: 'long' });
const EN_WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' });
const EN_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const EN_MONTH_FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' });
const utcNoon = (key) => new Date(`${key}T12:00:00Z`);

export const chinaDateKey = (date) => DATE_KEY_FMT.format(date);
export const chinaTime = (date) => TIME_FMT.format(date);
/**
 * 一条内容所属的期号：每期在北京时间 06:00 截稿发布，所以
 * 第 D 期 = [D-1 06:00, D 06:00) 的内容，等价于把时间后移 18 小时再取北京日期。
 * 例：11-26 07:00 与 11-27 05:00 的内容都属于 11-27 期。
 */
export const issueDateOf = (date) =>
  chinaDateKey(new Date(date.getTime() + (24 - ISSUE_CUTOFF_HOUR) * 3600 * 1000));

/** 最近一期已截稿的期号（即此刻应该展示的最新一期）。 */
export const currentIssueLabel = (now = new Date()) =>
  chinaDateKey(new Date(now.getTime() - ISSUE_CUTOFF_HOUR * 3600 * 1000));

export const weekdayOf = (key, lang = 'zh') =>
  (lang === 'en' ? EN_WEEKDAY_FMT : WEEKDAY_FMT).format(utcNoon(key));
export const monthLabel = (key, lang = 'zh') =>
  lang === 'en' ? EN_MONTH_FMT.format(utcNoon(key)) : `${key.slice(0, 4)}年${Number(key.slice(5, 7))}月`;
export const shortDate = (key) => `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;
export const longDate = (key, lang = 'zh') =>
  lang === 'en'
    ? EN_DATE_FMT.format(utcNoon(key))
    : `${key.slice(0, 4)}年${Number(key.slice(5, 7))}月${Number(key.slice(8, 10))}日`;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
  laquo: '«',
  raquo: '»',
  times: '×',
  deg: '°',
  euro: '€',
  pound: '£',
  yen: '¥',
  zwnj: '',
  zwj: '',
  shy: '-',
};

export function decodeEntities(input) {
  let out = String(input ?? '');
  for (let pass = 0; pass < 2; pass += 1) {
    if (!/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(out)) break;
    out = out.replace(/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, body) => {
      if (body[0] === '#') {
        const isHex = body[1] === 'x' || body[1] === 'X';
        const code = isHex
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      const named = NAMED_ENTITIES[body.toLowerCase()];
      return named === undefined ? match : named;
    });
  }
  return out;
}

export function stripHtml(input) {
  let out = String(input ?? '');
  out = out.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  out = out.replace(/<br\s*\/?>/gi, ' ');
  out = out.replace(/<\/(p|div|li|h[1-6])>/gi, ' ');
  out = out.replace(/<[^>]+>/g, '');
  out = decodeEntities(out);
  out = out.replace(/[\u200b-\u200f\u202a-\u202e\ufeff]/g, '');
  return out.replace(/\s+/g, ' ').trim();
}

const BOILERPLATE = [
  /The post .{0,240}? appeared first on .{0,140}?\.?$/i,
  /(Read|Continue) more.{0,60}$/i,
  /The post .{0,240}? appeared first on .{0,140}?/i,
  /(Discussion|Link)\s*\|?/gi,
  /\[…\]|\[\.\.\.\]/g,
  /Share this.{0,40}$/i,
];

export function cleanSummary(input) {
  // 部分源会把 HTML 再转义一次（&lt;p&gt;…），需要多轮剥离。
  let text = String(input ?? '');
  for (let pass = 0; pass < 3; pass += 1) {
    const next = stripHtml(text);
    if (next === text) break;
    text = next;
  }
  for (const re of BOILERPLATE) text = text.replace(re, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export function truncate(input, max = 180) {
  const text = String(input ?? '').trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const cut = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf('; '),
    slice.lastIndexOf('，'),
    slice.lastIndexOf(' '),
  );
  const kept = cut > max * 0.55 ? slice.slice(0, cut) : slice;
  return `${kept.replace(/[\s,，、;；:.。」』]+$/, '')}…`;
}

export const shortHash = (input, length = 16) =>
  createHash('sha1').update(String(input)).digest('hex').slice(0, length);

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'as',
  'is', 'are', 'was', 'were', 'its', 'it', 'this', 'that', 'these', 'those', 'how', 'why', 'what',
  'new', 'now', 'will', 'can', 'could', 'should', 'you', 'your', 'we', 'our', 'they', 'their',
]);

/** 中文虚词：切 bigram 后再整词剔除意义不大，改为在归一化阶段删掉这些字符。 */
const CJK_FILLER = /[的了和与及或在是也都就而但对把被让给向从为以及之其此该这那]/g;

/**
 * 标题归一化：去掉源站后缀（`| TechCrunch`、` - The Verge`）、
 * 常见的 “标题：副标题” 结构与多余标点，让同一事件在不同站点的标题更容易匹配。
 */
export function normalizeTitle(title) {
  let out = decodeEntities(String(title ?? ''));
  out = out.replace(/\s+/g, ' ').trim();

  // 反复剥离末尾的站点名后缀，如 “Foo | TechCrunch” / “Foo - The Verge - AI”
  for (let pass = 0; pass < 3; pass += 1) {
    const next = out.replace(/\s*[|｜·—–-]{1,2}\s*[^|｜·—–-]{2,40}$/u, '').trim();
    if (next === out || next.length < 12) break;
    out = next;
  }
  // 末尾的省略号与括号补充内容
  out = out.replace(/\s*[（(【\[][^）)】\]]{0,40}[）)】\]]\s*$/u, ' ');

  return out
    .toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(CJK_FILLER, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 英文按词切分；中文按字 bigram 切分，避免整句无空格导致相似度恒为 0。 */
export function titleTokens(title) {
  const cleaned = normalizeTitle(title);
  const tokens = new Set();
  const runs = cleaned.match(/[\u3400-\u4dbf\u4e00-\u9fff]+|[\p{L}\p{N}]+/gu) ?? [];
  for (const run of runs) {
    if (/[\u3400-\u4dbf\u4e00-\u9fff]/.test(run)) {
      if (run.length === 1) {
        tokens.add(run);
        continue;
      }
      for (let i = 0; i < run.length - 1; i += 1) tokens.add(run.slice(i, i + 2));
      continue;
    }
    for (const word of run.split(/\s+/)) {
      if (!word || STOPWORDS.has(word)) continue;
      if (word.length < 2) continue;
      // 只归一化 4 位年份，版本号（gpt 5 / gpt 4）需要保留区分度
      tokens.add(/^(19|20)\d{2}$/.test(word) ? '#year' : word);
    }
  }
  return tokens;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** 对称包含度：短标题被长标题覆盖的比例，用于识别 “主标题 + 追加副标题” 的同一事件。 */
export function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/** 追踪类查询参数，不影响内容本身。 */
const TRACKING_PARAMS = /^(utm_[a-z_]+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|source|src|cmpid|smid|share|spm|from|__twitter_impression|guccounter|guce_referrer|guce_referrer_sig|at_medium|at_campaign)$/i;

/** URL 归一化：统一协议与小写主机、去掉 www./AMP/追踪参数/锚点/尾斜杠。 */
export function urlKey(url) {
  let raw = String(url ?? '').trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return raw.toLowerCase();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw.toLowerCase();
  }
  parsed.hash = '';
  parsed.protocol = 'https:';
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) parsed.searchParams.delete(key);
  }
  const search = parsed.searchParams.toString();
  const pathname = parsed.pathname
    .replace(/\/amp\/?$/i, '/')
    .replace(/(?:\/index)?\.(?:html?|php|aspx?)$/i, '')
    .replace(/\/+$/, '');
  return `${parsed.hostname}${pathname}${search ? `?${search}` : ''}`.toLowerCase();
}

