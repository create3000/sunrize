"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DBoundedObjectTool extends X3DChildNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DBoundedObjectTool.x3d");

      this .getBrowser () .displayEvents () .addInterest ("reshape", this);

      this .tool .bboxDisplay = true;
      this .tool .bboxColor   = this .toolBBoxColor;
   }

   disposeTool ()
   {
      this .getBrowser () .displayEvents () .removeInterest ("reshape", this);
   }

   static box = new X3D .Box3 ();

   reshape ()
   {
      const
         bbox       = this .node .getBBox (X3DBoundedObjectTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }
}

module .exports = X3DBoundedObjectTool;
