#!/usr/bin/env node
/* Compiles src/*.scss into dist/. For working on Nocturne itself: it needs the sass devDependency,
   so it is not shipped. Consumers rename the prefix of the compiled files with build.mjs instead.

     npm run build          → dist/nocturne.css, dist/nocturne.nofonts.css, dist/tokens.css
     npm run watch          → the same, again on every change under src/ */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as sass from 'sass';
import { root, banner, hoistRemoteImports, stripRemoteImports, SOURCE_PREFIX } from './build.mjs';

const ENTRIES = [['src/nocturne.scss', 'nocturne.css'], ['src/tokens.scss', 'tokens.css']];

/**
 * Compiles the entry stylesheets.
 *
 * @param {object}  [options]
 * @param {string}  [options.outDir]     Output folder (default: the package's dist/).
 * @param {boolean} [options.log=false]  Print one line per written file.
 * @returns {Promise<string[]>} Absolute paths of the files written.
 */
export async function compile({ outDir = resolve(root, 'dist'), log = false } = {}) {
  const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const written = [];
  const write = async (name, css) => {
    const file = join(outDir, name);
    const text = banner(name, version, SOURCE_PREFIX, SOURCE_PREFIX) + css;
    await writeFile(file, text);
    written.push(file);
    if (log) console.log(`${name}  ${(text.length / 1024).toFixed(1)} kB`);
  };

  await mkdir(outDir, { recursive: true });
  for (const [entry, name] of ENTRIES) {
    // No @charset: the comments' typography is non-ASCII, and the banner has to come first.
    const { css } = sass.compile(resolve(root, entry), { style: 'expanded', charset: false });
    const flat = hoistRemoteImports(css);
    await write(name, flat);
    // The same stylesheet without remote @imports (the Google Fonts request), for apps that
    // self-host Geist or run a strict CSP. --ntn-font-sans still names Geist.
    if (name === 'nocturne.css') await write('nocturne.nofonts.css', stripRemoteImports(flat));
  }
  return written;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const run = () => compile({ log: true }).catch((err) => { console.error(err.message); process.exitCode = 1; });
  await run();
  if (process.argv.includes('--watch')) {
    let timer;
    watch(resolve(root, 'src'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(run, 50); });
    console.log('Watching src/ …');
  }
}
