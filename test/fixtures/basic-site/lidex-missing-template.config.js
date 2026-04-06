module.exports = {
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
    },
    listing: {
      route: '/listing',
      source: 'content/listing.md',
    },
  },
  blocks: {
    card: {
      template: 'cardGrid',
      fields: {
        slug: { type: 'string', required: true },
        title: { type: 'string', required: true },
      },
      hasDetailPage: true,
      contentDir: 'content/listing',
      slugField: 'slug',
      route: '/listing/:slug',
      detailTemplate: 'standardDetail',
    },
  },
  templates: {
    cardGrid: 'templates/blocks/missing-card-grid.html',
    standardDetail: 'templates/details/standard-detail.html',
  },
};
