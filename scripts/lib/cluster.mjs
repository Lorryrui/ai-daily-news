import { jaccard, titleTokens } from './util.mjs';
import { SOURCE_MAP } from './sources.mjs';

const SIMILARITY_THRESHOLD = 0.5;

const KIND_WEIGHT = { official: 12, product: 10, news: 8, community: 4 };

function scoreOf(item) {
  const source = SOURCE_MAP.get(item.source);
  const base = source?.weight ?? 8;
  const recency = Math.max(0, 1 - (Date.now() - new Date(item.publishedAt).getTime()) / (6 * 24 * 3600 * 1000));
  const hasSummary = item.summary ? 4 : 0;
  const hasImage = item.image ? 2 : 0;
  return base + (KIND_WEIGHT[item.kind] ?? 0) + recency * 10 + hasSummary + hasImage;
}

/**
 * 按标题相似度把同一事件的多个来源报道聚合为一个条目：
 * 保留评分最高的来源作为主条目，其他来源记录到 related。
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
      if (cluster.lead.source === item.source) continue;
      if (jaccard(cluster.lead.tokens, item.tokens) >= SIMILARITY_THRESHOLD) {
        target = cluster;
        break;
      }
    }
    if (target) {
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
      clusters.push({ lead: item, related: [], score: item.score });
    }
  }

  return clusters
    .sort((a, b) => b.score - a.score)
    .map(({ lead, related }) => {
      const { tokens, score, ...rest } = lead;
      return { ...rest, related };
    });
}

export function dedupeByUrl(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}
