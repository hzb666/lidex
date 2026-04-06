module.exports = {
  site: {
    // Shared product name used across the shell and example pages.
    siteName: 'Lydex',
    // Short subtitle shown next to the brand in the example navigation.
    siteSubtitle: 'Declarative Markdown Site Engine',
    // Footer copy rendered at the bottom of every example page.
    footerText: '© 2026 Lydex · Declarative Markdown Site Engine',
  },
  theme: {
    // Local theme directory that provides the example CSS, JS, and favicon assets.
    directory: 'assets/public',
  },
  pages: {
    home: {
      // Public route for the tutorial homepage.
      route: '/',
      // Markdown source file for the homepage body and frontmatter.
      source: 'content/home.md',
    },
    concepts: {
      // Public route for the concepts page.
      route: '/concepts',
      // Markdown source file for the concepts page.
      source: 'content/concepts.md',
    },
    design: {
      // Public route for the design walkthrough page.
      route: '/design',
      // Markdown source file for the design page.
      source: 'content/design.md',
    },
    blocks: {
      // Public route for the block examples page.
      route: '/blocks',
      // Markdown source file for the block examples page.
      source: 'content/blocks.md',
    },
    details: {
      // Public route for the detail-page explanation page.
      route: '/details',
      // Markdown source file for the detail-page explanation page.
      source: 'content/details.md',
    },
    news: {
      // Public route for the query and news examples page.
      route: '/queries',
      // Markdown source file for the query and news examples page.
      source: 'content/news.md',
    },
    theme: {
      // Public route for the theme and styling page.
      route: '/theme',
      // Markdown source file for the theme page.
      source: 'content/theme.md',
    },
  },
  blocks: {
    feature: {
      // Template key used to render each feature card on a page.
      template: 'featureCard',
      fields: {
        title: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every feature block.
          required: true,
        },
        kicker: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every feature block.
          required: true,
        },
        summary: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every feature block.
          required: true,
        },
      },
      // Whether this block type renders dedicated detail pages.
      hasDetailPage: true,
      // Whether detail routes for this block participate in previous/next pagination.
      enablePagination: true,
      // Directory that stores the detail Markdown files for this block type.
      contentDir: 'content/features',
      // Reserved field used to hold the managed route slug.
      slugField: '_slug_',
      // Source field used to derive the slug when `_slug_` is omitted.
      slugSourceField: 'title',
      // Detail route pattern for this block type.
      route: '/blocks/:slug',
      // Template key used to render each feature detail page.
      detailTemplate: 'featureDetail',
    },
    news: {
      // Template key used to render each news card on a page.
      template: 'newsCard',
      fields: {
        title: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every news block.
          required: true,
        },
        publishedAt: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every news block.
          required: true,
        },
        category: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every news block.
          required: true,
        },
        summary: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every news block.
          required: true,
        },
      },
      // Whether this block type renders dedicated detail pages.
      hasDetailPage: true,
      // Whether detail routes for this block participate in previous/next pagination.
      enablePagination: true,
      // Directory that stores the detail Markdown files for this block type.
      contentDir: 'content/news',
      // Reserved field used to hold the managed route slug.
      slugField: '_slug_',
      // Source field used to derive the slug when `_slug_` is omitted.
      slugSourceField: 'title',
      // Detail route pattern for this block type.
      route: '/queries/:slug',
      // Template key used to render each news detail page.
      detailTemplate: 'newsDetail',
    },
    pub: {
      // Template key used to render each publication card.
      template: 'publicationCard',
      fields: {
        title: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        journal: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        year: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        authors: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        summary: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        photo: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
        link: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every publication block.
          required: true,
        },
      },
    },
    photo: {
      // Template key used to render each gallery photo card.
      template: 'photoCard',
      fields: {
        title: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every photo block.
          required: true,
        },
        caption: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every photo block.
          required: true,
        },
        photo: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every photo block.
          required: true,
        },
        date: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every photo block.
          required: true,
        },
      },
    },
    accordionItem: {
      // Template key used to render each accordion item on a page.
      template: 'accordionItem',
      fields: {
        title: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every accordion item.
          required: true,
        },
        summary: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every accordion item.
          required: true,
        },
        body: {
          // Primitive type expected from Markdown block declarations.
          type: 'string',
          // Whether this field must be present in every accordion item.
          required: true,
        },
      },
    },
  },
  templates: {
    // Shared page shell that wraps all rendered example content.
    pageShell: 'templates/page-shell.html',
    // Block template for feature cards.
    featureCard: 'templates/blocks/feature-card.html',
    // Block template for news cards.
    newsCard: 'templates/blocks/news-card.html',
    // Block template for publication cards.
    publicationCard: 'templates/blocks/publication-card.html',
    // Block template for photo cards.
    photoCard: 'templates/blocks/photo-card.html',
    // Block template for accordion items.
    accordionItem: 'templates/blocks/accordion-item.html',
    // Detail template for feature pages.
    featureDetail: 'templates/details/feature-detail.html',
    // Detail template for news pages.
    newsDetail: 'templates/details/news-detail.html',
  },
  queryTemplates: {
    // Query template used by the homepage latest-news example.
    latestNews: 'templates/query/latest-news.html',
  },
};
