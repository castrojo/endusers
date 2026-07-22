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
  title: 'Endusers',
  tagline: 'The community for Cloud Native End Users',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: siteUrl,
  baseUrl,

  // onBrokenLinks: 'throw',
  onBrokenLinks: 'warn',
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
      // Replace with your project's social card
      image: 'img/cloud-native-contributors.jpg',
      announcementBar: {
        id: `hello-bar`,
        content: `🎉️ Meet us in Atlanta for KubeCon + CloudNativeCon North America · Nov 10-13 ·<b><a target="_blank" href="https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/register/?utm_source=contribute-cncf-io&utm_medium=subpage&utm_campaign=10608228-KubeCon-NA-2025&utm_content=hello-bar">Register Today!</b> 🥳️`,
        backgroundColor: 'rgb(1, 117, 228)', // Defaults to `#fff`
        textColor: '#fff', // Defaults to `#000`
      },
      navbar: {
        title: '',
        logo: {
          alt: 'Cloud Native Endusers',
          src: 'img/cloud-native-end-users.svg',
          srcDark: 'img/cloud-native-end-users-dark.svg',
        },
        items: [
          // Left
          {
            type: 'docSidebar',
            sidebarId: 'practitionersSidebar',
            position: 'left',
            label: 'Practitioners',
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

          // Right
          {
            type: 'docSidebar',
            sidebarId: 'metricsSidebar',
            position: 'right',
            label: 'Metrics',
          },
          {
            type: 'docSidebar',
            sidebarId: 'eventsSidebar',
            position: 'right',
            label: 'Events',
          },
          { to: '/blog', label: 'Blog', position: 'right' },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      footer: {
        logo: {
          alt: 'CNCF Logo',
          src: 'img/cncf_logo_white.svg',
          href: 'https://www.cncf.io/',
          width: 160,
        },
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Practitioners',
                to: '/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/docusaurus',
              },
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/docusaurus',
              },
              {
                label: 'X',
                href: 'https://x.com/docusaurus',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/castrojo/endusers',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} The CNCF Authors.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  plugins: [require.resolve('docusaurus-plugin-search-local')],
};

export default config;
