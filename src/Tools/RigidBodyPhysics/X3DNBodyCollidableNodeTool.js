"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

const
   _set_enabled = Symbol ();

class X3DNBodyCollidableNodeTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_RED;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .node ._enabled .addInterest (_set_enabled, this);
;
      this [_set_enabled] ();
   }

   disposeTool ()
   {
      this .node ._enabled .removeInterest (_set_enabled, this);

      super .disposeTool ();
   }

   [_set_enabled] ()
   {
      this .tool .bboxStyle = this .node ._enabled .getValue () ? 1 : 2;
   }
}

module .exports = X3DNBodyCollidableNodeTool;
