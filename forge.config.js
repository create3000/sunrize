module.exports = {
   "packagerConfig": {
     "icon": "./src/assets/images/icon.png",
     "dir": "./src",
     "ignore": "^/(?!src|package\\.json|node_modules)",
     "certificateFile": "./build/certificate.pfx",
     "certificatePassword": "CREATE3000",
     "extendInfo": "./src/assets/Info.plist",
     "osxSign": {
         "optionsForFile": (filePath) => {
         // Here, we keep it simple and return a single entitlements.plist file.
         // You can use this callback to map different sets of entitlements
         // to specific files in your packaged app.
         return {
           entitlements: "src/assets/entitlements.plist"
         };
       }
     }
   },
   "makers": [
     {
       "name": "@electron-forge/maker-squirrel"
     },
     {
       "name": "@electron-forge/maker-dmg"
     },
     {
       "name": "@electron-forge/maker-deb"
     },
     {
       "name": "@electron-forge/maker-rpm"
     }
   ],
   "publishers": [
     {
       "name": "@electron-forge/publisher-github",
       "config": {
         "repository": {
           "owner": "create3000",
           "name": "sunrize"
         },
         "prerelease": false,
         "draft": false
       }
     }
   ]
 };
