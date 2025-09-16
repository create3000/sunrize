"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   Splitter  = require ("../Controls/Splitter"),
   NodeList  = require ("./NodeList"),
   _         = require ("../Application/GetText");

require ("../Controls/RenameNodeInput");

module .exports = class AnimationEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`);

      this .animationEditor = element;

      this .toolbar = $("<div></div>")
         .attr ("id", "animation-editor-toolbar")
         .addClass (["animation-editor-toolbar", "toolbar", "horizontal-toolbar"])
         .appendTo (this .animationEditor);

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-content")
         .addClass (["animation-editor-content", "vertical-splitter"])
         .appendTo (this .animationEditor);

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter);

      this .verticalSplitterRight = $("<div></div>")
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .appendTo (this .verticalSplitter);

      this .vSplitter = new Splitter (this .verticalSplitter, "vertical");

      this .verticalSplitter .on ("position", () => this .onSplitterPosition ());

      // Animations List

      this .animations = $("<div></div>")
         .addClass ("animations")
         .appendTo (this .verticalSplitterLeft);

      this .nodeListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .animations);

      this .nodeName = $("<input></input>")
         .addClass ("node-name")
         .attr ("placeholder", _("Enter node name."))
         .appendTo (this .animations)
         .renameNodeInput (null, null);

      this .nodeList = new NodeList (this .nodeListElement, node => node .getTypeName () === "Group" && node ._metadata .name === "Animation", node => this .setNode (node));

      this .setup ();
   }

   onSplitterPosition ()
   {
      if (this .vSplitter .position)
         this .toggleSidebarButton .addClass ("active");
      else
         this .toggleSidebarButton .removeClass ("active");
   }

   setNode (node)
   {
      this .node = node;

      if (this .node)
      {
         this .nodeName .renameNodeInput (this .node);
      }
      else
      {
         this .nodeName .renameNodeInput (null, null);
      }
   }
}
