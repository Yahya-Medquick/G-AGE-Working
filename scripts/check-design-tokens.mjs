import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = path.join(root, 'src/styles/tokens.css');
const tokenCss = fs.readFileSync(tokenPath, 'utf8');
const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;

function findStyleFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findStyleFiles(entryPath);
    if (entryPath === tokenPath) return [];
    if (entry.name.endsWith('.css')) return [entryPath];
    if (entryPath.includes(`${path.sep}components${path.sep}ui${path.sep}`) && /\.(ts|tsx)$/.test(entry.name)) return [entryPath];
    return [];
  });
}

function findHexMatches(filePath, source) {
  return [...source.matchAll(hexPattern)].map((match) => {
    const line = source.slice(0, match.index).split('\n').length;
    return `${path.relative(root, filePath)}:${line} ${match[0]}`;
  });
}

function readToken(block, token) {
  const match = block.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{3,8})`, 'i'));
  if (!match) throw new Error(`Design token --${token} is missing a concrete color.`);
  return match[1];
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const channels = value.length === 3
    ? [...value].map((channel) => parseInt(channel + channel, 16))
    : [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function validateTheme(theme, name) {
  const pairs = [
    ['text', 'bg'],
    ['text-2', 'bg'],
    ['accent-text', 'bg'],
    ['on-accent', 'accent'],
    ['tint-equation-text', 'tint-equation'],
    ['tint-examtip-text', 'tint-examtip'],
  ];
  const failures = pairs
    .map(([foreground, background]) => {
      const ratio = contrast(readToken(theme, foreground), readToken(theme, background));
      return ratio < 4.5 ? `${name}: --${foreground} on --${background} is ${ratio.toFixed(2)}:1` : null;
    })
    .filter(Boolean);
  if (failures.length) throw new Error(failures.join('\n'));
}

const styleFiles = findStyleFiles(path.join(root, 'src'));
const colorFindings = styleFiles.flatMap((filePath) => findHexMatches(filePath, fs.readFileSync(filePath, 'utf8')));
if (colorFindings.length) {
  console.error(`Raw hex colors must live in ${path.relative(root, tokenPath)}:\n${colorFindings.join('\n')}`);
  process.exitCode = 1;
} else {
  const lightTheme = tokenCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];
  const darkTheme = tokenCss.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!lightTheme || !darkTheme) throw new Error('Both light and dark design token blocks are required.');
  validateTheme(lightTheme, 'light');
  validateTheme(darkTheme, 'dark');
  console.log('Design token sources contain no raw hex outside tokens.css; required text pairs meet WCAG AA.');
}
