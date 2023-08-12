"use strict"

const
   electron     = require ("electron"),
   prompt       = require ("electron-prompt"),
   url          = require ("url"),
   path         = require ("path"),
   fs           = require ("fs"),
   util         = require ("util"),
   Template     = require ("./Template"),
   LocalStorage = require ("node-localstorage") .LocalStorage,
   DataStorage  = require ("../Application/DataStorage"),
   _            = require ("../Application/GetText")

// Use electron@15.3

const localStorage = new LocalStorage (path .join (electron .app .getPath ("userData"), "Global Storage"))

module .exports = class Application
{
   config = new DataStorage (localStorage, "Sunrize.Application.")
   mainMenu = [ ]
   openURLValue = ""
   exportPath = new Map ()

   static run ()
   {
      if (electron .app .requestSingleInstanceLock ())
         new this ()
      else
         electron .app .quit ()
   }

   constructor ()
   {
      if (process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT")
         process .env .ELECTRON_ENABLE_LOGGING = 1

      process .env .ELECTRON_DISABLE_SECURITY_WARNINGS = "true"

      this .menuOptions = {
         defaultEditMenu: false,
         undoLabel: _ ("Undo"),
         redoLabel: _ ("Redo"),
      }

      this .config .addDefaultValues ({
         position: [undefined, undefined],
         size: [1100, 680],
         maximized: false,
         fullscreen: false,
         autoSave: false,
         expandExternProtoDeclarations: true,
         expandPrototypeInstances: true,
         expandInlineNodes: true,
         primitiveQuality: "MEDIUM",
         textureQuality: "MEDIUM",
         rubberband: true,
         timings: false,
      })

      Template .create (path .join (__dirname, "../../html/application-template.html"))
      Template .create (path .join (__dirname, "../../html/document-template.html"))
      Template .create (path .join (__dirname, "../../themes/default-template.css"))
      Template .create (path .join (__dirname, "../../themes/prompt-template.css"))

      this .setup ()
   }

   async setup ()
   {

      await electron .app .whenReady ()

      electron .app .on ("activate",           (event)           => this .activate ())
      electron .app .on ("new-window-for-tab", (event)           => this .createWindow ())
      electron .app .on ("open-file",          (event, filePath) => this .openFiles ([url .pathToFileURL (filePath) .href]))
      electron .app .on ("window-all-closed",  (event)           => this .quit ())

      electron .ipcMain .on ("title",        (event, title)       => this .title = title)
      electron .ipcMain .on ("current-file", (event, currentFile) => this .currentFile = currentFile)
      electron .ipcMain .on ("save-file",    (event, filePath)    => this .saveFile (filePath))
      electron .ipcMain .on ("change-menu",  (event, object)      => this .updateMenu (object))
      electron .ipcMain .on ("context-menu", (event, id, menu)    => this .contextMenu (id, menu))

      electron .ipcMain .handle ("file-path", async (event, basename) => await this .showSaveDialog (basename))
      electron .ipcMain .handle ("fullname", async () => this .fullname)

      this .fullname = await require ("fullname") ()

      await this .updateMenu ()
      await this .createWindow ()

      this .openFiles (process .argv .slice (2) .map (filePath => url .pathToFileURL (filePath) .href))

      electron .app .on ("second-instance", (event, argv, cwd) =>
      {
         this .openFiles (argv .slice (1) .filter (filePath => fs .existsSync (filePath) && fs .lstatSync (filePath) .isFile ()) .map (filePath => url .pathToFileURL (filePath) .href))

         this .mainWindow .show ()
      })
   }

   get applicationShouldQuitAfterLastWindowClosed ()
   {
      return true || process .platform !== "darwin" || process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT"
   }

   get title ()
   {
      return this .mainWindow .title
   }

   set title (title)
   {
      this .mainWindow .title = `${title} · Sunrize`
   }

   pushMenu (menu)
   {
      this .mainMenu .push (menu)
      electron .Menu .setApplicationMenu (menu)
   }

   popMenu ()
   {
      this .mainMenu .pop ()
      electron .Menu .setApplicationMenu (this .mainMenu .at (-1))
   }

   updateMenu (object = { })
   {
      Object .assign (this .menuOptions, object)

      const exportPath = this .exportPath .get (this .currentFile)

      const menu = electron .Menu .buildFromTemplate ([
         {
            role: "appMenu",
            label: "Sunrize",
         },
         {
            role: "fileMenu",
            submenu: [
               {
                  label: _ ("New File"),
                  accelerator: "CmdOrCtrl+N",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("open-files")
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Open..."),
                  accelerator: "CmdOrCtrl+O",
                  click: async () =>
                  {
                     const response = await this .showOpenDialog (this .currentFile)

                     if (response .canceled)
                        return

                     this .openFiles (response .filePaths .map (filePath => url .pathToFileURL (filePath) .href))
                  },
               },
               {
                  label: _ ("Open URL..."),
                  accelerator: "Shift+CmdOrCtrl+O",
                  click: async () =>
                  {
                     this .pushMenu (electron .Menu .buildFromTemplate ([
                        {
                           role: "appMenu",
                           label: "Sunrize",
                        },
                        { role: "editMenu" },
                     ]))

                     const response = await prompt ({
                        title: "Open URL...",
                        label: "Enter URL for opening in new tab:",
                        type: "input",
                        value: this .openURLValue,
                        inputAttrs: {
                           type: "url",
                           placeholder: "https://example.org",
                        },
                        width: 500,
                        customStylesheet: path .join (__dirname, "../../themes/prompt.css"),
                     },
                     this .mainWindow)

                     this .popMenu ()

                     if (response === null)
                        return

                     this .openFiles ([this .openURLValue = response])
                  },
               },
               {
                  role: "recentdocuments",
                  submenu: [
                     {
                        role: "clearrecentdocuments",
                     },
                  ],
               },
               { type: "separator" },
               {
                  label: _ ("Save"),
                  accelerator: "CmdOrCtrl+S",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("save-file")
                  },
               },
               {
                  label: _ ("Save As..."),
                  accelerator: "Shift+CmdOrCtrl+S",
                  click: async () =>
                  {
                     const response = await this .showSaveDialog (this .currentFile)

                     if (response .canceled)
                        return

                     electron .app .addRecentDocument (response .filePath)

                     this .mainWindow .webContents .send ("save-file-as", response .filePath)
                  },
               },
               {
                  label: _ ("Save Copy As..."),
                  click: async () =>
                  {
                     const response = await this .showSaveDialog (this .currentFile)

                     if (response .canceled)
                        return

                     electron .app .addRecentDocument (response .filePath)

                     this .mainWindow .webContents .send ("save-copy-as", response .filePath)
                  },
               },
               {
                  label: _ ("Save All"),
                  accelerator: "Alt+CmdOrCtrl+S",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("save-all-files")
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Auto Save"),
                  type: "checkbox",
                  checked: this .config .autoSave,
                  click: () =>
                  {
                     this .config .autoSave = !this .config .autoSave
                     this .mainWindow .webContents .send ("auto-save", this .config .autoSave)
                  },

               },
               { type: "separator" },
               ... exportPath ?
               [
                  {
                     label: util .format (_ ("Export As %s"), path .basename (exportPath)),
                     accelerator: "CmdOrCtrl+E",
                     click: async () =>
                     {
                        const exportPath = this .exportPath .get (this .currentFile)

                        this .mainWindow .webContents .send ("export-as", exportPath)
                     },
                  }
               ] : [ ],
               {
                  label: _ ("Export As..."),
                  accelerator: "Shift+CmdOrCtrl+E",
                  click: async () =>
                  {
                     const response = await this .showExportDialog (this .currentFile)

                     if (response .canceled)
                        return

                     electron .app .addRecentDocument (response .filePath)

                     this .exportPath .set (this .currentFile, response .filePath)

                     this .mainWindow .webContents .send ("export-as", response .filePath)

                     this .updateMenu ()
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Scene Properties..."),
                  accelerator: "CmdOrCtrl+I",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("scene-properties")
                  },
               },
               { type: "separator" },
               {
                  role: "close",
               },
            ],
         },
         this .menuOptions .defaultEditMenu ? { role: "editMenu" } :
         {
            role: "editMenu",
            submenu: [
               {
                  label: this .menuOptions .undoLabel,
                  accelerator: "CmdOrCtrl+Z",
                  enabled: this .menuOptions .undoLabel !== _ ("Undo"),
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("undo")
                  },
               },
               {
                  label: this .menuOptions .redoLabel,
                  accelerator: "Shift+CmdOrCtrl+Z",
                  enabled: this .menuOptions .redoLabel !== _ ("Redo"),
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("redo")
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Cut"),
                  accelerator: "CmdOrCtrl+X",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("cut")
                  },
               },
               {
                  label: _ ("Copy"),
                  accelerator: "CmdOrCtrl+C",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("copy")
                  },
               },
               {
                  label: _ ("Paste"),
                  accelerator: "CmdOrCtrl+V",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("paste")
                  },
               },
               {
                  label: _ ("Delete"),
                  accelerator: "CmdOrCtrl+Backspace",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("delete")
                  },
               },
            ],
         },
         {
            label: _ ("Selection"),
            submenu: [
               {
                  label: _ ("Select All"),
                  accelerator: "CmdOrCtrl+A",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("select-all")
                  },
               },
               {
                  label: _ ("Deselect All"),
                  accelerator: "Shift+CmdOrCtrl+A",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("deselect-all")
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Remove Empty Groups"),
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("remove-empty-groups")
                  },
               },
            ],
         },
         {
            label: _ ("View"),
            submenu: [
               {
                  role: "reload",
                  visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
               },
               {
                  role: "forceReload",
                  visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
               },
               {
                  role: "toggleDevTools",
                  visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
               },
               {
                  label: "Toggle Tab Developer Tools",
                  visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("toggle-developer-tools")
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Outline Editor"),
                  submenu: [
                     {
                        label: _ ("Expand ExternProto Declarations"),
                        type: "checkbox",
                        checked: this .config .expandExternProtoDeclarations,
                        click: () =>
                        {
                           this .config .expandExternProtoDeclarations = !this .config .expandExternProtoDeclarations
                           this .mainWindow .webContents .send ("expand-extern-proto-declarations", this .config .expandExternProtoDeclarations)
                        },
                     },
                     {
                        label: _ ("Expand Prototype Instances"),
                        type: "checkbox",
                        checked: this .config .expandPrototypeInstances,
                        click: () =>
                        {
                           this .config .expandPrototypeInstances = !this .config .expandPrototypeInstances
                           this .mainWindow .webContents .send ("expand-prototype-instances", this .config .expandPrototypeInstances)
                        },
                     },
                     {
                        label: _ ("Expand Inline Nodes"),
                        type: "checkbox",
                        checked: this .config .expandInlineNodes,
                        click: () =>
                        {
                           this .config .expandInlineNodes = !this .config .expandInlineNodes
                           this .mainWindow .webContents .send ("expand-inline-nodes", this .config .expandInlineNodes)
                        },
                     },
                  ],
               },
               { type: "separator" },
               {
                  label: _ ("Primitive Quality"),
                  submenu: [
                     {
                        label: _ ("High"),
                        type: "radio",
                        checked: this .config .primitiveQuality === "HIGH",
                        click: () =>
                        {
                           this .config .primitiveQuality = "HIGH"
                           this .mainWindow .webContents .send ("primitive-quality", this .config .primitiveQuality)
                        },
                     },
                     {
                        label: _ ("Medium"),
                        type: "radio",
                        checked: this .config .primitiveQuality === "MEDIUM" || this .config .primitiveQuality === undefined,
                        click: () =>
                        {
                           this .config .primitiveQuality = "MEDIUM"
                           this .mainWindow .webContents .send ("primitive-quality", this .config .primitiveQuality)
                        },
                     },
                     {
                        label: _ ("Low"),
                        type: "radio",
                        checked: this .config .primitiveQuality === "LOW",
                        click: () =>
                        {
                           this .config .primitiveQuality = "LOW"
                           this .mainWindow .webContents .send ("primitive-quality", this .config .primitiveQuality)
                        },
                     }
                  ],
               },
               {
                  label: _ ("Texture Quality"),
                  submenu: [
                     {
                        label: _ ("High"),
                        type: "radio",
                        checked: this .config .textureQuality === "HIGH",
                        click: () =>
                        {
                           this .config .textureQuality = "HIGH"
                           this .mainWindow .webContents .send ("texture-quality", this .config .textureQuality)
                        },
                     },
                     {
                        label: _ ("Medium"),
                        type: "radio",
                        checked: this .config .textureQuality === "MEDIUM" || this .config .textureQuality === undefined,
                        click: () =>
                        {
                           this .config .textureQuality = "MEDIUM"
                           this .mainWindow .webContents .send ("texture-quality",this .config .textureQuality)
                        },
                     },
                     {
                        label: _ ("Low"),
                        type: "radio",
                        checked: this .config .textureQuality === "LOW",
                        click: () =>
                        {
                           this .config .textureQuality = "LOW"
                           this .mainWindow .webContents .send ("texture-quality", this .config .textureQuality)
                        },
                     }
                  ],
               },
               {
                  label: _ ("Display Rubberband"),
                  type: "checkbox",
                  checked: this .config .rubberband,
                  click: () =>
                  {
                     this .config .rubberband = !this .config .rubberband
                     this .mainWindow .webContents .send ("display-rubberband", this .config .rubberband)
                  },
               },
               {
                  label: _ ("Display Timings"),
                  type: "checkbox",
                  checked: this .config .timings,
                  click: () =>
                  {
                     this .config .timings = !this .config .timings
                     this .mainWindow .webContents .send ("display-timings", this .config .timings)
                  },
               },
               { type: "separator" },
               {
                  label: _ ("Show Library..."),
                  accelerator: "Shift+CmdOrCtrl+L",
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("show-library")
                  },
               },
               { type: "separator" },
               {
                  role: "togglefullscreen",
               },
            ],
         },
         {
            label: "Layout",
            submenu: [
               {
                  label: _ ("Browser Size..."),
                  click: () =>
                  {
                     this .mainWindow .webContents .send ("browser-size")
                  },
               },
            ],
         },
         {
            role: "window",
            submenu: [ ],
         },
         {
            role: "help",
            submenu: [ ],
         },
      ])

      this .mainMenu [0] = menu

      if (this .mainMenu .length === 1)
         electron .Menu .setApplicationMenu (menu)
   }

   async createWindow ()
   {
      const window = new electron .BrowserWindow ({
         icon: path .join (__dirname, "../../images/icon.png"),
         x: this .config .position [0],
         y: this .config .position [1],
         width: Math .max (this .config .getDefaultValue ("size") [0] / 4, this .config .size [0]),
         height: Math .max (this .config .getDefaultValue ("size") [1] / 4, this .config .size [1]),
         minWidth: this .config .getDefaultValue ("size") [0] / 4,
         minHeight: this .config .getDefaultValue ("size") [1] / 4,
         backgroundColor: electron .nativeTheme .shouldUseDarkColors ? "rgb(28, 28, 30)" : "rgb(242, 242, 247)",
         show: false,
         webPreferences: {
            preload: path .join (__dirname, "../../html/application.js"),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
         },
      })

      this .mainWindow = window

      window .setVisibleOnAllWorkspaces (true)
      window .once ("ready-to-show", () => window .show ())

      window .on ("maximize", ()          => this .maximize ())
      window .on ("unmaximize", ()        => this .unmaximize ())
      window .on ("enter-full-screen", () => this .enterFullscreen ())
      window .on ("leave-full-screen", () => this .leaveFullscreen ())
      window .on ("blur", ()              => this .blur ())
      window .on ("close", (event)        => this .close (event))

      if (this .config .maximized)
         window .maximize ()

      window .setFullScreen (this .config .fullscreen)

      await window .loadFile (path .join (__dirname, "../../html/application.html"))
   }

   activate ()
   {
      if (electron .BrowserWindow .getAllWindows () .length)
         return

      this .createWindow ()
   }

   contextMenu (id, menu)
   {
      electron .Menu .buildFromTemplate (this .createMenuTemplate (id, menu))
         .popup ({ window: this .mainWindow })
   }

   createMenuTemplate (id, menu)
   {
      const template = [ ]

      for (const menuItem of menu)
      {
         if (menuItem .submenu)
            menuItem .submenu = this .createMenuTemplate (id, menuItem .submenu)
         else
            menuItem .click = () => this .mainWindow .webContents .send (id, ...menuItem .args)

         template .push (menuItem)
      }

      return template
   }

   /**
    *
    * @param {[string]} urls
    */
   openFiles (urls)
   {
      for (const URL of urls)
      {
         if (URL .startsWith ("file:"))
            electron .app .addRecentDocument (url .fileURLToPath (URL))
      }

      this .mainWindow .webContents .send ("open-files", urls)
   }

   async showOpenDialog (defaultPath)
   {
      return await electron .dialog .showOpenDialog ({
         defaultPath: defaultPath,
         properties: ["openFile", "multiSelections"],
         filters : [
            {name: "X3D Document", extensions: ["x3d", "x3dz", "x3dj", "x3djz", "x3dv", "x3dvz", "wrl", "wrz", "wrl.gz", "vrml", "gltf", "glb", "obj", "stl", "ply", "svg"]},
         ],
      })
   }

   saveFile (filePath)
   {
      electron .app .addRecentDocument (filePath)
   }

   async showSaveDialog (defaultPath)
   {
      return await electron .dialog .showSaveDialog ({
         defaultPath: defaultPath,
         properties: ["createDirectory", "showOverwriteConfirmation"],
         filters : [
            { name: "X3D XML Document", extensions: ["x3d"] },
            { name: "X3D XML Document GZipped", extensions: ["x3dz"] },
            { name: "X3D JSON Document", extensions: ["x3dj"] },
            { name: "X3D JSON Document GZipped", extensions: ["x3djz"] },
            { name: "X3D VRML Classic Document", extensions: ["x3dv"] },
            { name: "X3D VRML Classic Document GZipped", extensions: ["x3dvz"] },
         ],
      })
   }

   async showExportDialog (defaultPath)
   {
      return await electron .dialog .showSaveDialog ({
         defaultPath: defaultPath,
         properties: ["createDirectory", "showOverwriteConfirmation"],
         filters : [
            { name: "HTML Document", extensions: ["html"] },
         ],
      })
   }

   maximize ()
   {
      this .config .maximized = true
   }

   unmaximize ()
   {
      this .config .maximized = false
   }

   enterFullscreen ()
   {
      this .config .fullscreen = true
   }

   leaveFullscreen ()
   {
      this .config .fullscreen = false
   }

   blur ()
   {
      this .mainWindow .webContents .send ("save-all-files")
   }

   close (event)
   {
      if (!this .mainWindow .closing)
      {
         event .preventDefault ()
         this .mainWindow .closing = true
         this .mainWindow .webContents .send ("quit")
      }
      else
      {
         if (this .config .maximized || this .config .fullscreen)
            return

         this .config .position = this .mainWindow .getPosition ()
         this .config .size     = this .mainWindow .getSize ()
      }
   }

   quit ()
   {
      if (!this .applicationShouldQuitAfterLastWindowClosed)
         return

      Template .remove (path .join (__dirname, "../../html/application-template.html"))
      Template .remove (path .join (__dirname, "../../html/document-template.html"))
      Template .remove (path .join (__dirname, "../../themes/default-template.css"))

      electron .app .quit ()
   }
}
