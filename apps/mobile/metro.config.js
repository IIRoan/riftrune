const { sep } = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
});

// Uniwind remaps `react-native` → `uniwind/components`, then that shim does
// `require('react-native')` for Platform/Dimensions/StyleSheet. Under Bun's
// isolated linker, Uniwind's "is this our own file?" check can miss because
// the same package lives in multiple `.bun/uniwind@…+hash/` folders. The remap
// then points at itself and iOS dies at startup with:
//   RangeError: Maximum call stack size exceeded (native stack depth)
const UNIWIND_PKG = `${sep}node_modules${sep}uniwind${sep}`;
const expoResolveRequest = config.resolver?.resolveRequest;
const uniwindResolveRequest = uniwindConfig.resolver.resolveRequest;

uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromUniwind = context.originModulePath.includes(UNIWIND_PKG);
  if (
    fromUniwind &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    const base = expoResolveRequest ?? context.resolveRequest;
    return base(context, moduleName, platform);
  }
  return uniwindResolveRequest(context, moduleName, platform);
};

module.exports = uniwindConfig;
