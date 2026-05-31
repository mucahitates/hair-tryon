// Metro bundler yapılandırması
// Firebase'in CommonJS modüllerini çözümlemek için gerekli
// unstable_enablePackageExports false olmazsa Firebase Hermes'te çalışmaz

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase .cjs uzantılı dosyaları tanısın diye
config.resolver.sourceExts.push('cjs');

// Firebase modül çözümlemesinde hata çıkarır, kapatıyoruz
config.resolver.unstable_enablePackageExports = false;

module.exports = config;