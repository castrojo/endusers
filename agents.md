# Agent Entry Point: CNCF Endusers Repository

This repository hosts documentation for CNCF End Users. It is a Docusaurus-based site serving practitioners, architects, and community members.

## 🧭 Navigation

- **Core Documentation**: `/docs/`
- **Blog**: `/blog/`
- **Static Assets**: `/static/`
- **Components/UI**: `/src/`

## 🛠 Skills & Capabilities

This repository defines specific skills for AI agents to follow when contributing or managing documentation.

- [Skill Manifest](docs/skills/manifest.md) - Index of all available agent skills.

## 🏗 Build & Test

- **Install**: `npm install`
- **Start Dev Server**: `npm run docus:start`
- **Build**: `npm run build`

## 🛡 Guidelines for Agents

- **Documentation Standards**: Follow GFM (GitHub Flavored Markdown).
- **No Client Secrets**: Never include proprietary or client-specific framing.
- **Lazy Loading**: Use the `docs/skills/` manifest to discover detailed instructions for specific tasks (e.g., blog posts, documentation updates).
- **Structure**: Maintain Docusaurus file layout and sidebar configurations (`sidebars.js`).
