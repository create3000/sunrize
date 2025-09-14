const path = require ("path");

module.exports = {
  packagerConfig: {
    icon: "./src/assets/images/icon.png",
    dir: "./src",
    ignore: "^/(?!src|package\\.json|node_modules)",
    extendInfo: "./src/assets/Info.plist",
    osxSign: {
      optionsForFile: (filePath) => {
        // Here, we keep it simple and return a single entitlements.plist file.
        // You can use this callback to map different sets of entitlements
        // to specific files in your packaged app.
        return {
          entitlements: "src/assets/Entitlements.plist",
        };
      },
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: (arch) => ({
        loadingGif: "./src/assets/images/loading.gif",
        setupIcon: "./src/assets/images/icon.ico",
        iconUrl: "https://github.com/create3000/sunrize/raw/refs/heads/development/src/assets/images/icon.ico",
        certificateFile: "../ssl/certificate.pfx",
        certificatePassword: process .env .SUNRIZE_CERT_PASSWORD,
      }),
    },
    // {
    //   name: "@electron-forge/maker-dmg",
    //   platforms: ["darwin"],
    // },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "create3000",
          name: "sunrize"
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
};
