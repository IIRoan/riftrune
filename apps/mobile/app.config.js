const appJson = require('./app.json');

const variant = process.env.APP_VARIANT ?? 'production';
const isDev = variant === 'development';

const expo = appJson.expo;

module.exports = {
  expo: {
    ...expo,
    name: isDev ? 'Astral Grove Dev' : expo.name,
    scheme: isDev ? 'astral-grove-dev' : expo.scheme,
    ios: {
      ...expo.ios,
      bundleIdentifier: isDev
        ? `${expo.ios.bundleIdentifier}.dev`
        : expo.ios.bundleIdentifier,
    },
    android: {
      ...expo.android,
      package: isDev ? `${expo.android.package}.dev` : expo.android.package,
    },
    extra: {
      ...expo.extra,
      appVariant: variant,
    },
  },
};
