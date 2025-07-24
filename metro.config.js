const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add sql to asset extensions
config.resolver.assetExts.push('sql');
config.resolver.assetExts.push('db');

module.exports = config;
