module.exports = {
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
    },
  },
  blocks: {
    card: {
      template: 'missingTemplateKey',
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
    standardDetail: 'templates/details/standard-detail.html',
  },
};
