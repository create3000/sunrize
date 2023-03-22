"use strict"

const
   OutlineEditor = require ("../Editors/OutlineEditor"),
   Tabs          = require ("../Controls/Tabs")

module .exports = class Sidebar extends Tabs
{
   constructor (element)
   {
      super (element, "bottom")

      this .setup ()
   }

   addTabs ()
   {
      this .addIconTab ("file-manager",   "description", "File Manager")
      this .addIconTab ("outline-editor", "list",        "Outline Editor")
      this .addIconTab ("node-inspector", "visibility",  "Node Inspector")

      this .outlineEditor = new OutlineEditor (this .getPanel ("outline-editor"))
   }

   configure ()
   {
      super .configure ({ active: 1 })
   }

   initTab (panel)
   {
      switch (panel .attr ("id"))
      {
         case "file-manager":
         {
            const FileManager = require ("../Editors/FileManager")

            this .fileManger = new FileManager (panel)
            break
         }
         case "node-inspector":
         {
            const NodeInspector = require ("../Editors/NodeInspector")

            this .nodeInspector = new NodeInspector (panel)
            break
         }
      }
   }
}

