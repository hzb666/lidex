module.exports = {
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
    },
    listingShadow: {
      route: '/listing/example-item',
      source: 'content/home.md',
    },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
        category: { type: 'string', required: false },
        publishedAt: { type: 'string', required: false },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  templates: {
    cardGrid: 'templates/blocks/card-grid.html',
    standardDetail: 'templates/details/standard-detail.html',
  },
  queryTemplates: {
    compactList: 'templates/query/compact-list.html',
  },
};
