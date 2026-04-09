module.exports = {
  tailwind: false,
  site: {
    siteName: 'Lidex',
    siteSubtitle: 'Declarative Markdown Site Engine',
    footerText: '© 2026 · Lidex · Markdown, routes, queries',
  },
  theme: {
    directory: 'assets/public',
  },
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
    },
    concepts: {
      route: '/docs',
      source: 'content/concepts.md',
    },
    design: {
      route: '/design',
      source: 'content/design.md',
    },
    blocks: {
      route: '/blocks',
      source: 'content/blocks.md',
    },
    details: {
      route: '/details',
      source: 'content/details.md',
    },
    news: {
      route: '/queries',
      source: 'content/news.md',
    },
    theme: {
      route: '/theme',
      source: 'content/theme.md',
    },
  },
  blocks: {
    feature: {
      template: 'featureCard',
      wrapperTemplate: 'featureGridWrapper',
      fields: {
        title: { type: 'string', required: true },
        kicker: { type: 'string', required: true },
        summary: { type: 'string', required: true },
      },
      hasDetailPage: true,
      enablePagination: true,
      contentDir: 'content/features',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/blocks/:slug',
      detailTemplate: 'featureDetail',
    },
    news: {
      template: 'newsCard',
      fields: {
        title: { type: 'string', required: true },
        publishedAt: { type: 'string', required: true },
        category: { type: 'string', required: true },
        summary: { type: 'string', required: true },
      },
      hasDetailPage: true,
      enablePagination: true,
      contentDir: 'content/news',
      slugField: '_slug_',
      slugSourceField: 'title',
      route: '/queries/:slug',
      detailTemplate: 'newsDetail',
    },
    pub: {
      template: 'publicationCard',
      fields: {
        title: { type: 'string', required: true },
        journal: { type: 'string', required: true },
        year: { type: 'string', required: true },
        authors: { type: 'string', required: true },
        summary: { type: 'string', required: true },
        photo: { type: 'string', required: true },
        link: { type: 'string', required: true },
      },
    },
    photo: {
      template: 'photoCard',
      fields: {
        title: { type: 'string', required: true },
        caption: { type: 'string', required: true },
        photo: { type: 'string', required: true },
        date: { type: 'string', required: true },
      },
    },
  },
  templates: {
    pageShell: 'templates/page-shell.html',
    featureCard: 'templates/blocks/feature-card.html',
    featureGridWrapper: 'templates/blocks/feature-grid.html',
    newsCard: 'templates/blocks/news-card.html',
    publicationCard: 'templates/blocks/publication-card.html',
    photoCard: 'templates/blocks/photo-card.html',
    featureDetail: 'templates/details/feature-detail.html',
    newsDetail: 'templates/details/news-detail.html',
  },
  queryTemplates: {
    latestNews: 'templates/query/latest-news.html',
  },
};


