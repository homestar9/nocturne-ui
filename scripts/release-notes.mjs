#!/usr/bin/env node
/* Prints the GitHub release notes for one version: an install line, then that version's section of
   CHANGELOG.md (its "## X.Y.Z — date" heading left out). The publish workflow pipes it into
   `gh release create`; scripts/test.mjs checks the current version has a section.

     node scripts/release-notes.mjs 1.13.0 > notes.md */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The body of a version's CHANGELOG section, or null when the version has none. */
export async function changelogSection(version) {
  const text = (await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')).replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${version} `) || l === `## ${version}`);
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  const body = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
  return body || null;
}

export async function releaseNotes(version) {
  const section = await changelogSection(version);
  if (!section) throw new Error(`CHANGELOG.md has no section for ${version}`);
  return `\`\`\`sh\nnpm install @homestar9/nocturne-ui@${version}\n\`\`\`\n\n${section}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node scripts/release-notes.mjs <version>');
    process.exitCode = 1;
  } else {
    try { process.stdout.write(await releaseNotes(version)); }
    catch (err) { console.error(err.message); process.exitCode = 1; }
  }
}
