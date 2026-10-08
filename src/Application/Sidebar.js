"use strict";

const
   Tabs = require ("../Controls/Tabs"),
   _    = require ("./GetText");

module .exports = class Sidebar extends Tabs
{
   constructor (element)
   {
      super (element, "bottom");

      this .setup ();
   }

   addTabs ()
   {
      // if (process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT")
      //    this .addIconTab ("file-manager", "description", _("File Manager"));

      this .addIconTab ("outline-editor", "list", _("Outline Editor"));

      this .activateTab (0);
   }

   configure ()
   {
      super .configure ({ active: 1 });
   }

   initTab (panel)
   {
      switch (panel .attr ("id"))
      {
         case "file-manager":
         {
            const FileManager = require ("../Editors/FileManager");

            this .fileManger = new FileManager (panel);
            break;
         }
         case "outline-editor":
         {
            const OutlineEditor = require ("../Editors/OutlineEditor");

            this .outlineEditor = new OutlineEditor (this .getPanel ("outline-editor"));
            break;
         }
         case "node-inspector":
         {
            const NodeInspector = require ("../Editors/NodeInspector");

            this .nodeInspector = new NodeInspector (panel);
            break;
         }
      }
   }
};

