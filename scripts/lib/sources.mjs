// 内容源定义。
// kind: product(产品发布) / news(媒体) / official(官方博客) / insight(深度分析) / community(社区讨论)
// weight 用于排序加权；filter: 'ai' 表示该源是泛科技源，需要做 AI 关键词过滤。
// 每个分类最多 3 家主流源，避免单日条目过多。

export const SOURCES = [
  // ---------- 产品社区 ----------
  {
    id: 'producthunt',
    name: 'Product Hunt',
    homepage: 'https://www.producthunt.com/topics/artificial-intelligence',
    feed: 'https://www.producthunt.com/feed?category=artificial-intelligence',
    kind: 'product',
    lang: 'en',
    weight: 24,
    limit: 40,
  },

  // ---------- 科技媒体：2 英 + 1 中 ----------
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    homepage: 'https://techcrunch.com/category/artificial-intelligence/',
    feed: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    kind: 'news',
    lang: 'en',
    weight: 20,
    limit: 25,
  },
  {
    id: 'theverge',
    name: 'The Verge',
    homepage: 'https://www.theverge.com/ai-artificial-intelligence',
    feed: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    kind: 'news',
    lang: 'en',
    weight: 18,
    limit: 20,
  },
  {
    id: 'qbitai',
    name: '量子位',
    homepage: 'https://www.qbitai.com/',
    feed: 'https://www.qbitai.com/feed',
    kind: 'news',
    lang: 'zh',
    weight: 17,
    limit: 25,
  },

  // ---------- 官方博客 ----------
  {
    id: 'openai',
    name: 'OpenAI',
    homepage: 'https://openai.com/news/',
    feed: 'https://openai.com/news/rss.xml',
    kind: 'official',
    lang: 'en',
    weight: 22,
    limit: 20,
  },
  {
    id: 'deepmind',
    name: 'Google DeepMind',
    homepage: 'https://deepmind.google/discover/blog/',
    feed: 'https://deepmind.google/blog/rss.xml',
    kind: 'official',
    lang: 'en',
    weight: 20,
    limit: 15,
  },
  {
    id: 'msresearch',
    name: 'Microsoft Research',
    homepage: 'https://www.microsoft.com/en-us/research/blog/',
    feed: 'https://www.microsoft.com/en-us/research/feed/',
    kind: 'official',
    lang: 'en',
    weight: 15,
    limit: 15,
    filter: 'ai',
  },

  // ---------- 深度分析 / 通讯 ----------
  {
    id: 'simonwillison',
    name: 'Simon Willison',
    homepage: 'https://simonwillison.net/',
    feed: 'https://simonwillison.net/atom/everything/',
    kind: 'insight',
    lang: 'en',
    weight: 14,
    limit: 15,
    filter: 'ai',
  },
  {
    id: 'latentspace',
    name: 'Latent Space',
    homepage: 'https://www.latent.space/',
    feed: 'https://www.latent.space/feed',
    kind: 'insight',
    lang: 'en',
    weight: 13,
    limit: 12,
  },
  {
    id: 'oneusefulthing',
    name: 'One Useful Thing',
    homepage: 'https://www.oneusefulthing.org/',
    feed: 'https://www.oneusefulthing.org/feed',
    kind: 'insight',
    lang: 'en',
    weight: 12,
    limit: 12,
  },

  // ---------- 社区 ----------
  {
    id: 'hackernews',
    name: 'Hacker News',
    homepage: 'https://news.ycombinator.com/',
    api: 'https://hn.algolia.com/api/v1/search_by_date',
    kind: 'community',
    lang: 'en',
    weight: 10,
    limit: 25,
  },
];

export const SOURCE_MAP = new Map(SOURCES.map((source) => [source.id, source]));

export const KIND_LABELS = {
  product: '产品',
  news: '媒体',
  official: '官方',
  insight: '深度',
  community: '社区',
};

export const KIND_ORDER = ['product', 'news', 'official', 'insight', 'community'];