const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add db and sql extensions to the assetExts
config.resolver.assetExts.push('db', 'sql');

module.exports = config;
