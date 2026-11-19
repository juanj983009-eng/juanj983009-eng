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
  const colors = ['#ff8a3d','#f6b369','#efc780','#b77c63','#8c9aab'];
  let offset = 0;
  const segments = named.map(([,count], i) => {
    const width = labeled ? count / labeled * 380 : 0;
    const part = `<rect x="${(507+offset).toFixed(2)}" y="123" width="${width.toFixed(2)}" height="15" fill="${colors[i]}"/>`;
    offset += width;
    return part;
  }).join('');
  const legend = named.map(([language,count], i) => {
    const x = i % 2 ? 710 : 507;
    const y = 173 + Math.floor(i / 2) * 34;
    const label = language.length > 17 ? language.slice(0, 16) + '…' : language;
    return `<circle cx="${x+5}" cy="${y-5}" r="5" fill="${colors[i]}"/><text x="${x+19}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#f2e8d5">${escapeXml(label)}</text><text x="${x+180}" y="${y}" text-anchor="end" font-family="Consolas,monospace" font-size="14" fill="#fff">${count}</text>`;
  }).join('');
  const empty = ranked.length ? '' : '<text x="507" y="180" font-family="Arial,sans-serif" font-size="15" fill="#f2e8d5">No language data available</text>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="350" viewBox="0 0 960 350" role="img" aria-labelledby="title desc">
<title id="title">GitHub public repository snapshot</title><desc id="desc">${publicOwned.length} public non-fork repositories, ${stars} stars, and primary-language counts for ${labeled} repositories. Snapshot date ${escapeXml(date)}.</desc>
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#181a1c"/><stop offset="1" stop-color="#0c0f12"/></linearGradient><clipPath id="bar"><rect x="507" y="123" width="380" height="15" rx="7"/></clipPath></defs>
<rect x="1" y="1" width="958" height="348" rx="12" fill="url(#bg)" stroke="#503a2d" stroke-width="2"/><path d="M1 44H959" stroke="#3a2f29"/>
<circle cx="24" cy="22" r="5" fill="#ff5a1f"/><circle cx="41" cy="22" r="5" fill="#ffaa71"/><circle cx="58" cy="22" r="5" fill="#72645c"/><text x="80" y="27" font-family="Consolas,monospace" font-size="13" fill="#dccdbd">github / public-repository-snapshot</text><text x="933" y="27" text-anchor="end" font-family="Consolas,monospace" font-size="11" fill="#b5a699">PUBLIC DATA</text>
<rect x="20" y="60" width="453" height="226" rx="8" fill="#111419" stroke="#3d302a"/><text x="39" y="84" font-family="Consolas,monospace" font-size="11" fill="#ff9d6c">01 / REPOSITORY OVERVIEW</text><path d="M38 94H455" stroke="#302a26"/>
<rect x="38" y="111" width="195" height="119" rx="7" fill="#1b1b1d" stroke="#44332b"/><text x="54" y="133" font-family="Consolas,monospace" font-size="11" fill="#f2bc98">PUBLIC REPOS</text><text x="54" y="182" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="42" fill="#fff">${publicOwned.length}</text><text x="54" y="211" font-family="Arial,sans-serif" font-size="13" fill="#cdbdb0">Owned · no forks</text>
<rect x="245" y="111" width="210" height="119" rx="7" fill="#1b1b1d" stroke="#44332b"/><text x="261" y="133" font-family="Consolas,monospace" font-size="11" fill="#f2bc98">STARS RECEIVED</text><text x="261" y="182" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="42" fill="#fff">${stars}</text><text x="261" y="211" font-family="Arial,sans-serif" font-size="13" fill="#cdbdb0">Across public repos</text>
<circle cx="44" cy="258" r="4" fill="#ff8a3d"><animate attributeName="opacity" values="1;.3;1" dur="4s" repeatCount="indefinite"/></circle><text x="57" y="262" font-family="Consolas,monospace" font-size="11" fill="#c8b7a8">Snapshot / ${escapeXml(date)} UTC</text>
<rect x="489" y="60" width="451" height="226" rx="8" fill="#111419" stroke="#3d302a"/><text x="507" y="84" font-family="Consolas,monospace" font-size="11" fill="#ff9d6c">02 / PRIMARY LANGUAGE BY REPOSITORY</text><path d="M507 94H922" stroke="#302a26"/>
<rect x="507" y="123" width="380" height="15" rx="7" fill="#302a26"/><g clip-path="url(#bar)">${segments}</g>${legend}${empty}
<path d="M20 307H940" stroke="#342b27"/><text x="29" y="331" font-family="Consolas,monospace" font-size="12" fill="#d8c8b7">${labeled} repos with a language · counts, not skill scores</text><text x="930" y="331" text-anchor="end" font-family="Consolas,monospace" font-size="10" fill="#a99a8d">UPDATED WEEKLY</text>
</svg>\n`;
}

(async () => {
  const repositories = await loadRepositories();
  const svg = render(repositories, new Date().toISOString().slice(0,10));
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'github-public-stats.svg'), svg, 'utf8');
  console.log(`Rendered statistics from ${repositories.filter(r => r.private === false && r.fork === false).length} public non-fork repositories`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
