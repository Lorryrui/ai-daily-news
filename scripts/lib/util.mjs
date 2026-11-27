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

export const weekdayOf = (key) => WEEKDAY_FMT.format(new Date(`${key}T12:00:00Z`));
export const monthLabel = (key) => `${key.slice(0, 4)}年${Number(key.slice(5, 7))}月`;
export const shortDate = (key) => `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;
export const longDate = (key) =>
  `${key.slice(0, 4)}年${Number(key.slice(5, 7))}月${Number(key.slice(8, 10))}日`;

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

export function titleTokens(title) {
  const cleaned = String(title ?? '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = new Set();
  for (const word of cleaned.split(' ')) {
    if (!word) continue;
    if (STOPWORDS.has(word)) continue;
    if (word.length < 2 && !/[\u4e00-\u9fff]/.test(word)) continue;
    tokens.add(word);
  }
  return tokens;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}
