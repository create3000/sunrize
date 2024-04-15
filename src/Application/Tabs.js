"use strict";

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
   _           = require ("./GetText");

module .exports = new class Tabs
{
   // Construction

   config = new DataStorage (localStorage, "Sunrize.Application.");

   constructor ()
   {
      this .tabs = $("tab-group") .get (0);

      this .config .setDefaultValues ({
         openTabs: [ ],
         scrollLeft: 0,
      });

      $(() => this .initialize ());
   }

   initialize ()
   {
      this .tabs .on ("tab-active", tab =>
      {
         electron .ipcRenderer .send ("title", tab .getTitle ());
         electron .ipcRenderer .send ("current-file", tab .url);

         tab .initialized = true;

         if (tab .domReady)
            tab .webview .send ("activate");

         this .saveTabs ();
      });

      this .tabs .on ("tab-removed", (tab) => this .saveTabs ());

      // Actions

      electron .ipcRenderer .on ("open-files",     (event, urls)     => this .openTabs (urls));
      electron .ipcRenderer .on ("reload"        , (event)           => this .reloadTab ());
      electron .ipcRenderer .on ("save-file",      (event)           => this .saveFile ());
      electron .ipcRenderer .on ("save-file-as",   (event, filePath) => this .saveFileAs (filePath));
      electron .ipcRenderer .on ("save-all-files", (event)           => this .saveAllFiles ());
      electron .ipcRenderer .on ("close",          (event)           => this .tabs .getActiveTab () ?.close (true));
      electron .ipcRenderer .on ("quit",           (event)           => this .quit ());

      electron .ipcRenderer .on ("toggle-developer-tools", (event) => this .tabs .getActiveTab () .webview .openDevTools ());

      $(window) .on ("beforeunload", () => this .close ());

      // Forward Actions

      this .forwardToAllTabs ("auto-save");
      this .forwardToActiveTab ("export-as");

      this .forwardToActiveTab ("scene-properties");
      this .forwardToActiveTab ("save-copy-as");
      this .forwardToActiveTab ("scene-properties");

      this .forwardToActiveTab ("undo");
      this .forwardToActiveTab ("redo");
      this .forwardToActiveTab ("delete");

      this .forwardToActiveTab ("select-all");
      this .forwardToActiveTab ("deselect-all");
      this .forwardToActiveTab ("hide-unselected-objects");
      this .forwardToActiveTab ("show-selected-objects");
      this .forwardToActiveTab ("show-all-objects");
      this .forwardToActiveTab ("transform-to-zero");
      this .forwardToActiveTab ("remove-empty-groups");

      this .forwardToAllTabs ("expand-extern-proto-declarations");
      this .forwardToAllTabs ("expand-prototype-instances");
      this .forwardToAllTabs ("expand-inline-nodes");

      this .forwardToActiveTab ("primitive-quality");
      this .forwardToActiveTab ("texture-quality");
      this .forwardToActiveTab ("display-rubberband");
      this .forwardToActiveTab ("display-timings");
      this .forwardToActiveTab ("show-library");

      this .forwardToActiveTab ("browser-frame");
      this .forwardToActiveTab ("grid-tool");
      this .forwardToActiveTab ("grid-options");
      this .forwardToActiveTab ("activate-snap-target");
      this .forwardToActiveTab ("activate-snap-source");
      this .forwardToActiveTab ("center-snap-target-in-selection");
      this .forwardToActiveTab ("move-selection-to-snap-target");
      this .forwardToActiveTab ("move-selection-center-to-snap-target");

      this .forwardToActiveTab ("script-editor");
      this .forwardToActiveTab ("outline-editor");

      // Restore tabs.
      this .restoreTabs (this .config .activeTab);
   }

   // Tab handling

   restoreTabs (activeTab)
   {
      const config = new DataStorage (localStorage, "Sunrize.");

      const openTabs = this .config .openTabs .filter (fileURL =>
      {
         if (!fileURL .startsWith ("file:"))
            return true;

         if (fs .existsSync (url .fileURLToPath (fileURL)))
            return true;

         // Delete keys of deleted file.

         const hash = `.${md5 (fileURL)}.`;

         for (const key of Object .keys (config) .filter (key => key .includes (hash)))
            config [key] = undefined;

         return false;
      })

      for (const fileURL of openTabs .filter (fileURL => !fileURL .startsWith ("id:")))
      {
         if (fileURL .startsWith ("file:"))
            electron .ipcRenderer .send ("add-recent-document", url .fileURLToPath (fileURL));
         else
            electron .ipcRenderer .send ("add-recent-location", fileURL);
      }

      if (openTabs .length)
         this .openTabs (openTabs, false);

      if (this .tabs .getTabs () .length)
      {
         const tab = this .getTabByURL (activeTab) ?? this .tabs .getTabByPosition (0);

         tab .activate ();
      }
      else
      {
         this .openTabs ();
      }
   }

   openTabs (urls = [""], activate = true)
   {
      if (!urls .length)
         return;

      const src = url .pathToFileURL (path .join (__dirname, "../assets/html/window.html"));

      for (let fileURL of urls)
      {
         if (fileURL && this .tabs .getTabs () .some (tab => tab .url === fileURL))
            continue;

         if (!fileURL)
            fileURL = `id:${md5 (Math .random ())}`;

         src .searchParams .set ("url", fileURL);

         const tab = this .tabs .addTab ({
            src: src,
            webviewAttributes: {
               preload: "window.js",
               nodeIntegration: true,
               webpreferences: "contextIsolation=false",
            },
            visible: true,
            active: false,
         });

         this .setTabURL (tab, fileURL);

         tab .webview .addEventListener ("console-message", (event) =>
         {
            tab .webview .send ("console-message", event .level, event .sourceId, event .line, event .message);
         });

         tab .on ("closing", (tab, abort) => this .tabClosing (tab, abort));
         tab .on ("close", (tab) => this .tabClose (tab));

         tab .webview .addEventListener ("ipc-message", (event, value) =>
         {
            switch (event .channel)
            {
               case "focus":
               {
                  document .activeElement ?.blur ();
                  this .tabs .getActiveTab () ?.webview .focus ();
                  break;
               }
               case "saved":
               {
                  this .setTabURL (tab, tab .url, ... event .args);
                  break;
               }
            }
         });

         tab .webview .addEventListener ("dom-ready", () =>
         {
            tab .domReady = true;

            if (this .tabs .getActiveTab () === tab)
               tab .webview .send ("activate");
         });
      }

      if (activate)
      {
         const tab = this .getTabs () .find (tab => urls .includes (tab .url))
            ?? this .tabs .getTabByPosition (this .tabs .getTabs () .length - 1)

         tab .activate ();
      }

      this .saveTabs ();
   }

   reloadTab ()
   {
      const
         tab = this .tabs .getActiveTab (),
         src = url .pathToFileURL (path .join (__dirname, "../assets/html/window.html"));

      src .searchParams .set ("url", tab .url);

      tab .webview .src = src;

      this .setTabURL (tab, tab .url, true);
   }

   getTabs ()
   {
      const cmp = (a, b) => (a > b) - (a < b);

      return this .tabs .getTabs ()
         .sort ((a, b) => cmp (a .getPosition (), b .getPosition ()));
   }

   getTabByURL (fileURL)
   {
      return this .getTabs () .findLast (tab => tab .url === fileURL);
   }

   setTabURL (tab, fileURL, saved = true)
   {
      tab .url = fileURL;

      tab .setTitle ((fileURL .startsWith ("id:") ? _("New Scene") : path .basename (decodeURIComponent (new URL (fileURL) .pathname))) + (saved ? "" : "*"));

      $(tab .element) .find (".tab-title") .attr ("title", fileURL .startsWith ("id:") ? _("Currently still unsaved.") : decodeURI (fileURL));

      electron .ipcRenderer .send ("title", tab .getTitle ());

      this .saveTabs ();
   }

   saveTabs ()
   {
      const
         tabs = this .getTabs (),
         urls = tabs .map (tab => tab .url);

      this .config .openTabs  = urls;
      this .config .activeTab = tabs .length ? this .tabs .getActiveTab () .url : undefined;
   }

   tabClosing (tab, abort)
   {
      tab .webview .send ("close");

      if (tab !== this .tabs .getActiveTab ())
         return;

      const numTabs = this .tabs .getTabs () .length;

      if (numTabs === 1)
         return;

      const
         position = Math .max (tab .getPosition () - 1, 0),
         nextTab  = this .tabs .getTabByPosition (position);

      nextTab .activate ();
   }

   tabClose (tab)
   {
      // If all tabs are closed, open empty tab.

      if (!this .tabs .getTabs () .length)
         this .openTabs ();

      this .saveTabs ();
   }

   saveFile ()
   {
      this .tabs .getActiveTab () .webview .send ("save-file", true);
   }

   saveFileAs (filePath)
   {
      const
         tab     = this .tabs .getActiveTab (),
         fileURL = url .pathToFileURL (filePath) .href;

      this .setTabURL (tab, fileURL);

      tab .webview .send ("save-file-as", filePath);
   }

   saveAllFiles ()
   {
      for (const tab of this .tabs .getTabs ())
         tab .webview .send ("save-file");
   }

   close ()
   {
      this .saveTabs ();

      for (const tab of this .tabs .getTabs ())
         tab .webview .send ("close");
   }

   quit ()
   {
      this .saveTabs ();

      const tabs = this .tabs .getTabs () .filter (tab => tab .initialized);

      let numTabs = tabs .length;

      for (const tab of tabs)
      {
         tab .webview .addEventListener ("ipc-message", (event) =>
         {
            if (event .channel !== "closed")
               return;

            if (--numTabs)
               return;

            window .close ();
         });
      }

      for (const tab of tabs)
         tab .webview .send ("close");

      //this .maintenance ();
   }

   maintenance ()
   {
      // Remove items older than one year, time in milliseconds.
      new DataStorage (localStorage, "Sunrize.") .removeItems (Date .now () - (1000 * 60 * 60 * 24 * 365));
   }

   // Send messages to tabs

   forwardToActiveTab (channel)
   {
      electron .ipcRenderer .on (channel, (event, ... args) => this .tabs .getActiveTab () .webview .send (channel, ... args));
   }

   forwardToAllTabs (channel)
   {
      electron .ipcRenderer .on (channel, (event, ... args) => this .tabs .getTabs () .forEach (tab => tab .webview .send (channel, ... args)));
   }
};
