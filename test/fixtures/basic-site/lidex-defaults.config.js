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
};
