const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    // asar: true,
    icon: "./src/assets/images/icon.png",
    dir: "./src",
    ignore: "^/(?!src|package\\.json|node_modules)",
    certificateFile: "../ssl/certificate.pfx",
    certificatePassword: process .env .SUNRIZE_CERT_PASSWORD,
    extendInfo: "./src/assets/Info.plist",
    // osxSign: {
    //   optionsForFile: (filePath) => {
    //     // Here, we keep it simple and return a single entitlements.plist file.
    //     // You can use this callback to map different sets of entitlements
    //     // to specific files in your packaged app.
    //     return {
    //       entitlements: "src/assets/Entitlements.plist"
    //     };
    //   },
    // },
  },
  rebuildConfig: { },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: { },
    },
    // {
    //   name: "@electron-forge/maker-dmg",
    // },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: { },
    },
    {
      name: "@electron-forge/maker-deb",
      config: { },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: { },
    }
  ],
  plugins: [
    // {
    //   name: '@electron-forge/plugin-auto-unpack-natives',
    //   config: {},
    // },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      // [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      // [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "create3000",
          name: "sunrize",
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
};
