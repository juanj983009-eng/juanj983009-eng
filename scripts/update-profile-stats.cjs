'use strict';
const fs = require('node:fs');
const path = require('node:path');

const owner = 'juanj983009-eng';
const escapeXml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));

async function loadRepositories() {
  const fixture = process.argv.indexOf('--fixture');
  if (fixture !== -1) return JSON.parse(fs.readFileSync(process.argv[fixture + 1], 'utf8'));
  const repositories = [];
  for (let page = 1; page <= 20; page++) {
    const url = `https://api.github.com/users/${owner}/repos?type=owner&per_page=100&page=${page}`;
    const headers = {'Accept':'application/vnd.github+json','User-Agent':'profile-stats-generator','X-GitHub-Api-Version':'2022-11-28'};
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(url, {headers});
    if (!response.ok) throw new Error(`GitHub API returned ${response.status} for page ${page}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected GitHub API response');
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
  throw new Error('Repository pagination limit reached');
}

function render(repositories, date) {
  const publicOwned = repositories.filter(r => r.private === false && r.fork === false);
  const stars = publicOwned.reduce((sum, r) => sum + (Number(r.stargazers_count) || 0), 0);
  const counts = new Map();
  for (const repo of publicOwned) if (typeof repo.language === 'string' && repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
  const ranked = [...counts].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
  const named = ranked.slice(0, 4);
  const other = ranked.slice(4).reduce((sum, entry) => sum + entry[1], 0);
  if (other) named.push(['Other', other]);
  const labeled = [...counts.values()].reduce((a,b) => a+b, 0);
  const rows = named.map(([language,count], index) => {
    const y = 108 + index * 34;
    const width = labeled ? Math.round(270 * count / labeled) : 0;
    return `<text x="485" y="${y}" font-family="Arial,sans-serif" font-size="16" fill="#F2E8D5">${escapeXml(language)}</text><rect x="610" y="${y-13}" width="270" height="12" rx="3" fill="#302822"/><rect x="610" y="${y-13}" width="${width}" height="12" rx="3" fill="#FF8A3D"/><text x="885" y="${y}" text-anchor="end" font-family="Consolas,monospace" font-size="14" fill="#FFFFFF">${count}</text>`;
  }).join('');
  const empty = ranked.length ? '' : '<text x="485" y="112" font-family="Arial,sans-serif" font-size="16" fill="#F2E8D5">No language data available</text>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="330" viewBox="0 0 920 330" role="img" aria-labelledby="title desc"><title id="title">GitHub public repository snapshot</title><desc id="desc">${publicOwned.length} public non-fork repositories, ${stars} stars, and primary-language counts for ${labeled} repositories. Snapshot date ${escapeXml(date)}.</desc><rect width="920" height="330" fill="#101010"/><rect x="1" y="1" width="918" height="328" fill="none" stroke="#40352F"/><rect x="1" y="1" width="918" height="42" fill="#171717"/><circle cx="22" cy="22" r="4" fill="#FF5A1F"/><circle cx="38" cy="22" r="4" fill="#70645C"/><circle cx="54" cy="22" r="4" fill="#40352F"/><text x="78" y="28" font-family="Consolas,monospace" font-size="15" fill="#CFC5B7">github / public-repository-snapshot</text><path d="M455 65V268" stroke="#40352F"/><text x="30" y="82" font-family="Consolas,monospace" font-size="15" fill="#FF8A3D">PUBLIC REPOSITORIES</text><text x="30" y="137" font-family="Arial,sans-serif" font-weight="700" font-size="49" fill="#FFFFFF">${publicOwned.length}</text><text x="30" y="168" font-family="Arial,sans-serif" font-size="16" fill="#F2E8D5">Owned repositories · excluding forks</text><text x="30" y="208" font-family="Consolas,monospace" font-size="15" fill="#FF8A3D">STARS RECEIVED</text><text x="30" y="246" font-family="Arial,sans-serif" font-weight="700" font-size="31" fill="#FFFFFF">${stars}</text><text x="485" y="82" font-family="Consolas,monospace" font-size="15" fill="#FF8A3D">PRIMARY LANGUAGE BY REPOSITORY</text>${rows}${empty}<path d="M30 278H890" stroke="#40352F"/><text x="30" y="306" font-family="Consolas,monospace" font-size="13" fill="#CFC5B7">${labeled} repos with a language · not a skill score · ${escapeXml(date)} UTC</text></svg>\n`;
}

(async () => {
  const repositories = await loadRepositories();
  const svg = render(repositories, new Date().toISOString().slice(0,10));
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'github-public-stats.svg'), svg, 'utf8');
  console.log(`Rendered statistics from ${repositories.filter(r => r.private === false && r.fork === false).length} public non-fork repositories`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
