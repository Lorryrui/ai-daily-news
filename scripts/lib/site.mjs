/** 站点级常量：仓库地址与部署根 URL（可由 SITE_URL 环境变量覆盖）。 */
export const REPO_URL = 'https://github.com/Lorryrui/ai-daily-news';

export const SITE_URL = `${(process.env.SITE_URL || 'https://lorryrui.github.io/ai-daily-news').replace(
  /\/+$/,
  '',
)}/`;
