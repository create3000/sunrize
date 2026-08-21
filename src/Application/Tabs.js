"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   DataStorage = require ("./DataStorage"),
   url         = require ("url"),
   path        = require ("path"),
   fs          = require ("fs"),
   md5         = require ("md5"),
   _           = require ("./GetText");

require ("electron-tabs");
require ("./CSS");

module .exports = new class Tabs
{
   // Construction

   config = new DataStorage (localStorage, "Sunrize.Application.");

   icons = new Map ([
      ["UNKNOWN", "../images/seti/default.svg"],
      ["OTHERS", "../images/seti/others.svg"],
      ["XML", "../images/seti/html.svg"],
      ["VRML", "../images/seti/text.svg"],
      ["JSON", "../images/seti/json.svg"],
      ["GLTF", "../images/seti/json.svg"],
      ["IMAGE", "../images/seti/image.svg"],
      ["AUDIO", "../images/seti/audio.svg"],
      ["VIDEO", "../images/seti/video.svg"],
      ["SVG", "../images/seti/svg.svg"],
   ]);

   constructor ()
   {
      this .tabs = $("tab-group") .get (0);

      this .config .setDefaultValues ({
         openTabs: [ ],
         scrollLeft: 0,
      });

      // Reset closed tabs.
      this .config .closedTabs = [ ];

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

      this .tabs .on ("tab-removed", () => this .saveTabs ());

      // Actions

      electron .ipcRenderer .on ("tabs-menu", (event, key, ... args) => this [key] (... args));
      electron .ipcRenderer .on ("tabs-menu-will-close", () => this .tabs .getActiveTab () ?.webview .focus ());

      electron .ipcRenderer .on ("open-files",     (event, urls) => this .openTabs (urls));
      electron .ipcRenderer .on ("reload"        , () => this .reloadTab ());
      electron .ipcRenderer .on ("save-file-as",   (event, filePath) => this .saveFileAs (filePath));
      electron .ipcRenderer .on ("save-all-files", () => this .saveAllFiles ());
      electron .ipcRenderer .on ("close-tab",      () => this .tabs .getActiveTab () ?.close (true));
      electron .ipcRenderer .on ("close-all-tabs", () => this .closeAllTabs ());
      electron .ipcRenderer .on ("quit",           () => this .quit ());

      electron .ipcRenderer .on ("toggle-developer-tools", () => this .tabs .getActiveTab () .webview .openDevTools ());

      $(window) .on ("beforeunload", () => this .close ());

      // Forward Actions

      this .forwardToAllTabs ("browser-update");
      this .forwardToAllTabs ("auto-save");
      this .forwardToActiveTab ("export-as");

      this .forwardToActiveTab ("save-file");
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
      this .forwardToActiveTab ("text-compression");
      this .forwardToActiveTab ("color-space");
      this .forwardToActiveTab ("tone-mapping");
      this .forwardToActiveTab ("order-independent-transparency");
      this .forwardToActiveTab ("logarithmic-depth-buffer");
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

      this .forwardToActiveTab ("document");
      this .forwardToActiveTab ("script-editor");
      this .forwardToActiveTab ("animation-members-list");
      this .forwardToActiveTab ("outline-editor");

      // Restore tabs.
      this .restoreTabs (this .config .activeTab);
   }

   // Tab handling

   restoreTabs (activeTab)
   {
      const openTabs = this .config .openTabs .filter (fileURL =>
      {
         if (!fileURL .startsWith ("file:"))
            return true;

         if (fs .existsSync (url .fileURLToPath (fileURL)))
            return true;

         return false;
      });

      for (const fileURL of openTabs .filter (fileURL => !fileURL .startsWith ("id:")))
         electron .ipcRenderer .send ("add-recent-location", fileURL);

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
         // Make Tab URL

         if (fileURL && this .tabs .getTabs () .some (tab => tab .url === fileURL))
            continue;

         if (!fileURL)
            fileURL = `id:${md5 (Math .random ())}`;

         src .searchParams .set ("url", fileURL);

         // Create Tab

         const tab = this .tabs .addTab ({
            src: src,
            webviewAttributes: {
               preload: "window.js",
               nodeIntegration: true,
               webpreferences: "contextIsolation=false",
            },
            visible: true,
            active: false,
            iconURL: this .icons .get ("UNKNOWN"),
         });

         $(tab .element) .attr ("tabindex", 0);

         this .setTabURL (tab, fileURL);

         const config = this .getTabConfig (tab);

         config .setDefaultValues ({
            pinned: false,
         });

         // Tab Context Menu

         $(tab .element) .on ("contextmenu", () => this .showContextMenu (tab));

         // Close Button

         tab .on ("closing", (tab, abort) => this .tabClosing (tab, abort));
         tab .on ("close", (tab) => this .tabClose (tab));

         tab .closeButton = $(tab .element) .find (".tab-close")
            .addClass ("material-symbols-outlined")
            .text ("close")
            .on ("click", () => tab .close (true));

         // Audio Button

         tab .audioButton = $("<span></span>")
            .addClass (["tab-audio", "material-symbols-outlined"])
            .text ("volume_up")
            .on ("click", () => tab .webview .send ("mute", !tab .mute));

         tab .closeButton .before (tab .audioButton);

         // Pin Button

         tab .pinButton = $("<span></span>")
            .addClass ("tab-pin")
            .append ($("<span></span>")
               .addClass ("material-symbols-outlined")
               .text ("keep"));

         tab .closeButton .before (tab .pinButton);

         this .menuPinTab (tab .getPosition (), config .pinned);

         // Events

         tab .webview .addEventListener ("dom-ready", () =>
         {
            tab .domReady = true;

            if (this .tabs .getActiveTab () === tab)
               tab .webview .send ("activate");
         });

         tab .webview .addEventListener ("ipc-message", event =>
         {
            switch (event .channel)
            {
               case "scene-encoding":
               {
                  tab .setIcon (this .icons .get (event .args [0]) ?? this .icons .get ("OTHERS"));
                  break;
               }
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
               case "audio":
               {
                  this .toggleAudio (tab, ... event .args);
                  break;
               }
               case "mute":
               {
                  this .toggleMute (tab, ... event .args);
                  break;
               }
            }
         });

         tab .webview .addEventListener ("console-message", (event) =>
         {
            tab .webview .send ("console-message", event .level, event .sourceId, event .line, event .message);
         });
      }

      if (activate)
      {
         const tab = this .getTabs () .find (tab => urls .includes (tab .url))
            ?? this .tabs .getTabByPosition (this .tabs .getTabs () .length - 1);

         tab .activate ();
      }

      this .saveTabs ();
   }

   // Context Menu

   showContextMenu (tab)
   {
      $(tab .element) .trigger ("focus");

      const menu = [
         {
            label: tab .url .startsWith ("file:") ? _("Copy Path") : _("Copy URL"),
            visible: !tab .url .startsWith ("id:"),
            args: ["menuCopyURL", tab .getPosition ()],
         },
         {
            label: process .platform === "darwin" ? _("Reveal in Finder") : _("Reveal in File Explorer"),
            visible: tab .url .startsWith ("file:"),
            args: ["menuShowItemInFolder", tab .getPosition ()],
         },
         { type: "separator" },
         {
            label: _("Reload Tab"),
            args: ["menuReloadTab", tab .getPosition ()],
         },
         {
            label: tab .pinButton .is (":visible") ? _("Unpin Tab") : _("Pin Tab"),
            args: ["menuPinTab", tab .getPosition ()],
         },
         {
            label: tab .mute ? _("Unmute Tab") : _("Mute Tab"),
            enabled: tab .audioButton .is (":visible"),
            args: ["menuToggleMuteTab", tab .getPosition ()],
         },
         { type: "separator" },
         {
            label: _("Move Tab"),
            submenu: [
               {
                  label: _("Move to Start"),
                  enabled: tab .getPosition () !== 0,
                  args: ["menuMoveTabToStart", tab .getPosition ()],
               },
               {
                  label: _("Move to End"),
                  enabled: tab .getPosition () !== this .getTabs () .length - 1,
                  args: ["menuMoveTabToEnd", tab .getPosition ()],
               },
            ],
         },
         { type: "separator" },
         {
            label: _("Close Tab"),
            args: ["menuCloseTab", tab .getPosition ()],
         },
         {
            label: _("Close Other Tabs"),
            args: ["menuCloseOtherTabs", tab .getPosition ()],
         },
         {
            label: _("Close All"),
            args: ["menuCloseOtherTabs", -1],
         },
         {
            label: _("Reopen Closed Tab"),
            enabled: this .config .closedTabs .length,
            args: ["menuReopenClosedTab"],
         },
      ];

      electron .ipcRenderer .send ("context-menu", "tabs-menu", menu);
   }

   menuCopyURL (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      if (tab .url .startsWith ("file:"))
         navigator .clipboard .writeText (url .fileURLToPath (tab .url));
      else
         navigator .clipboard .writeText (tab .url);
   }

   menuShowItemInFolder (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      electron .shell .showItemInFolder (url .fileURLToPath (tab .url));
   }

   menuReloadTab (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      this .reloadTab (tab);
   }

   menuPinTab (position, pinned)
   {
      const
         tab    = this .tabs .getTabByPosition (position),
         config = this .getTabConfig (tab);

      if (pinned ?? !tab .pinButton .is (":visible"))
      {
         config .pinned = true;

         tab .pinButton .show ();
         tab .closeButton .hide ();
      }
      else
      {
         config .pinned = false;

         tab .pinButton .hide ();
         tab .closeButton .show ();
      }
   }

   menuMoveTabToStart (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      tab .setPosition (0);
   }

   menuMoveTabToEnd (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      tab .setPosition (this .getTabs () .length);
   }

   menuToggleMuteTab (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      tab .webview .send ("mute", !tab .mute);
   }

   menuCloseTab (position)
   {
      const tab = this .tabs .getTabByPosition (position);

      tab .close (true);
   }

   menuCloseOtherTabs (position)
   {
      const
         tabs   = this .getTabs (),
         length = tabs .length;

      for (let i = length - 1; i >= 0; -- i)
      {
         if (i === position)
            continue;

         const tab = this .tabs .getTabByPosition (i);

         if (tab .pinButton .is (":visible"))
            continue;

         tab .close (true);
      }
   }

   menuReopenClosedTab ()
   {
      const
         closedTabs   = this .config .closedTabs,
         closedTabURL = closedTabs .pop ();

      this .config .closedTabs = closedTabs;

      if (closedTabURL .startsWith ("file:"))
      {
         if (!fs .existsSync (url .fileURLToPath (closedTabURL)))
            return this .menuReopenClosedTab (); // Try next.
      }

      if (closedTabURL)
         this .openTabs ([closedTabURL]);
   }

   // Tab Handling

   getTabs ()
   {
      const cmp = (a, b) => (a > b) - (a < b);

      return this .tabs .getTabs ()
         .sort ((a, b) => cmp (a .getPosition (), b .getPosition ()));
   }

   getTabConfig (tab)
   {
      return new DataStorage (localStorage, `Sunrize.Tabs.${md5 (tab .url)}.`);
   }

   reloadTab (tab = this .tabs .getActiveTab ())
   {
      const src = url .pathToFileURL (path .join (__dirname, "../assets/html/window.html"));

      src .searchParams .set ("url", tab .url);

      tab .webview .src = src;

      this .setTabURL (tab, tab .url, true);
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
      electron .ipcRenderer .send ("add-recent-location", fileURL);

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

   toggleAudio (tab, audio)
   {
      if (audio)
         tab .audioButton .show ();
      else
         tab .audioButton .hide ();
   }

   toggleMute (tab, mute)
   {
      tab .mute = mute;

      if (mute)
         tab .audioButton .text ("volume_mute");
      else
         tab .audioButton .text ("volume_up");
   }

   tabClosing (tab)
   {
      tab .webview .send ("close");

      this .menuPinTab (tab .getPosition (), false);

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

      const closedTabs = this .config .closedTabs;

      closedTabs .push (tab .url);

      this .config .closedTabs = closedTabs;

      electron .ipcRenderer .send ("add-recent-location", tab .url);

      if (!this .tabs .getTabs () .length)
         this .openTabs ();

      this .saveTabs ();
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

   closeAllTabs ()
   {
      for (const tab of this .tabs .getTabs ())
      {
         if (tab .pinButton .is (":visible"))
            continue;

         tab .close (true);
      }
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
