// Metro needs to be told that `.mjs` is source, because the engine ships as ES modules
// with explicit extensions (`src/engine/*.mjs`) and the default source list does not
// include it.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
if (!config.resolver.sourceExts.includes('mjs')) config.resolver.sourceExts.push('mjs');

module.exports = config;
