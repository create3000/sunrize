"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DBoundedObjectTool extends X3DChildNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DBoundedObjectTool.x3d");

      this .getBrowser () .displayEvents () .addInterest ("reshapeTool", this);

      this .tool .bboxDisplay = true;
      this .tool .bboxColor   = this .toolBBoxColor;
   }

   disposeTool ()
   {
      this .getBrowser () .displayEvents () .removeInterest ("reshapeTool", this);

      super .disposeTool ();
   }

   static #box = new X3D .Box3 ();

   reshapeTool ()
   {
      if (!this .tool)
         return console .warn ("reshapeTool called, although already disposed.", this .getBrowser () .displayEvents () .hasInterest ("reshapeTool", this));

      const
         bbox       = this .node .getBBox (X3DBoundedObjectTool .#box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }
}

module .exports = X3DBoundedObjectTool;
