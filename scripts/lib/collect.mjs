import { XMLParser } from 'fast-xml-parser';
import { SOURCES } from './sources.mjs';
import { cleanSummary, decodeEntities, shortHash, stripHtml, truncate } from './util.mjs';

const USER_AGENT =
  'Mozilla/5.0 (compatible; ai-daily-news/1.0; +https://github.com/Lorryrui/ai-daily-news)';
const TIMEOUT_MS = 25000;
const MAX_AGE_DAYS = 12;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  cdataPropName: '__cdata',
  parseTagValue: false,
  processEntities: false,
});

const AI_PATTERN =
  /\b(a\.?i\.?|artificial intelligence|machine learning|deep learning|llm|llms|gpt[-\s]?\d*|chatgpt|claude|gemini|openai|anthropic|deepmind|mistral|llama|neural|agentic|agents?|chatbot|diffusion|transformer|multimodal|nvidia|inference|fine-?tun\w+|copilot|midjourney|stable diffusion|hugging face|generative|foundation model|reasoning model|rag)\b|人工智能|大模型|大语言模型|语言模型|机器学习|深度学习|神经网络|多模态|生成式|智能体|提示词|算力|微调/i;

const asArray = (value) => {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};

function text(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).find((part) => part.trim()) ?? '';
  if (typeof value === 'object') {
    if (value.__cdata != null) return text(value.__cdata);
    if (value['#text'] != null) return text(value['#text']);
  }
  return '';
}

function pickLink(node) {
  const candidates = asArray(node);
  let fallback = '';
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('http')) return candidate;
    if (candidate && typeof candidate === 'object') {
      const href = candidate['@_href'] || candidate['@_url'];
      if (!href) continue;
      const rel = candidate['@_rel'];
      if (!rel || rel === 'alternate') return href;
      fallback ||= href;
    }
  }
  return fallback;
}

function pickImage(entry, html) {
  const direct = [
    entry['media:thumbnail']?.['@_url'],
    entry['media:content']?.['@_url'],
    asArray(entry.enclosure).find((item) => item?.['@_url'])?.['@_url'],
  ].find((url) => typeof url === 'string' && url.startsWith('http'));
  if (direct) return direct;
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html ?? '');
  if (match && match[1].startsWith('http')) return match[1];
  return '';
}

function parseDate(entry) {
  const raw =
    text(entry.pubDate) ||
    text(entry.published) ||
    text(entry.updated) ||
    text(entry['dc:date']) ||
    text(entry.date);
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function categoriesOf(entry) {
  return asArray(entry.category)
    .map((item) => text(item) || (typeof item === 'object' ? item?.['@_term'] : ''))
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeEntry(entry, source) {
  const rawTitle = text(entry.title);
  const url = pickLink(entry.link) || text(entry.guid) || text(entry.id);
  if (!rawTitle || !url || !url.startsWith('http')) return null;

  const html =
    text(entry['content:encoded']) ||
    text(entry.content) ||
    text(entry.description) ||
    text(entry.summary);
  const summary = truncate(cleanSummary(html || text(entry.summary)), 220);
  const publishedAt = parseDate(entry);
  if (!publishedAt) return null;

  return {
    id: shortHash(url),
    title: stripHtml(rawTitle).replace(/\s+/g, ' ').trim(),
    url,
    summary,
    image: pickImage(entry, html),
    author: cleanSummary(text(entry['dc:creator']) || text(entry.author?.name) || ''),
    tags: categoriesOf(entry),
    source: source.id,
    sourceName: source.name,
    kind: source.kind,
    lang: source.lang,
    publishedAt: publishedAt.toISOString(),
  };
}

function entriesFromXml(xml) {
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.['rdf:RDF'] ?? doc?.feed ?? null;
  if (!channel) return [];
  return [...asArray(channel.item), ...asArray(channel.entry)];
}

async function request(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.8',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function withRetry(task, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw lastError;
}

async function collectFeed(source) {
  const xml = await withRetry(async () => (await request(source.feed)).text());
  const entries = entriesFromXml(xml);
  const items = entries
    .map((entry) => normalizeEntry(entry, source))
    .filter(Boolean)
    .slice(0, source.limit ?? 20);
  return items;
}

async function collectHackerNews(source) {
  const days = 3;
  const since = Math.floor((Date.now() - days * 24 * 3600 * 1000) / 1000);
  const url = `${source.api}?query=AI&tags=story&hitsPerPage=100&numericFilters=created_at_i>${since},points>15`;
  const payload = await withRetry(async () => (await request(url)).json());
  return (payload.hits ?? [])
    .filter((hit) => hit.title && AI_PATTERN.test(hit.title))
    .map((hit) => ({
      id: shortHash(hit.objectID),
      title: hit.title.replace(/\s+/g, ' ').trim(),
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      summary: `Hacker News 上获得 ${hit.points} 点支持、${hit.num_comments ?? 0} 条讨论。`,
      image: '',
      author: hit.author ?? '',
      tags: ['Hacker News'],
      source: source.id,
      sourceName: source.name,
      kind: source.kind,
      lang: source.lang,
      points: hit.points ?? 0,
      discussion: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      publishedAt: new Date(hit.created_at).toISOString(),
    }))
    .slice(0, source.limit ?? 15);
}

function isRelevant(item) {
  if (!item) return false;
  const haystack = `${item.title} ${item.summary} ${item.tags.join(' ')}`;
  return AI_PATTERN.test(haystack);
}

export async function collectAll({ onProgress = () => {}, maxAgeDays = MAX_AGE_DAYS } = {}) {
  const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const items = source.api
        ? await collectHackerNews(source)
        : await collectFeed(source);
      const kept = items.filter(
        (item) =>
          new Date(item.publishedAt).getTime() >= cutoff &&
          (source.filter === 'ai' ? isRelevant(item) : true),
      );
      onProgress({ source, count: kept.length });
      return { source, items: kept };
    }),
  );

  const items = [];
  const reports = [];
  results.forEach((result, index) => {
    const source = SOURCES[index];
    if (result.status === 'fulfilled') {
      items.push(...result.value.items);
      reports.push({ id: source.id, name: source.name, ok: true, count: result.value.items.length });
    } else {
      const message = result.reason?.message ?? String(result.reason);
      reports.push({ id: source.id, name: source.name, ok: false, count: 0, error: message });
      onProgress({ source, count: 0, error: message });
    }
  });

  return { items, reports };
}

export { AI_PATTERN, decodeEntities };
