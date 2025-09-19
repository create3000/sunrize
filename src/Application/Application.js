"use strict";

const
   electron     = require ("electron"),
   prompt       = require ("electron-prompt"),
   url          = require ("url"),
   path         = require ("path"),
   fs           = require ("fs"),
   os           = require ("os"),
   util         = require ("util"),
   Template     = require ("./Template"),
   LocalStorage = require ("node-localstorage") .LocalStorage,
   DataStorage  = require ("../Application/DataStorage"),
   _            = require ("../Application/GetText");

const localStorage = new LocalStorage (path .join (electron .app .getPath ("userData"), "Global Storage"));

module .exports = class Application
{
   static app;

   static run ()
   {
      if (require ("electron-squirrel-startup"))
      {
         electron .app .quit ();
         return;
      }

      if (!electron .app .requestSingleInstanceLock ())
      {
         electron .app .quit ();
         return;
      }

      if (process .platform === "win32")
         require ("update-electron-app") .updateElectronApp ({ updateInterval: "1 hour" });

      this .associateWindowsFileTypes ();

      electron .app .commandLine .appendSwitch ("--enable-features", "OverlayScrollbar,ConversionMeasurement,AttributionReportingCrossAppWeb");

      return this .app = new Application ();
   }

   static associateWindowsFileTypes ()
   {
      if (process .platform !== "win32")
         return;

      // if (!electron .app .isPackaged)
      //    return;

      const { spawn } = require ("child_process");

      const
         reg = fs .readFileSync (path .join (__dirname, "../assets/X3D.reg"), { encoding: "utf-8" }),
         exe = path .resolve (path .join (os .homedir (), "/AppData/Local/sunrize/Sunrize X3D Editor.exe")),
         tmp = path .join (__dirname, "../assets/X3D-out.reg");

      const out = reg
         .replaceAll ("SUNRIZE_EXE", exe .replaceAll ("\\", "\\\\"));

      fs .writeFileSync (tmp, out);

      const ls = spawn ("reg", ["import", tmp]);

      ls .stdout .on ('data', (data) =>
      {
         // console .log (`stdout: ${data}`);
      });

      ls .stderr .on ('data', (data) =>
      {
         // console .error (`stderr: ${data}`);
      });

      ls .on ("close", (code) =>
      {
         fs .unlinkSync (tmp);
      });
   }

   config            = new DataStorage (localStorage, "Sunrize.Application.");
   receivedFiles     = [ ];
   mainMenu          = [ ];
   openLocationValue = "";
   exportPath        = new Map ();

   constructor ()
   {
      if (process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT")
         process .env .ELECTRON_ENABLE_LOGGING = 1;

      process .env .ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

      this .menuOptions = {
         defaultEditMenu: false,
         undoLabel: _("Undo"),
         redoLabel: _("Redo"),
      };

      this .config .setDefaultValues ({
         autoSave: true,
         browserUpdate: false,
         expandExternProtoDeclarations: true,
         expandInlineNodes: true,
         expandPrototypeInstances: true,
         fullscreen: false,
         maximized: false,
         position: [undefined, undefined],
         recentDocuments: [ ],
         recentLocations: [ ],
         size: [1100, 680],
      });

      Template .create (path .join (__dirname, "../assets/html/application-template.html"));
      Template .create (path .join (__dirname, "../assets/html/window-template.html"));
      Template .create (path .join (__dirname, "../assets/themes/default-template.css"));
      Template .create (path .join (__dirname, "../assets/themes/prompt-template.css"));

      this .setup ();
   }

   async setup ()
   {
      electron .app .on ("activate",           (event)           => this .onactivate ());
      electron .app .on ("new-window-for-tab", (event)           => this .createWindow ());
      electron .app .on ("open-file",          (event, filePath) => this .openFiles ([url .pathToFileURL (filePath) .href]));
      electron .app .on ("window-all-closed",  (event)           => this .quit ());

      electron .ipcMain .on ("title",               (event, title)       => this .title = title);
      electron .ipcMain .on ("current-file",        (event, currentFile) => this .currentFile = currentFile);
      electron .ipcMain .on ("add-recent-location", (event, fileURL)     => this .addRecentLocation (fileURL));
      electron .ipcMain .on ("update-menu",         (event, options)     => this .updateMenu (options));
      electron .ipcMain .on ("context-menu",        (event, id, menu)    => this .contextMenu (id, menu));

      electron .ipcMain .handle ("open-files", async (event, urls) => this .openFiles (urls));
      electron .ipcMain .handle ("file-path",  async (event, options) => await this .showDialog (options));
      electron .ipcMain .handle ("fullname",   async () => await (await import ("fullname")) .default ());

      await electron .app .whenReady ();
      await this .updateMenu ();
      await this .createWindow ();

      this .openFiles (process .argv .slice (electron .app .isPackaged ? 1 : 2)
         .filter (filePath => fs .existsSync (filePath) && fs .lstatSync (filePath) .isFile ())
         .map (filePath => url .pathToFileURL (filePath) .href));

      this .openFiles (this .receivedFiles);

      electron .app .on ("second-instance", (event, argv, cwd) =>
      {
         this .openFiles (argv .slice (1)
            .filter (filePath => fs .existsSync (filePath) && fs .lstatSync (filePath) .isFile ())
            .map (filePath => url .pathToFileURL (filePath) .href));
      });
   }

   get title ()
   {
      return this .mainWindow .title;
   }

   set title (title)
   {
      this .mainWindow .title = `${title} · ${electron .app .getName ()}`;
   }

   #currentFile = "";

   get currentFile ()
   {
      return this .#currentFile;
   }

   set currentFile (currentFile)
   {
      const protocol = currentFile .match (/^(.+?:)/);

      switch (protocol ?.[1])
      {
         default:
            this .#currentFile = new URL (currentFile) .pathname .split ("/") .at (-1);
            break;
         case "file:":
            this .#currentFile = url .fileURLToPath (currentFile);
            break;
         case "data:":
         case "id:":
         case undefined:
            this .#currentFile = "";
            break;
      }

      this .mainWindow .setRepresentedFilename (this .#currentFile);
   }

   pushMenu (menu)
   {
      this .mainMenu .push (menu);
      electron .Menu .setApplicationMenu (menu);
   }

   popMenu ()
   {
      this .mainMenu .pop ();
      electron .Menu .setApplicationMenu (this .mainMenu .at (-1));
   }

   #updateMenuTimeout;

   updateMenu (options = { })
   {
      Object .assign (this .menuOptions, options);

      clearTimeout (this .#updateMenuTimeout);

      this .#updateMenuTimeout = setTimeout (() =>
      {
         const exportPath = this .exportPath .get (this .currentFile);

         const menu = electron .Menu .buildFromTemplate (this .filterSeparators ([
            ... process .platform === "darwin" ?
            [
               {
                  role: "appMenu",
                  label: electron .app .getName (),
               },
            ]
            :
            [ ],
            {
               role: "fileMenu",
               submenu: [
                  {
                     label: _("New File"),
                     accelerator: "CmdOrCtrl+N",
                     click: () => this .mainWindow .webContents .send ("open-files"),
                  },
                  { type: "separator" },
                  {
                     label: _("Open..."),
                     accelerator: "CmdOrCtrl+O",
                     click: async () =>
                     {
                        const response = await this .showOpenDialog ({ defaultPath: this .currentFile });

                        if (response .canceled)
                           return;

                        this .openFiles (response .filePaths .map (filePath => url .pathToFileURL (filePath) .href));
                     },
                  },
                  {
                     label: _("Open Location..."),
                     accelerator: "Shift+CmdOrCtrl+O",
                     click: async () =>
                     {
                        const clipboard = electron .clipboard .readText ();

                        this .pushMenu (this .createDialogMenu ());

                        const response = await prompt ({
                           title: _("Open Location..."),
                           label: _("Enter a URL to open in a new tab:"),
                           type: "input",
                           value: clipboard .match (/^(?:https?|file|ftp|smb):\/\/.+/) ? clipboard : this .openLocationValue,
                           inputAttrs: {
                              type: "url",
                              placeholder: "https://example.org",
                           },
                           width: 500,
                           customStylesheet: path .join (__dirname, "../assets/themes/prompt.css"),
                           showWhenReady: true,
                        },
                        this .mainWindow);

                        this .popMenu ();

                        if (response === null)
                           return;

                        this .openFiles ([this .openLocationValue = response]);
                     },
                  },
                  {
                     label: _("Open Recent"),
                     submenu: [
                        ... this .config .recentDocuments
                           .filter (filePath => fs .existsSync (filePath)) .map (filePath =>
                        {
                           return {
                              label: filePath,
                              click: () => this .openFiles ([url .pathToFileURL (filePath) .href]),
                           };
                        }),
                        { type: "separator" },
                        ... this .config .recentLocations .map (fileURL =>
                        {
                           return {
                              label: fileURL,
                              click: () => this .openFiles ([fileURL]),
                           };
                        }),
                        { type: "separator" },
                        {
                           label: _("Clear Menu"),
                           click: () =>
                           {
                              this .config .recentDocuments = [ ];
                              this .config .recentLocations = [ ];

                              this .updateMenu ();

                              electron .app .clearRecentDocuments ();
                           },
                        },
                     ],
                  },
                  { type: "separator" },
                  {
                     label: _("Reload"),
                     accelerator: "F5",
                     click: () => this .mainWindow .webContents .send ("reload"),
                  },
                  { type: "separator" },
                  {
                     label: _("Make Browser Live (Play) on Load"),
                     type: "checkbox",
                     checked: this .config .browserUpdate,
                     click: () =>
                     {
                        this .config .browserUpdate = !this .config .browserUpdate;
                        this .mainWindow .webContents .send ("browser-update", this .config .browserUpdate);
                     },
                  },
                  { type: "separator" },
                  {
                     label: _("Save"),
                     accelerator: "CmdOrCtrl+S",
                     click: () => this .mainWindow .webContents .send ("save-file"),
                  },
                  {
                     label: _("Save As..."),
                     accelerator: "Shift+CmdOrCtrl+S",
                     click: async () =>
                     {
                        const response = await this .showSaveDialog ({ defaultPath: this .currentFile });

                        if (response .canceled)
                           return;

                        this .addRecentDocument (response .filePath);

                        this .mainWindow .webContents .send ("save-file-as", response .filePath);
                     },
                  },
                  {
                     label: _("Save A Copy..."),
                     click: async () =>
                     {
                        const response = await this .showSaveDialog ({ defaultPath: this .currentFile });

                        if (response .canceled)
                           return;

                        this .addRecentDocument (response .filePath);

                        this .mainWindow .webContents .send ("save-copy-as", response .filePath);
                     },
                  },
                  {
                     label: _("Save All"),
                     accelerator: "Alt+CmdOrCtrl+S",
                     click: () => this .mainWindow .webContents .send ("save-all-files"),
                  },
                  { type: "separator" },
                  {
                     label: _("Auto Save"),
                     type: "checkbox",
                     checked: this .config .autoSave,
                     click: () =>
                     {
                        this .config .autoSave = !this .config .autoSave;
                        this .mainWindow .webContents .send ("auto-save", this .config .autoSave);
                     },

                  },
                  { type: "separator" },
                  ... exportPath ?
                  [
                     {
                        label: util .format (_("Export As %s"), path .basename (exportPath)),
                        accelerator: "CmdOrCtrl+E",
                        click: () => this .mainWindow .webContents .send ("export-as", exportPath),
                     }
                  ]
                  :
                  [ ],
                  {
                     label: _("Export As..."),
                     accelerator: "Shift+CmdOrCtrl+E",
                     click: async () =>
                     {
                        const response = await this .showExportDialog (this .currentFile);

                        if (response .canceled)
                           return;

                        this .addRecentDocument (response .filePath);

                        this .exportPath .set (this .currentFile, response .filePath);

                        this .mainWindow .webContents .send ("export-as", response .filePath);

                        this .updateMenu ();
                     },
                  },
                  { type: "separator" },
                  {
                     label: _("Scene Properties..."),
                     accelerator: "CmdOrCtrl+I",
                     click: () => this .mainWindow .webContents .send ("scene-properties"),
                  },
                  { type: "separator" },
                  {
                     label: _("Close Tab"),
                     accelerator: "CmdOrCtrl+W",
                     click: () => this .mainWindow .webContents .send ("close-tab"),
                  },
                  {
                     label: _("Close All Tabs"),
                     accelerator: "Option+CmdOrCtrl+W",
                     click: () => this .mainWindow .webContents .send ("close-all-tabs"),
                  },
                  ... process .platform === "darwin" ?
                  [ ]
                  :
                  [{ role: "quit" }],
               ],
            },
            this .menuOptions .defaultEditMenu ?
            {
               role: "editMenu",
               submenu: [
                  { role: "undo" },
                  { role: "redo" },
                  { type: "separator" },
                  { role: "cut" },
                  { role: "copy" },
                  { role: "paste" },
                  ... process .platform === "darwin" ?
                  [
                     { role: "pasteAndMatchStyle" },
                     { role: "delete" },
                     { role: "selectAll" },
                     { type: "separator" },
                     {
                        label: _("Speech"),
                        submenu: [
                           { role: "startSpeaking" },
                           { role: "stopSpeaking" },
                        ]
                     },
                  ]
                  :
                  [
                     { role: "delete" },
                     { type: "separator" },
                     { role: "selectAll" },
                  ],
               ]
            }
            : this .menuOptions .monacoEditor ?
            {
               role: "editMenu",
               submenu: [
                  {
                     label: _("Undo"),
                     accelerator: "CmdOrCtrl+Z",
                     click: () => this .mainWindow .webContents .send ("script-editor", "triggerEvent", "keyboard", "undo", null),
                  },
                  {
                     label: _("Redo"),
                     accelerator: "CmdOrCtrl+Shift+Z",
                     click: () => this .mainWindow .webContents .send ("script-editor", "triggerEvent", "keyboard", "redo", null),
                  },
                  { type: "separator" },
                  {
                     role: "cut",
                     click: () => this .mainWindow .webContents .send ("script-editor", "cutOrCopy", "cut"),
                  },
                  {
                     role: "copy",
                     click: () => this .mainWindow .webContents .send ("script-editor", "cutOrCopy", "copy"),
                  },
                  {
                     role: "paste",
                     click: () => this .mainWindow .webContents .send ("script-editor", "paste"),
                  },
                  { type: "separator" },
                  {
                     label: _("Toggle Line Comment"),
                     accelerator: process .platform === "darwin" ? "CmdOrCtrl+Shift+7" : "CmdOrCtrl+#",
                     click: () => this .mainWindow .webContents .send ("script-editor", "runAction", "editor.action.commentLine"),
                  },
                  {
                     label: _("Toggle Block Comment"),
                     accelerator: "Alt+Shift+A",
                     click: () => this .mainWindow .webContents .send ("script-editor", "runAction", "editor.action.blockComment"),
                  },
               ]
            }
            : // Outline Editor, Browser
            {
               role: "editMenu",
               submenu: [
                  {
                     label: this .menuOptions .undoLabel,
                     accelerator: "CmdOrCtrl+Z",
                     enabled: this .menuOptions .undoLabel !== _("Undo"),
                     click: () => this .mainWindow .webContents .send ("undo"),
                  },
                  {
                     label: this .menuOptions .redoLabel,
                     accelerator: "Shift+CmdOrCtrl+Z",
                     enabled: this .menuOptions .redoLabel !== _("Redo"),
                     click: () => this .mainWindow .webContents .send ("redo"),
                  },
                  { type: "separator" },
                  { role: "cut" },
                  { role: "copy" },
                  { role: "paste" },
                  {
                     label: _("Delete"),
                     accelerator: "CmdOrCtrl+Backspace",
                     click: () => this .mainWindow .webContents .send ("delete"),
                  },
               ],
            },
            {
               label: _("Selection"),
               submenu: [
                  {
                     label: _("Select All"),
                     accelerator: "CmdOrCtrl+A",
                     click: () => this .mainWindow .webContents .send ("select-all"),
                  },
                  {
                     label: _("Deselect All"),
                     accelerator: "Shift+CmdOrCtrl+A",
                     click: () => this .mainWindow .webContents .send ("deselect-all"),
                  },
                  { type: "separator" },
                  {
                     label: _("Hide Unselected Objects"),
                     click: () => this .mainWindow .webContents .send ("hide-unselected-objects"),
                  },
                  {
                     label: _("Show Selected Objects"),
                     click: () => this .mainWindow .webContents .send ("show-selected-objects"),
                  },
                  {
                     label: _("Show All Objects"),
                     click: () => this .mainWindow .webContents .send ("show-all-objects"),
                  },
                  { type: "separator" },
                  {
                     label: _("Transform to Zero"),
                     click: () => this .mainWindow .webContents .send ("transform-to-zero"),
                  },
                  {
                     label: _("Remove Empty Groups"),
                     click: () => this .mainWindow .webContents .send ("remove-empty-groups"),
                  },
               ],
            },
            {
               label: _("View"),
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
                     label: _("Reload Tab"),
                     visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
                     click: () => this .mainWindow .webContents .send ("reload"),
                  },
                  {
                     label: _("Toggle Tab Developer Tools"),
                     visible: process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT",
                     click: () => this .mainWindow .webContents .send ("toggle-developer-tools"),
                  },
                  { type: "separator" },
                  {
                     label: _("Outline Editor"),
                     submenu: [
                        {
                           label: _("Expand ExternProto Declarations"),
                           type: "checkbox",
                           checked: this .config .expandExternProtoDeclarations,
                           click: () =>
                           {
                              this .config .expandExternProtoDeclarations = !this .config .expandExternProtoDeclarations;
                              this .mainWindow .webContents .send ("expand-extern-proto-declarations", this .config .expandExternProtoDeclarations);
                           },
                        },
                        {
                           label: _("Expand Prototype Instances"),
                           type: "checkbox",
                           checked: this .config .expandPrototypeInstances,
                           click: () =>
                           {
                              this .config .expandPrototypeInstances = !this .config .expandPrototypeInstances;
                              this .mainWindow .webContents .send ("expand-prototype-instances", this .config .expandPrototypeInstances);
                           },
                        },
                        {
                           label: _("Expand Inline Nodes"),
                           type: "checkbox",
                           checked: this .config .expandInlineNodes,
                           click: () =>
                           {
                              this .config .expandInlineNodes = !this .config .expandInlineNodes;
                              this .mainWindow .webContents .send ("expand-inline-nodes", this .config .expandInlineNodes);
                           },
                        },
                     ],
                  },
                  { type: "separator" },
                  {
                     label: _("Primitive Quality"),
                     submenu: [
                        {
                           label: _("High"),
                           type: "radio",
                           checked: this .menuOptions .primitiveQuality === "HIGH",
                           click: () => this .mainWindow .webContents .send ("primitive-quality", "HIGH"),
                        },
                        {
                           label: _("Medium"),
                           type: "radio",
                           checked: this .menuOptions .primitiveQuality === "MEDIUM",
                           click: () => this .mainWindow .webContents .send ("primitive-quality", "MEDIUM"),
                        },
                        {
                           label: _("Low"),
                           type: "radio",
                           checked: this .menuOptions .primitiveQuality === "LOW",
                           click: () => this .mainWindow .webContents .send ("primitive-quality", "LOW"),
                        },
                     ],
                  },
                  {
                     label: _("Texture Quality"),
                     submenu: [
                        {
                           label: _("High"),
                           type: "radio",
                           checked: this .menuOptions .textureQuality === "HIGH",
                           click: () => this .mainWindow .webContents .send ("texture-quality", "HIGH"),
                        },
                        {
                           label: _("Medium"),
                           type: "radio",
                           checked: this .menuOptions .textureQuality === "MEDIUM",
                           click: () => this .mainWindow .webContents .send ("texture-quality", "MEDIUM"),
                        },
                        {
                           label: _("Low"),
                           type: "radio",
                           checked: this .menuOptions .textureQuality === "LOW",
                           click: () => this .mainWindow .webContents .send ("texture-quality", "LOW"),
                        },
                     ],
                  },
                  {
                     label: _("Text Compression"),
                     submenu: [
                        {
                           label: _("Char Spacing"),
                           type: "radio",
                           checked: this .menuOptions .textCompression === "CHAR_SPACING",
                           click: () => this .mainWindow .webContents .send ("text-compression", "CHAR_SPACING"),
                        },
                        {
                           label: _("Scaling"),
                           type: "radio",
                           checked: this .menuOptions .textCompression === "SCALING",
                           click: () => this .mainWindow .webContents .send ("text-compression", "SCALING"),
                        },
                     ],
                  },
                  {
                     label: _("Color Space"),
                     submenu: [
                        {
                           label: _("Linear"),
                           type: "radio",
                           checked: this .menuOptions .colorSpace === "LINEAR",
                           click: () => this .mainWindow .webContents .send ("color-space", "LINEAR"),
                        },
                        {
                           label: _("Linear When PhysicalMaterial"),
                           type: "radio",
                           checked: this .menuOptions .colorSpace === "LINEAR_WHEN_PHYSICAL_MATERIAL",
                           click: () => this .mainWindow .webContents .send ("color-space", "LINEAR_WHEN_PHYSICAL_MATERIAL"),
                        },
                        {
                           label: _("sRGB"),
                           type: "radio",
                           checked: this .menuOptions .colorSpace === "SRGB",
                           click: () => this .mainWindow .webContents .send ("color-space", "SRGB"),
                        },
                     ],
                  },
                  {
                     label: _("Tone Mapping"),
                     submenu: [
                        {
                           label: _("KHR PBR Neutral"),
                           type: "radio",
                           checked: this .menuOptions .toneMapping === "KHR_PBR_NEUTRAL",
                           click: () => this .mainWindow .webContents .send ("tone-mapping", "KHR_PBR_NEUTRAL"),
                        },
                        {
                           label: _("ACES Hill Exposure Boost"),
                           type: "radio",
                           checked: this .menuOptions .toneMapping === "ACES_HILL_EXPOSURE_BOOST",
                           click: () => this .mainWindow .webContents .send ("tone-mapping", "ACES_HILL_EXPOSURE_BOOST"),
                        },
                        {
                           label: _("ACES Hill"),
                           type: "radio",
                           checked: this .menuOptions .toneMapping === "ACES_HILL",
                           click: () => this .mainWindow .webContents .send ("tone-mapping", "ACES_HILL"),
                        },
                        {
                           label: _("ACES Narkowicz"),
                           type: "radio",
                           checked: this .menuOptions .toneMapping === "ACES_NARKOWICZ",
                           click: () => this .mainWindow .webContents .send ("tone-mapping", "ACES_NARKOWICZ"),
                        },
                        {
                           label: _("None"),
                           type: "radio",
                           checked: this .menuOptions .toneMapping === "NONE",
                           click: () => this .mainWindow .webContents .send ("tone-mapping", "NONE"),
                        },
                     ],
                  },
                  {
                     label: _("Order Independent Transparency"),
                     type: "checkbox",
                     checked: this .menuOptions .orderIndependentTransparency,
                     click: () => this .mainWindow .webContents .send ("order-independent-transparency", !this .menuOptions .orderIndependentTransparency),
                  },
                  {
                     label: _("Logarithmic Depth Buffer"),
                     type: "checkbox",
                     checked: this .menuOptions .logarithmicDepthBuffer,
                     click: () => this .mainWindow .webContents .send ("logarithmic-depth-buffer", !this .menuOptions .logarithmicDepthBuffer),
                  },
                  { type: "separator" },
                  {
                     label: _("Mute Audio"),
                     type: "checkbox",
                     checked: this .menuOptions .mute,
                     click: () => this .mainWindow .webContents .send ("mute", !this .menuOptions .mute),
                  },
                  {
                     label: _("Display Rubberband"),
                     type: "checkbox",
                     checked: this .menuOptions .rubberband,
                     click: () => this .mainWindow .webContents .send ("display-rubberband", !this .menuOptions .rubberband),
                  },
                  {
                     label: _("Display Timings"),
                     accelerator: "CmdOrCtrl+Plus",
                     type: "checkbox",
                     checked: this .menuOptions .timings,
                     click: () => this .mainWindow .webContents .send ("display-timings", !this .menuOptions .timings),
                  },
                  { type: "separator" },
                  {
                     label: _("Show Library..."),
                     accelerator: "Shift+CmdOrCtrl+L",
                     click: () => this .mainWindow .webContents .send ("show-library"),
                  },
                  { type: "separator" },
                  {
                     role: "togglefullscreen",
                  },
               ],
            },
            {
               label: _("Layout"),
               submenu: [
                  {
                     label: _("Browser Frame..."),
                     click: () => this .mainWindow .webContents .send ("browser-frame"),
                  },
                  { type: "separator" },
                  {
                     label: _("Grid Layout Tool"),
                     type: "checkbox",
                     checked: this .menuOptions .GridTool,
                     click: () => this .mainWindow .webContents .send ("grid-tool", "GridTool", !this .menuOptions .GridTool),
                  },
                  {
                     label: _("Angle Grid Layout Tool"),
                     type: "checkbox",
                     checked: this .menuOptions .AngleGridTool,
                     click: () => this .mainWindow .webContents .send ("grid-tool", "AngleGridTool", !this .menuOptions .AngleGridTool),
                  },
                  {
                     label: _("Axonometric Grid Layout Tool"),
                     type: "checkbox",
                     checked: this .menuOptions .AxonometricGridTool,
                     click: () => this .mainWindow .webContents .send ("grid-tool", "AxonometricGridTool", !this .menuOptions .AxonometricGridTool),
                  },
                  { type: "separator" },
                  {
                     label: _("Show Grid Tool Options in Panel..."),
                     accelerator: "CmdOrCtrl+G",
                     enabled: this .menuOptions .GridTool || this .menuOptions .AngleGridTool || this .menuOptions .AxonometricGridTool,
                     click: () => this .mainWindow .webContents .send ("grid-options"),
                  },
                  { type: "separator" },
                  {
                     label: _("Activate Snap Target"),
                     type: "checkbox",
                     checked: this .menuOptions .SnapTarget,
                     click: () => this .mainWindow .webContents .send ("activate-snap-target", !this .menuOptions .SnapTarget),
                  },
                  {
                     label: _("Activate Snap Source"),
                     type: "checkbox",
                     checked: this .menuOptions .SnapSource,
                     click: () => this .mainWindow .webContents .send ("activate-snap-source", !this .menuOptions .SnapSource),
                  },
                  {
                     label: _("Center Snap Target in Selection"),
                     click: () => this .mainWindow .webContents .send ("center-snap-target-in-selection"),
                  },
                  {
                     label: _("Move Selection to Snap Target"),
                     accelerator: "CmdOrCtrl+M",
                     enabled: this .menuOptions .SnapTarget,
                     click: () => this .mainWindow .webContents .send ("move-selection-to-snap-target"),
                  },
                  {
                     label: _("Move Selection Center to Snap Target"),
                     accelerator: "Shift+CmdOrCtrl+M",
                     enabled: this .menuOptions .SnapTarget,
                     click: () => this .mainWindow .webContents .send ("move-selection-center-to-snap-target"),
                  },
               ],
            },
            ... process .platform === "darwin" ?
            [
               {
                  role: "window",
                  submenu: [ ],
               },
            ]
            :
            [ ],
            {
               role: "help",
               submenu: [
                  {
                     label: _("Learn More"),
                     click: () => electron .shell .openExternal ("https://create3000.github.io/sunrize/"),
                  },
                  {
                     label: _("A Quick Look at the User Interface"),
                     click: () => electron .shell .openExternal ("https://create3000.github.io/sunrize/documentation/a-quick-look-at-the-user-interface/"),
                  },
                  {
                     label: _("How to Navigate in a Scene"),
                     click: () => electron .shell .openExternal ("https://create3000.github.io/x_ite/tutorials/how-to-navigate-in-a-scene/"),
                  },
                  {
                     label: _("Using the Outline Editor"),
                     click: () => electron .shell .openExternal ("https://create3000.github.io/sunrize/documentation/using-the-outline-editor/"),
                  },
                  {
                     label: _("Using the Script Editor"),
                     click: () => electron .shell .openExternal ("https://create3000.github.io/sunrize/documentation/using-the-script-editor/"),
                  },
                  { type: "separator" },
                  {
                     label: _("Report a Bug"),
                     click: () => electron .shell .openExternal ("https://github.com/create3000/sunrize/issues"),
                  },
               ],
            },
         ]));

         this .mainMenu [0] = menu;

         if (this .mainMenu .length === 1)
            electron .Menu .setApplicationMenu (menu);
      });

   }

   createDialogMenu ()
   {
      return electron .Menu .buildFromTemplate ([
         ... process .platform === "darwin" ?
         [
            {
               role: "appMenu",
               label: electron .app .getName (),
            },
         ]
         :
         [
            {
               role: "fileMenu",
               submenu: [{ role: "quit" }],
            }
         ],
         { role: "editMenu" },
      ]);
   }

   async createWindow ()
   {
      const window = new electron .BrowserWindow ({
         icon: path .join (__dirname, "../assets/images/icon.png"),
         x: this .config .position [0],
         y: this .config .position [1],
         width: Math .max (this .config .getDefaultValue ("size") [0] / 4, this .config .size [0]),
         height: Math .max (this .config .getDefaultValue ("size") [1] / 4, this .config .size [1]),
         minWidth: this .config .getDefaultValue ("size") [0] / 4,
         minHeight: this .config .getDefaultValue ("size") [1] / 4,
         backgroundColor: electron .nativeTheme .shouldUseDarkColors ? "rgb(28, 28, 30)" : "rgb(242, 242, 247)",
         show: false,
         webPreferences: {
            preload: path .join (__dirname, "../assets/html/application.js"),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
         },
      });

      this .mainWindow = window;

      window .setVisibleOnAllWorkspaces (true);
      window .once ("ready-to-show", () => window .show ());

      window .on ("maximize",          () => this .onmaximize ());
      window .on ("unmaximize",        () => this .onunmaximize ());
      window .on ("enter-full-screen", () => this .onenterfullscreen ());
      window .on ("leave-full-screen", () => this .onleavefullscreen ());
      window .on ("blur",              () => this .onblur ());
      window .on ("close",        (event) => this .onclose (event));

      if (this .config .fullscreen)
         window .setFullScreen (this .config .fullscreen);
      else if (this .config .maximized)
         window .maximize ();

      await window .loadFile (path .join (__dirname, "../assets/html/application.html"));

      this .ready = true;
   }

   onactivate ()
   {
      if (electron .BrowserWindow .getAllWindows () .length)
         this .mainWindow .show ();
      else
         this .createWindow ();
   }

   contextMenu (id, menu)
   {
      electron .Menu .buildFromTemplate (this .addMenuItemHandlers (id, this .filterSeparators (menu)))
         .popup ({ window: this .mainWindow });
   }

   addMenuItemHandlers (id, menu)
   {
      for (const menuItem of menu)
      {
         if (menuItem .submenu)
            this .addMenuItemHandlers (id, menuItem .submenu);
         else if (menuItem .args)
            menuItem .click = () => this .mainWindow .webContents .send (id, ... menuItem .args);
      }

      return menu;
   }

   filterSeparators (menu)
   {
      const filtered = [ ];

      let separator = false;

      for (const menuItem of menu .filter (menuItem => menuItem .visible ?? true))
      {
         if (separator && menuItem .type === "separator")
            continue;

         separator = menuItem .type === "separator";

         filtered .push (menuItem);
      }

      if (filtered .at (0) ?.type === "separator")
         filtered .shift ();

      if (filtered .at (-1) ?.type === "separator")
         filtered .pop ();

      for (const menuItem of filtered)
      {
         if (menuItem .submenu)
            menuItem .submenu = this .filterSeparators (menuItem .submenu);
      }

      return filtered;
   }

   showDialog (options)
   {
      switch (options .type)
      {
         case "open":
            return this .showOpenDialog (options);
         case "save":
            return this .showSaveDialog (options);
      }
   }

   /**
    *
    * @param {[string]} urls
    */
   openFiles (urls)
   {
      if (this .ready)
      {
         for (const fileURL of urls)
            this .addRecentLocation (fileURL);

         this .mainWindow .webContents .send ("open-files", urls);
         this .mainWindow .show ();
      }
      else
      {
         this .receivedFiles .push (... urls);
      }
   }

   async showOpenDialog ({ defaultPath, filters, properties = ["multiSelections"] })
   {
      const defaultFilters = [
         {
            name: _("X3D"),
            extensions: ["x3d", "x3dz", "x3dv", "x3dvz", "x3dj", "x3djz", "wrl", "wrz", "wrl.gz", "vrml"],
         },
         {
            name: _("3D"),
            extensions: ["gltf", "glb", "obj", "stl", "ply", "svg"],
         },
         {
            name: _("Audio"),
            extensions: ["mp3", "wav", "oga", "ogg"],
         },
         {
            name: _("Images"),
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "ktx2"],
         },
         {
            name: _("Video"),
            extensions: ["mp4", "webm", "ogv"],
         },
      ];

      this .pushMenu (this .createDialogMenu ());

      const response = await electron .dialog .showOpenDialog ({
         defaultPath,
         properties: ["openFile", ... properties],
         filters: filters ?? [
            {
               name: _("All Documents"),
               extensions: defaultFilters .reduce ((p, c) => p .concat (c .extensions), [ ]),
            },
            ... defaultFilters,
         ],
      });

      this .popMenu ();

      return response;
   }

   async showSaveDialog ({ defaultPath, filters, properties = ["multiSelections"] })
   {
      this .pushMenu (this .createDialogMenu ());

      const response = await electron .dialog .showSaveDialog ({
         defaultPath,
         properties: ["createDirectory", "showOverwriteConfirmation", ... properties],
         filters: filters ?? [
            { name: _("X3D XML Document"), extensions: ["x3d"] },
            { name: _("X3D XML Document GZipped"), extensions: ["x3dz"] },
            { name: _("X3D VRML Classic Document"), extensions: ["x3dv"] },
            { name: _("X3D VRML Classic Document GZipped"), extensions: ["x3dvz"] },
            { name: _("X3D JSON Document"), extensions: ["x3dj"] },
            { name: _("X3D JSON Document GZipped"), extensions: ["x3djz"] },
         ],
      });

      this .popMenu ();

      return response;
   }

   async showExportDialog (defaultPath)
   {
      this .pushMenu (this .createDialogMenu ());

      const response = await electron .dialog .showSaveDialog ({
         defaultPath,
         properties: ["createDirectory", "showOverwriteConfirmation"],
         filters : [
            { name: "HTML Document", extensions: ["html"] },
         ],
      });

      this .popMenu ();

      return response;
   }

   recentDocumentsLength = 10;
   recentLocationsLength = 10;

   addRecentDocument (filePath)
   {
      // Workaround for https://github.com/electron/electron/issues/40611

      this .config .recentDocuments = this .config .recentDocuments
         .filter (item => item !== filePath)
         .toSpliced (0, 0, filePath)
         .filter (item => fs .existsSync (item))
         .toSpliced (this .recentDocumentsLength);

      this .updateMenu ();

      // System API

      electron .app .addRecentDocument (filePath);
   }

   addRecentLocation (fileURL)
   {
      if (fileURL .startsWith ("id:"))
         return;

      if (fileURL .startsWith ("file:"))
         return this .addRecentDocument (url .fileURLToPath (fileURL));

      this .config .recentLocations = this .config .recentLocations
         .filter (item => item !== fileURL)
         .toSpliced (0, 0, fileURL)
         .toSpliced (this .recentLocationsLength);

      this .updateMenu ();
   }

   onmaximize ()
   {
      this .config .maximized = true;
   }

   onunmaximize ()
   {
      this .config .maximized = false;
   }

   onenterfullscreen ()
   {
      this .config .fullscreen = true;
   }

   onleavefullscreen ()
   {
      this .config .fullscreen = false;
      this .config .maximized  = false;
   }

   onblur ()
   {
      this .mainWindow .webContents .send ("save-all-files");
   }

   onclose (event)
   {
      if (!this .mainWindow .closing)
      {
         event .preventDefault ();
         this .mainWindow .closing = true;
         this .mainWindow .webContents .send ("quit");
      }
      else
      {
         if (this .config .maximized || this .config .fullscreen)
            return;

         this .config .position = this .mainWindow .getPosition ();
         this .config .size     = this .mainWindow .getSize ();
      }
   }

   quit ()
   {
      Template .removeAll ();
      electron .app .quit ();
   }
};
