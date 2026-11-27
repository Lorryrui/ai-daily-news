#!/usr/bin/env node
/**
 * 静态站点构建脚本。
 *   node scripts/build.mjs            抓取 → 合并历史 → 生成站点（中文 + 英文）
 *   node scripts/build.mjs --offline  只用 data/issues 里已存的数据重新生成页面
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { clusterItems, dedupeByUrl } from './lib/cluster.mjs';
import { collectAll } from './lib/collect.mjs';
import { LANG_PREFIX, LANGS, langPaths, text } from './lib/i18n.mjs';
import { renderArchive, renderHome, renderIssue } from './lib/render.mjs';
import { SITE_URL } from './lib/site.mjs';
import {
  chinaDateKey,
  chinaTime,
  currentIssueLabel,
  esc,
  issueDateOf,
  longDate,
  truncate,
  urlKey,
} from './lib/util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA_DIR = path.join(ROOT, 'data', 'issues');
const ASSETS_DIR = path.join(ROOT, 'assets');

const OFFLINE = process.argv.includes('--offline') || process.env.OFFLINE === '1';
const MAX_FEED_ITEMS = 50;
/** 内容太少的期号（多为首次抓取时旧 feed 只剩几条）不发布，避免出现空荡的页面。 */
const MIN_ISSUE_ITEMS = Number(process.env.MIN_ISSUE_ITEMS ?? 6);

/** 每种语言在站点里的输出目录。 */
const OUT = {
  zh: { issueDir: path.join(ROOT, 'issue'), homeDir: ROOT },
  en: { issueDir: path.join(ROOT, 'en', 'issue'), homeDir: path.join(ROOT, 'en') },
};

async function writeIfChanged(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  try {
    const current = await readFile(file, 'utf8');
    if (current === content) return false;
  } catch {
    /* 文件不存在，直接写入 */
  }
  await writeFile(file, content, 'utf8');
  return true;
}

async function loadStoredIssues() {
  const stored = new Map();
  let files = [];
  try {
    files = (await readdir(DATA_DIR)).filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name));
  } catch {
    return stored;
  }
  for (const file of files) {
    const raw = await readFile(path.join(DATA_DIR, file), 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.items) || !parsed?.date) continue;
    stored.set(parsed.date, {
      date: parsed.date,
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
      items: parsed.items,
    });
  }
  return stored;
}

