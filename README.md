# AI 日报 · ai-daily-news

自动抓取 [Product Hunt](https://www.producthunt.com/)、[TechCrunch](https://techcrunch.com/category/artificial-intelligence/)、[量子位](https://www.qbitai.com/) 等 **11 个来源**的 AI 产品与行业动态，每天北京时间 **06:00** 生成一期可直接浏览的静态日报，同时提供**中文与英文**两个版本。

- 线上地址：<https://lorryrui.github.io/ai-daily-news/>（英文版 `…/en/`）
- 纯静态：无需数据库与后端，产物由 GitHub Actions 定时抓取并部署到 GitHub Pages
- 亮色 / 暗色主题，默认跟随系统，可手动切换并记忆
- 语言默认跟随操作系统：中文系统进中文版，其它进英文版；可手动切换并记忆
- 每期按「新产品 / 行业动态 / 官方更新 / 深度分析 / 社区热议」分区，跨源合并同一事件的报道
- 支持按日期归档、全站关键词搜索（快捷键 `/` 或 `Ctrl/Cmd + K`）、RSS 订阅

## 目录结构

```
.
├── scripts/
│   ├── build.mjs          # 构建入口：抓取 → 合并历史 → 渲染双语站点
│   ├── clean.mjs          # 清理生成产物（保留 data/）
│   └── lib/
│       ├── sources.mjs    # 内容源清单（feed / API、分类、权重）
│       ├── collect.mjs    # 抓取、解析 RSS/Atom/HN API、文本清洗
│       ├── cluster.mjs    # URL 去重 + 标题相似度聚类
│       ├── i18n.mjs       # 中英文文案与多语言路由
│       ├── render.mjs     # HTML 模板（首页 / 期号页 / 归档页 / RSS）
│       ├── site.mjs       # 站点绝对地址
│       └── util.mjs       # 时间、文本、去重与转义工具
├── assets/                # 源样式与脚本，构建时复制到站点根目录
├── data/issues/           # 每期原始数据（JSON），构建时作为历史读回
├── issue/                 # 生成的每日页面（中文）
├── en/                    # 英文版：en/index.html、en/issue/…、en/archive.html
├── index.html             # 中文首页 = 最新一期
├── archive.html           # 归档页
├── search-index.json      # 全站搜索索引（浏览器端懒加载）
└── feed.xml               # RSS 2.0
```

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install          # 安装依赖（fast-xml-parser）
npm run build        # 抓取最新内容并重新生成整个站点
npm run build:offline # 不联网，只用 data/issues 里的数据重新渲染页面
npm run clean        # 删除生成的 HTML / 索引 / feed（保留 data）
```

构建完成后用任意静态服务器预览，例如：

```bash
npx serve .
```

可选环境变量：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SITE_URL` | 站点绝对地址，用于 canonical、hreflang 与 RSS 链接 | `https://lorryrui.github.io/ai-daily-news/` |
| `MIN_ISSUE_ITEMS` | 一期最少条目数，低于此值不发布 | `1` |
| `OFFLINE` | 设为 `1` 等同于 `--offline` | 未设置 |

## 期号规则

第 `D` 期收录北京时间 `D-1 06:00` 到 `D 06:00` 之间的内容。因此站点上不会出现「今天还没到 06:00 就已更新」的未来期号，早于截稿时间的新内容会自动累加到下一期。

## 内容源

共 11 个来源，分五类，**每个分类最多 3 家主流源**（`lang` 为 `zh` 的中文源在英文页面同样展示，仅界面文案切换）：

| 分类 | 来源 |
| --- | --- |
| 产品 | Product Hunt |
| 媒体 | TechCrunch、The Verge、量子位 |
| 官方 | OpenAI、Google DeepMind、Microsoft Research |
| 深度 | Simon Willison、Latent Space、One Useful Thing |
| 社区 | Hacker News（Algolia API） |

泛科技源（如 Microsoft Research、Simon Willison、Hacker News）在 `sources.mjs` 里标记 `filter: 'ai'`，只保留标题/摘要命中 AI 关键词的条目，中英文关键词都在 `collect.mjs` 的 `AI_PATTERN` 中维护。

从源清单移除某个源后，**历史期号里属于它的条目也会一并停止展示**（构建时按当前 `SOURCES` 过滤，见 `build.mjs` 的 `pruneToCurrentSources`），所以归档页显示的来源始终与当前清单一致。原始抓取记录不会被删除：`data/issues/*.json` 保留全部条目，源加回来就能重新出现在页面上。

## 去重策略

同一事件常被多家媒体同时报道，站点做三层去重：

1. **URL 归一化**（`util.urlKey`）：统一协议与大小写、去掉 `www.`、AMP、`index.html`、追踪参数（`utm_*`、`fbclid`、`ref` 等）与锚点，同一链接只留评分最高的一份。
2. **标题归一化**（`util.normalizeTitle`）：剥离 `| TechCrunch`、` - The Verge` 之类站点后缀与尾部括号补充，去标点、去英文停用词、去中文虚词，4 位年份统一为占位符（版本号如 `gpt5` / `gpt4` 保留区分度）。
3. **相似度聚类**（`cluster.clusterItems`）：标题词集合 Jaccard ≥ 0.3，或较短标题被覆盖 ≥ 0.58（且较短标题至少 5 个词，避免短标题误判），即视为同一事件。判定时与**簇内任意成员**比较，因此措辞差异大的第三篇报道能通过中间那篇桥接进来；同一来源的多篇文章不合并。

合并后保留权重最高的一条作为卡片主条目，其余来源列在卡片下方「另有 N 家媒体报道」，并在页面摘要里统计合并数量。中文标题按字 bigram 切词，所以中英文标题混排时也能比较。

## 自动更新

[`.github/workflows/daily.yml`](.github/workflows/daily.yml) 每天 `0 22 * * *`（UTC，即北京时间 06:00）执行：

1. `npm ci` 安装依赖
2. `npm run build` 抓取并生成页面
3. 把新生成的数据与页面提交回仓库
4. 通过 `actions/deploy-pages` 部署到 GitHub Pages

也可以在 Actions 页面手动 `workflow_dispatch` 触发一次。

部署前需要在仓库 `Settings → Pages` 把 Source 设为 **GitHub Actions**；`package.json` 的 `homepage`、`SITE_URL` 变量与仓库实际的 Pages 地址保持一致即可。

## 许可

内容版权归各来源站点与原作者所有，本仓库仅做聚合展示。代码遵循 [LICENSE](LICENSE)。
