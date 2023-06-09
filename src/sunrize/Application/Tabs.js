"use strict"

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   TabGroup    = require ("electron-tabs"),
   DataStorage = require ("./DataStorage"),
   url         = require ("url"),
   path        = require ("path"),
   fs          = require ("fs"),
   md5         = require ("md5"),
   CSS         = require ("./CSS"),
   _           = require ("./GetText")

module .exports = new class Tabs
{
   // Construction

   config = new DataStorage (localStorage, "Sunrize.Application.")

   constructor ()
   {
      this .tabs = $("tab-group") .get (0)

      this .config .addDefaultValues ({
         openTabs: [ ],
         scrollLeft: 0,
      })

      $(() => this .initialize ())
   }

   initialize ()
   {
      this .tabs .on ("tab-active", tab =>
      {
         electron .ipcRenderer .send ("title", tab .title)

         if (tab .url .startsWith ("file:"))
            electron .ipcRenderer .send ("current-file", url .fileURLToPath (tab .url))

         if (tab .domReady)
            tab .webview .send ("activate")

         tab .initialized = true

         this .saveTabs ()
      })

      this .tabs .on ("tab-removed", (tab) => this .saveTabs ())

      // Actions

      electron .ipcRenderer .on ("open-files",     (event, urls)     => this .openTabs (urls))
      electron .ipcRenderer .on ("save-file",      (event)           => this .saveFile ())
      electron .ipcRenderer .on ("save-file-as",   (event, filePath) => this .saveFileAs (filePath))
      electron .ipcRenderer .on ("save-all-files", (event)           => this .saveAllFiles ())
      electron .ipcRenderer .on ("quit",           (event)           => this .quit ())

      electron .ipcRenderer .on ("toggle-developer-tools", (event) => this .tabs .getActiveTab () .webview .openDevTools ())

      $(window) .on ("beforeunload", () => this .close ())

      // Forward Actions

      this .forwardToAllTabs ("auto-save")
      this .forwardToActiveTab ("export-as")

      this .forwardToActiveTab ("scene-properties")
      this .forwardToActiveTab ("save-copy-as")
      this .forwardToActiveTab ("scene-properties")

      this .forwardToActiveTab ("undo")
      this .forwardToActiveTab ("redo")

      this .forwardToActiveTab ("cut")
      this .forwardToActiveTab ("copy")
      this .forwardToActiveTab ("paste")
      this .forwardToActiveTab ("delete")
      this .forwardToActiveTab ("select-all")

      this .forwardToActiveTab ("deselect-all")
      this .forwardToActiveTab ("remove-empty-groups")

      this .forwardToAllTabs ("expand-extern-proto-declarations")
      this .forwardToAllTabs ("expand-prototype-instances")
      this .forwardToAllTabs ("expand-inline-nodes")

      this .forwardToAllTabs ("primitive-quality")
      this .forwardToAllTabs ("texture-quality")
      this .forwardToAllTabs ("display-rubberband")
      this .forwardToAllTabs ("display-timings")

      this .forwardToActiveTab ("show-library")
      this .forwardToActiveTab ("browser-size")
      this .forwardToActiveTab ("script-editor-menu")
      this .forwardToActiveTab ("outline-editor-menu")

      // Restore tabs.
      this .restoreTabs (this .config .activeTab)
   }

   // Tab handling

   restoreTabs (activeTab)
   {
      const config = new DataStorage (localStorage, "Sunrize.")

      const openTabs = this .config .openTabs .filter (fileURL =>
      {
         if (!fileURL .startsWith ("file:"))
            return true

         if (fs .existsSync (url .fileURLToPath (fileURL)))
            return true

         // Delete keys of deleted file.

         const hash = `.${md5 (fileURL)}.`

         for (const key of Object .keys (config) .filter (key => key .includes (hash)))
            config [key] = undefined

         return false
      })

      if (openTabs .length)
         this .openTabs (openTabs, false)

      if (this .tabs .getTabs () .length)
      {
         const tab = this .getTabByURL (activeTab) ?? this .tabs .getTabByPosition (0)

         tab .activate ()
      }
      else
      {
         this .openTabs ()
      }
   }

   openTabs (urls = [""], activate = true)
   {
      if (!urls .length)
         return

      const src = url .pathToFileURL (path .join (__dirname, "../../html/document.html"))

      for (let fileURL of urls)
      {
         if (fileURL && this .tabs .getTabs () .some (tab => tab .url === fileURL))
            continue

         if (!fileURL) fileURL = `id:${md5 (Math .random ())}`

         src .searchParams .set ("url", fileURL)

         const tab = this .tabs .addTab ({
            src: src,
            webviewAttributes: {
               preload: "document.js",
               nodeIntegration: true,
               webpreferences: "contextIsolation=false",
            },
            visible: true,
            active: false,
         })

         this .setTabURL (tab, fileURL)

         tab .webview .addEventListener ("console-message", (event) =>
         {
            tab .webview .send ("console-message", event .level, event .sourceId, event .line, event .message)
         })

         tab .on ("closing", (tab, abort) => this .tabClosing (tab, abort))
         tab .on ("close", (tab) => this .tabClose (tab))

         tab .webview .addEventListener ("ipc-message", (event, value) =>
         {
            if (event .channel !== "saved")
               return

            this .setTabURL (tab, tab .url, ...event .args)
         })

         tab .webview .addEventListener ("dom-ready", () =>
         {
            // Workaround for focus issue with webview.
            tab .webview .focus ()
            window .blur ()
            window .focus ()

            tab .domReady = true

            if (this .tabs .getActiveTab () === tab)
               tab .webview .send ("activate")
         })
      }

      if (activate)
      {
         const tab = this .getTabs () .find (tab => urls .includes (tab .url))
            ?? this .tabs .getTabByPosition (this .tabs .getTabs () .length - 1)

         tab .activate ()
      }

      this .saveTabs ()
   }

   getTabs ()
   {
      const cmp  = (a, b) => (a > b) - (a < b)

      return this .tabs .getTabs ()
         .sort ((a, b) => cmp (a .getPosition (), b .getPosition ()))
   }

   getTabByURL (fileURL)
   {
      return this .getTabs () .findLast (tab => tab .url === fileURL)
   }

   setTabURL (tab, fileURL, saved = true)
   {
      tab .url = fileURL

      tab .setTitle ((fileURL .startsWith ("id:") ? _ ("New Scene") : path .basename (decodeURIComponent (new URL (fileURL) .pathname))) + (saved ? "" : "*"))

      $(tab .element) .find (".tab-title") .attr ("title", fileURL .startsWith ("id:") ? _ ("Currently still unsaved.") : decodeURI (fileURL))

      this .saveTabs ()
   }

   saveTabs ()
   {
      const
         tabs = this .getTabs (),
         urls = tabs .map (tab => tab .url)

      this .config .openTabs  = urls
      this .config .activeTab = tabs .length ? this .tabs .getActiveTab () .url : undefined
   }

   tabClosing (tab, abort)
   {
      tab .webview .send ("close")

      if (tab !== this .tabs .getActiveTab ())
         return

      const numTabs = this .tabs .getTabs () .length

      if (numTabs === 1)
         return

      const
         position = Math .max (tab .getPosition () - 1, 0),
         nextTab  = this .tabs .getTabByPosition (position)

      nextTab .activate ()
   }

   tabClose (tab)
   {
      // If all tabs are closed, open empty tab.

      if (!this .tabs .getTabs () .length)
         this .openTabs ()

      this .saveTabs ()
   }

   saveFile ()
   {
      this .tabs .getActiveTab () .webview .send ("save-file", true)
   }

   saveFileAs (filePath)
   {
      const
         tab     = this .tabs .getActiveTab (),
         fileURL = url .pathToFileURL (filePath) .href

      this .setTabURL (tab, fileURL)

      tab .webview .send ("save-file-as", filePath)
   }

   saveAllFiles ()
   {
      for (const tab of this .tabs .getTabs ())
         tab .webview .send ("save-file")
   }

   close ()
   {
      this .saveTabs ()

      for (const tab of this .tabs .getTabs ())
         tab .webview .send ("close")
   }

   quit ()
   {
      this .saveTabs ()

      const tabs = this .tabs .getTabs () .filter (tab => tab .initialized)

      let numTabs = tabs .length

      for (const tab of tabs)
      {
         tab .webview .addEventListener ("ipc-message", (event) =>
         {
            if (event .channel !== "closed")
               return

            if (--numTabs)
               return

            window .close ()
         })
      }

      for (const tab of tabs)
         tab .webview .send ("close")

      //this .maintenance ()
   }

   maintenance ()
   {
      // Remove items older than one year, time in milliseconds.
      new DataStorage (localStorage, "Sunrize.") .removeItems (Date .now () - (1000 * 60 * 60 * 24 * 365))
   }

   // Send messages to tabs

   forwardToActiveTab (channel)
   {
      electron .ipcRenderer .on (channel, (event, ...args) => this .tabs .getActiveTab () .webview .send (channel, ...args))
   }

   forwardToAllTabs (channel)
   {
      electron .ipcRenderer .on (channel, (event, ...args) => this .tabs .getTabs () .forEach (tab => tab .webview .send (channel, ...args)))
   }
}
