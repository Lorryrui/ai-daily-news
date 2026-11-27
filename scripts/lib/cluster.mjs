import { jaccard, overlap, titleTokens, urlKey } from './util.mjs';
import { SOURCE_MAP } from './sources.mjs';

/**
 * 同一事件的判定：标题词集合的 Jaccard 相似度，或短标题被长标题覆盖的比例。
 * 覆盖度阈值对短标题很敏感（三五个词就可能 100% 命中），因此要求较短的一方
 * 至少有 OVERLAP_MIN_TOKENS 个词才允许按覆盖度判定。
 */
const JACCARD_THRESHOLD = 0.3;
const OVERLAP_THRESHOLD = 0.58;
const OVERLAP_MIN_TOKENS = 5;

const KIND_WEIGHT = { official: 12, product: 10, insight: 9, news: 8, community: 4 };

function scoreOf(item) {
  const source = SOURCE_MAP.get(item.source);
  const base = source?.weight ?? 8;
  const recency = Math.max(0, 1 - (Date.now() - new Date(item.publishedAt).getTime()) / (6 * 24 * 3600 * 1000));
  const hasSummary = item.summary ? 4 : 0;
  const hasImage = item.image ? 2 : 0;
  return base + (KIND_WEIGHT[item.kind] ?? 0) + recency * 10 + hasSummary + hasImage;
}

const sameStory = (a, b) => {
  if (jaccard(a.tokens, b.tokens) >= JACCARD_THRESHOLD) return true;
  const shorter = Math.min(a.tokens.size, b.tokens.size);
  return shorter >= OVERLAP_MIN_TOKENS && overlap(a.tokens, b.tokens) >= OVERLAP_THRESHOLD;
};

/**
 * 按标题相似度把同一事件的多个来源报道聚合为一个条目：
 * 保留评分最高的来源作为主条目，其他来源记录到 related。
 * 判定时与该簇里的任意一条比较（而不是只比主条目），
 * 这样措辞差异较大的第三篇报道也能通过中间那篇桥接进来。
 */
export function clusterItems(items) {
  const prepared = items.map((item) => ({
    ...item,
    tokens: titleTokens(item.title),
    score: scoreOf(item),
  }));
  prepared.sort((a, b) => b.score - a.score || new Date(b.publishedAt) - new Date(a.publishedAt));

  const clusters = [];
  for (const item of prepared) {
    let target = null;
    for (const cluster of clusters) {
      // 同一来源的不同文章不聚类（同一站点的系列报道通常是不同事件）
      if (cluster.members.some((member) => member.source === item.source)) continue;
      if (cluster.members.some((member) => sameStory(member, item))) {
        target = cluster;
        break;
      }
    }
    if (target) {
      target.members.push(item);
      target.related.push({
        source: item.source,
        sourceName: item.sourceName,
        title: item.title,
        url: item.url,
        kind: item.kind,
        lang: item.lang,
        publishedAt: item.publishedAt,
      });
      target.score += 1.5;
    } else {
      clusters.push({ members: [item], related: [], score: item.score });
    }
  }

  return clusters
    .sort((a, b) => b.score - a.score)
    .map(({ members, related }) => {
      const { tokens, score, ...rest } = members[0];
      return { ...rest, related };
    });
}

/** 按归一化 URL 去重，同一 URL 的多次抓取只保留评分更高的一份。 */
export function dedupeByUrl(items) {
  const seen = new Map();
  for (const item of items) {
    const key = urlKey(item.url) || item.url.toLowerCase();
    const existing = seen.get(key);
    if (!existing || scoreOf(item) > scoreOf(existing)) seen.set(key, item);
  }
  return [...seen.values()];
}
