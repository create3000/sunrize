const path = require("path");
const pkginfo = require("./package.json");

/** Path to icon files without extension */
const iconPath = path.resolve(__dirname, "src", "assets", "images", "icon");
const iconPng = `${iconPath}.png`;
const iconSvg = `${iconPath}.svg`;

/**
 * As most makers use common structures for many options,
 * these are shared opts you might use freely across makers.
 */
const linuxOptions = {
  /**
   * Note: this has extension in contrast to packagerConfig.
   *
   * FreeDesktop also supports scalable (vector) icons properly.
   *
   * This uses, undocumented in official makers and documented
   * in ReForged, object registry of icon sizes mapping to
   * icon file.
   *
   * https://spacingbat3.github.io/ReForged/interfaces/_reforged_maker-appimage.MakerAppImageConfig.html
   */
  version: pkginfo .version,
  description: pkginfo .description,
  maintainer: pkginfo .author,
  homepage: pkginfo .homepage,
  icon: {
    "96x96": iconSvg,
    "256x256": iconPng,
    "scalable": iconSvg,
  },
  mimeType: [
    "model/x3d+xml",
    "model/x3d+vrml",
    "model/x3d+json",
    "model/vrml",
    "x-world/x-vrml",
    "model/gltf+json",
    "model/vrm",
    "model/obj",
    "model/stl",
    "model/ply",
    "model/sog",
    "model/spz",
    "model/off",
    "image/svg+xml",
  ],
  categories: [
    "Development",
    "Graphics",
    "Science",
  ],
};

module.exports = {
  packagerConfig: {
    // On Linux, it is preferred to be a `name` than
    // `productName` (to make it easier to type in
    // terminals), Windows "maybe" it is beneficial
    // (you might always add it to %PATH% + it is
    // not a name of shortcut that is visible to end
    // users), macOS does not care according to docs
    // (as it is not name of .app).
    //
    // Also docs lie this is `name`, it is `productName`
    // actually if defined. In the past (I need to
    // verify) it was common cause why makers either
    // built non-working packages or failed to package
    // altogether. ReForged is smarter and errors out
    // with a long message so you are aware you need to
    // modify it. Alternatively, `config.options.bin`
    // can be set to `productName` which will make it
    // considerably harder to type in terminals due to
    // spaces in name and slightly due to uppercase
    // letters.
    executableName: pkginfo.name,
    icon: iconPath,
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
      optionsForFile: (/* filePath */) => {
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
      config: (/* arch */) => ({
        authors: 'CREATE3000 and Contributors',
        loadingGif: "./src/assets/images/loading.gif",
        setupIcon: `${iconPath}.ico`,
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
      config: { options: linuxOptions },
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
      config: { options: linuxOptions },
    },
    {
      name: "@reforged/maker-appimage",
      platforms: ["linux"],
      config: { options: linuxOptions },
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
