#!/usr/bin/env node
// Copies the engine into a website, as plain ES modules.
//
//   node scripts/vendor.js <destination folder>
//
// A site then imports from "<destination>/index.js". This is a stopgap until
// `figurant build` produces a single minified file.

import { cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { replaceableSync } from '../cli/replace.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination) {
    console.error('Usage: node scripts/vendor.js <destination folder>');
    process.exit(1);
}
const target = resolve(destination);
try { replaceableSync(target); } catch (error) { console.error(error.message); process.exit(1); }
rmSync(target, { recursive: true, force: true });
cpSync(resolve(root, 'src'), target, { recursive: true });
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
writeFileSync(resolve(target, 'VERSION'), `figurant ${version}\nCopied from the Figurant repository. Do not edit here: change the source and copy again.\n`);
console.log(`Figurant ${version} copied to ${target}`);
