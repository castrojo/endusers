#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const output = join(root, 'data/community-people.json');

const people = {
  tab: [
    ['Ricardo Rocha', 'CERN', 'TAB Chair', 'rochaporto', 'ricardo-rocha-739aa718', 'ahcorporto'],
    ['Joseph Sandoval', 'Adobe Inc', 'TAB Vice Chair', 'jrsapi', 'josephrsandoval'],
    ['Ahmed Bebars', 'The New York Times', null, 'abebars'],
    ['Alolita Sharma', 'Apple', null, 'alolita'],
    ['Ben Somogyi', 'Lockheed Martin', null, 'bsomogyi'],
    ['Chad Beaudin', 'Boeing', null, 'chadbeaudin'],
    ['Katie Gamanji', 'Apple', null, 'kgamanji', 'katie-gamanji', 'k_gamanji'],
    ['Kenta Tada', 'Toyota', null, 'KentaTada'],
    ['Michael Amundson', 'CVS Health', null, null, 'michaelamundson'],
    ['Mike Bowen', 'BlackRock', null, 'michael-bowen-sc'],
    ['Xu Wang', 'Ant Group', null, 'gnawux', 'gnawux', 'gnawux']
  ],
  staff: [
    ['Jorge O. Castro', 'CNCF', 'Developer Relations', 'castrojo', 'jorgecastro'],
    ['Joanna Lee', 'CNCF', 'VP of Strategic Programs and Legal', 'joannalee333', 'joanna-lee-9630935'],
    ['Bob Killen', 'CNCF', 'Senior Technical Program Manager', 'mrbobbytables', 'mrbobbytables'],
    ['Taylor Waggoner', 'CNCF', 'Program Manager', 'taylorwaggoner', 'taylor-waggoner'],
    ['Wendi West', 'CNCF', 'Event Manager', null, 'wendi-west']
  ]
};

const fallbackImages = {
  'Michael Amundson': 'https://raw.githubusercontent.com/cncf/people/main/images/michael-amundson-headshot.jpg',
  'Wendi West': 'https://raw.githubusercontent.com/cncf/people/main/images/wendi-west.jpg'
};
const existing = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : {};
const result = {};
let failures = 0;

for (const [section, entries] of Object.entries(people)) {
  result[section] = [];
  for (const [name, company, role, github, linkedin, twitter] of entries) {
    const previous = existing[section]?.find((person) => person.github === github && github) ?? {};
    let profile = {};
    if (github) {
      try {
        const response = await fetch(`https://api.github.com/users/${github}`, {
          headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'cncf-endusers-site-build' }
        });
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        profile = await response.json();
      } catch (error) {
        failures += 1;
        console.warn(`Could not refresh ${name}: ${error.message}`);
      }
    }
    result[section].push({
      name: profile.name || previous.name || name,
      company: cleanCompany(profile.company) || previous.company || company,
      role: role || previous.role || null,
      bio: profile.bio || previous.bio || '',
      location: profile.location || previous.location || '',
      image: profile.avatar_url || previous.image || fallbackImages[name] || (github ? `https://github.com/${github}.png` : ''),
      github,
      linkedin: linkedin || previous.linkedin || null,
      twitter: twitter || previous.twitter || null,
      blog: profile.blog || previous.blog || '',
      publicRepos: profile.public_repos ?? previous.publicRepos ?? 0,
      followers: profile.followers ?? previous.followers ?? 0,
      profileUpdatedAt: profile.updated_at || previous.profileUpdatedAt || null
    });
  }
}

mkdirSync(join(root, 'data'), { recursive: true });
writeFileSync(output, JSON.stringify({ fetchedAt: new Date().toISOString(), people: result }, null, 2) + '\n');
console.log(`Refreshed ${Object.values(result).flat().length} community profiles${failures ? ` (${failures} fallback${failures === 1 ? '' : 's'})` : ''}`);

function cleanCompany(value) {
  return value?.replace(/^@/, '').trim() || '';
}
