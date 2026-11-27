# AI 日报 · ai-daily-news

自动抓取 [Product Hunt](https://www.producthunt.com/)、[TechCrunch](https://techcrunch.com/category/artificial-intelligence/) 等 15 个来源的 AI 产品与行业动态，每天北京时间 **06:00** 生成一期可直接浏览的静态日报。

- 线上地址：<https://lorryrui.github.io/ai-daily-news/>
- 纯静态：无需数据库与后端，产物由 GitHub Actions 定时抓取并部署到 GitHub Pages
- 亮色 / 暗色主题，默认跟随系统，可手动切换并记忆
- 每期按「新产品 / 行业动态 / 官方更新 / 社区热议」分区，合并同一事件的多源报道
- 支持按日期归档、全站关键词搜索（快捷键 `/` 或 `Ctrl/Cmd + K`）、RSS 订阅

## 目录结构

```
.
├── scripts/
│   ├── build.mjs          # 构建入口：抓取 → 合并历史 → 渲染站点
│   ├── clean.mjs          # 清理生成产物（保留 data/）
│   └── lib/
│       ├── sources.mjs    # 内容源清单（feed / API、分类、权重）
│       ├── collect.mjs    # 抓取、解析 RSS/Atom/HN API、文本清洗
│       ├── cluster.mjs    # URL 去重 + 标题相似度聚类
│       ├── render.mjs     # HTML 模板（首页 / 期号页 / 归档页 / RSS）
│       └── util.mjs       # 时间、文本与转义工具
├── assets/                # 源样式与脚本，构建时复制到站点根目录
├── data/issues/           # 每期原始数据（JSON），构建时作为历史读回
├── issue/                 # 生成的每日页面
├── index.html             # 首页 = 最新一期
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
| `SITE_URL` | 站点绝对地址，用于 canonical 与 RSS 链接 | `https://lorryrui.github.io/ai-daily-news/` |
| `MIN_ISSUE_ITEMS` | 一期最少条目数，低于此值不发布（避免首次抓取出现空期） | `6` |
| `OFFLINE` | 设为 `1` 等同于 `--offline` | 未设置 |

## 期号规则

第 `D` 期收录北京时间 `D-1 06:00` 到 `D 06:00` 之间的内容。因此站点上不会出现「今天还没到 06:00 就已更新」的未来期号，早于截稿时间的新内容会自动累加到下一期。

## 内容源

| 分类 | 来源 |
| --- | --- |
| 产品 | Product Hunt |
| 媒体 | TechCrunch、The Verge、The Decoder、MarkTechPost、WIRED、MIT Technology Review、Ars Technica、VentureBeat、Synced、量子位 |
| 官方 | OpenAI、Google DeepMind、Google AI |
| 社区 | Hacker News（Algolia API） |

排序参考来源权重与热度，同一事件被多家媒体报道时合并为一条，并在卡片下方标注其他来源。任何源抓取失败都只记录日志，不影响其余来源与构建结果。

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