function mergeIntoStored(stored, items, touched) {
  const groups = new Map();
  for (const item of items) {
    const key = issueDateOf(new Date(item.publishedAt));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  for (const [date, fresh] of groups) {
    const existing = stored.get(date);
    const byUrl = new Map();
    for (const item of existing?.items ?? []) byUrl.set(urlKey(item.url), item);
    let added = 0;
    for (const item of fresh) {
      const key = urlKey(item.url);
      if (byUrl.has(key)) {
        // 用最新抓取结果覆盖旧记录（摘要/图片可能被源站更新）
        const previous = byUrl.get(key);
        if (previous.summary !== item.summary || previous.image !== item.image) {
          byUrl.set(key, { ...previous, ...item });
          touched.add(date);
        }
        continue;
      }
      byUrl.set(key, item);
      added += 1;
    }
    if (added > 0) touched.add(date);
    stored.set(date, {
      date,
      generatedAt: added > 0 || !existing ? new Date().toISOString() : existing.generatedAt,
      items: [...byUrl.values()],
    });
  }
}

function summarize(entry) {
  const items = clusterItems(entry.items);
  const stats = { product: 0, news: 0, official: 0, insight: 0, community: 0 };
  const sourceCounts = new Map();
  const bump = (source, name) => {
    const current = sourceCounts.get(source) ?? { id: source, name, count: 0 };
    current.count += 1;
    sourceCounts.set(source, current);
  };

  let relatedTotal = 0;
  for (const item of items) {
    stats[item.kind] = (stats[item.kind] ?? 0) + 1;
    bump(item.source, item.sourceName);
    for (const related of item.related) {
      relatedTotal += 1;
      bump(related.source, related.sourceName);
    }
  }

  return {
    date: entry.date,
    generatedAt: entry.generatedAt,
    items,
    total: items.length,
    relatedTotal,
    sourceTotal: sourceCounts.size,
    stats,
    sources: [...sourceCounts.values()],
  };
}

function rfc822(iso) {
  return new Date(iso).toUTCString();
}

function renderFeed(issues, lang) {
  const t = text(lang);
  const paths = langPaths();
  const prefix = LANG_PREFIX[lang];
  const latest = issues[issues.length - 1];
  const entries = [];
  for (const issue of [...issues].reverse()) {
    for (const item of issue.items) {
      entries.push({ issue, item });
      if (entries.length >= MAX_FEED_ITEMS) break;
    }
    if (entries.length >= MAX_FEED_ITEMS) break;
  }

  const body = entries
    .map(({ issue, item }) => {
      const parts = [
        `<title>${esc(item.title)}</title>`,
        `<link>${esc(item.url)}</link>`,
        `<guid isPermaLink="true">${esc(item.url)}</guid>`,
        `<pubDate>${rfc822(item.publishedAt)}</pubDate>`,
        `<description>${esc(item.summary || item.title)}</description>`,
        `<category>${esc(item.sourceName)}</category>`,
        `<source url="${esc(`${SITE_URL}${prefix}${paths.issue(issue.date)}`)}">${esc(t.siteName)}</source>`,
      ];
      return `    <item>\n      ${parts.join('\n      ')}\n    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(t.siteName)}</title>
    <link>${esc(`${SITE_URL}${prefix}${paths.home}`)}</link>
    <description>${esc(t.description)}</description>
    <language>${lang === 'en' ? 'en' : 'zh-CN'}</language>
    <lastBuildDate>${rfc822(latest?.generatedAt ?? new Date().toISOString())}</lastBuildDate>
    <atom:link href="${esc(`${SITE_URL}${prefix}${paths.feed}`)}" rel="self" type="application/rss+xml"/>
${body}
  </channel>
</rss>
`;
}

function renderSearchIndex(issues) {
  const items = [];
  for (const issue of [...issues].reverse()) {
    for (const item of issue.items) {
      items.push({
        t: item.title,
        s: truncate(item.summary, 140),
        u: item.url,
        n: item.sourceName,
        k: item.kind,
        d: issue.date,
        g: [...(item.tags ?? []), item.author].filter(Boolean).join(' '),
      });
    }
  }
  // 用最新一期的生成时间而非当前时间，保证同一份数据重复构建产物完全一致
  const generatedAt = issues[issues.length - 1]?.generatedAt ?? new Date().toISOString();
  return `${JSON.stringify({ generatedAt, items })}\n`;
}

async function pruneIssuePages(keep, dir) {
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    return;
  }
  for (const file of files) {
    if (!file.endsWith('.html') || keep.has(file)) continue;
    await rm(path.join(dir, file), { force: true });
    console.log(`  - 移除不再发布的页面 ${path.relative(ROOT, path.join(dir, file))}`);
  }
}

async function copyAssets() {
  for (const name of ['styles.css', 'app.js', 'favicon.svg']) {
    try {
      await copyFile(path.join(ASSETS_DIR, name), path.join(ROOT, name));
    } catch (error) {
      console.warn(`  ! 跳过静态资源 ${name}：${error.message}`);
    }
  }
}

async function main() {
  const startedAt = Date.now();
  console.log(`AI 日报构建开始（${chinaDateKey(new Date())} ${chinaTime(new Date())} 北京时间）`);

  const stored = await loadStoredIssues();
  console.log(`读取历史期号 ${stored.size} 个`);

  if (OFFLINE) {
    console.log('离线模式：跳过抓取，仅重新渲染页面');
  } else {
    const { items, reports } = await collectAll({
      onProgress: ({ source, count, error }) => {
        console.log(error ? `  ✗ ${source.name}: ${error}` : `  ✓ ${source.name}: ${count} 条`);
      },
    });
    const unique = dedupeByUrl(items);
    const failed = reports.filter((report) => !report.ok);
    console.log(
      `抓取完成：${unique.length} 条（去重前 ${items.length} 条），失败源 ${failed.length} 个`,
    );

    const touched = new Set();
    mergeIntoStored(stored, unique, touched);
    if (!stored.size) {
      console.error('没有抓到任何内容，且没有历史数据，跳过生成。');
      process.exit(1);
    }

    for (const date of [...touched].sort()) {
      const entry = stored.get(date);
      await writeIfChanged(
        path.join(DATA_DIR, `${date}.json`),
        `${JSON.stringify({ date, generatedAt: entry.generatedAt, items: entry.items }, null, 0)}\n`,
      );
    }
    console.log(`更新数据文件 ${touched.size} 个`);
  }

  const label = currentIssueLabel();
  const issues = [...stored.values()]
    .filter((entry) => entry.date <= label && entry.items.length >= MIN_ISSUE_ITEMS)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry, index) => ({ ...summarize(entry), sequence: index + 1 }));

  if (!issues.length) {
    console.error('没有任何可渲染的期号。');
    process.exit(1);
  }

  let written = 0;
  const track = async (file, content) => {
    if (await writeIfChanged(file, content)) written += 1;
  };

  const latest = issues[issues.length - 1];
  const reversed = [...issues].reverse();
  const keep = new Set(issues.map((issue) => `${issue.date}.html`));

  for (const lang of LANGS) {
    const out = OUT[lang];
    const paths = langPaths();

    for (let index = 0; index < issues.length; index += 1) {
      const issue = issues[index];
      await track(
        path.join(out.issueDir, `${issue.date}.html`),
        renderIssue({
          issue,
          issues: reversed,
          prev: issues[index - 1] ?? null,
          next: issues[index + 1] ?? null,
          lang,
        }),
      );
    }
    await pruneIssuePages(keep, out.issueDir);

    const homeDir = out.homeDir;
    await track(
      path.join(homeDir, 'index.html'),
      renderHome({
        latest: { issue: latest },
        issues: reversed,
        prev: issues[issues.length - 2] ?? null,
        lang,
      }),
    );

    await track(
      path.join(homeDir, 'archive.html'),
      renderArchive({
        issues: reversed,
        lang,
        generatedAt: latest.generatedAt,
      }),
    );

    await track(path.join(homeDir, 'search-index.json'), renderSearchIndex(issues));
    await track(path.join(homeDir, 'feed.xml'), renderFeed(issues, lang));
  }

  await track(path.join(ROOT, '.nojekyll'), '');
  await copyAssets();

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `构建完成：${issues.length} 期 × ${LANGS.length} 种语言，最新 ${longDate(latest.date)}（${latest.total} 条），写入 ${written} 个文件，用时 ${seconds}s`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
