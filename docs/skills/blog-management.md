# Skill: Blog Management

Workflow for publishing posts on the CNCF End User Community blog.

## Creating a post

- File name: `blog/YYYY-MM-DD-slug.md`. The date prefix sets the publish date.
- Front matter: `slug`, `title`, `authors` (keys from `blog/authors.yml`), and `tags`
  (keys from `blog/tags.yml`). Do not invent authors or tags inline; add them to the
  YAML files first.
- Place `<!-- truncate -->` after the opening paragraphs to control the feed excerpt.
- Voice: warm, credible, aligned with CNCF's public voice. No emojis.
- Audience: end users. Frame stories around production experience and community
  participation, not project contribution mechanics.

## Validation

- `npm run build` must pass; broken links fail the build.
- Verify every external link and factual claim (award winners, counts, dates) against
  an authoritative source before publishing.

## Submissions

Community submissions arrive through the blog post issue template
(`.github/ISSUE_TEMPLATE/blog-post.yml`). The author dropdown there must stay in sync
with `blog/authors.yml`.
