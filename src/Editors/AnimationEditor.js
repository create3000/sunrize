"use strict";

const
   $            = require ("jquery"),
   Interface    = require ("../Application/Interface"),
   Splitter     = require ("../Controls/Splitter");

module .exports = class AnimationEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`);

      this .animationEditor = element;

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-left")
         .addClass (["animation-editor-left", "vertical-splitter"])
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

      this .setup ();
   }

   onSplitterPosition ()
   {
      if (this .vSplitter .position)
         this .toggleSidebarButton .addClass ("active");
      else
         this .toggleSidebarButton .removeClass ("active");
   }
}
