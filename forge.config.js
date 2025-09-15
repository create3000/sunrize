const path = require ("path");

module.exports = {
  packagerConfig: {
    icon: path .resolve (__dirname, "src", "assets", "images", "icon"),
    dir: "./src",
    ignore: "^/(?!src|package\\.json|node_modules)",
    // Windows
    win32metadata: {
      CompanyName: 'CREATE3000 and Contributors',
    },
    // Squirrel Legacy Cert Stuff
    // If not set or valid, there is no Setup.exe icon.
    certificateFile: "../ssl/certificate.pfx",
    certificatePassword: process .env .SUNRIZE_CERT_PASSWORD,
    // macOS
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
        authors: 'CREATE3000 and Contributors',
        loadingGif: "./src/assets/images/loading.gif",
        setupIcon: path .resolve (__dirname, "src", "assets", "images", "icon.ico"),
        iconUrl: "https://raw.githubusercontent.com/create3000/sunrize/refs/heads/development/src/assets/images/icon.ico",
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
