module.exports = {
  pages: {
    home: {
      route: '/',
      source: 'content/home.md',
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
      detailTemplate: 'missingDetailTemplateKey',
    },
  },
  templates: {
    cardGrid: 'templates/blocks/card-grid.html',
  },
};
