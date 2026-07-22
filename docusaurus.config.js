// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

const siteUrl = process.env.SITE_URL || 'https://endusers.cncf.io';
const baseUrl = process.env.BASE_URL || '/';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CNCF End User Community',
  tagline: 'The community for Cloud Native End Users',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: siteUrl,
  baseUrl,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    path: 'i18n',
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
        calendar: 'gregory',
        path: 'en',
      }
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // Serve the docs at the site's root
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/castrojo/endusers/tree/main',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/castrojo/endusers/tree/main/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      navbar: {
        title: '',
        logo: {
          alt: 'Cloud Native End Users',
          src: 'img/cloud-native-end-users.svg',
          srcDark: 'img/cloud-native-end-users-dark.svg',
        },
        items: [
          // Left
          {
            to: '/',
            label: 'Practitioners',
            position: 'left',
            activeBaseRegex: '^/$',
          },
          {
            type: 'docSidebar',
            sidebarId: 'architecturesSidebar',
            position: 'left',
            label: 'Architectures',
          },
          {
            type: 'docSidebar',
            sidebarId: 'communitySidebar',
            position: 'left',
            label: 'Community',
          },
          {
            to: '/awards/',
            label: 'Awards',
            position: 'left',
          },

          // Right
          {
            to: '/metrics/',
            label: 'Metrics',
            position: 'right',
          },
          {
            to: '/events/',
            label: 'Events',
            position: 'right',
          },
          { to: '/blog', label: 'Blog', position: 'right' },
        ],
      },
      footer: {
        // The rendered footer is the swizzled component in src/theme/Footer.
        style: 'dark',
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  plugins: [require.resolve('docusaurus-plugin-search-local')],
};

export default config;
