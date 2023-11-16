"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DTransformNodeTool extends X3DChildNodeTool
{
   async initialize ()
   {
      await super .initialize (__dirname, "X3DTransformNodeTool.x3d");

      this .toolNode .getBrowser () .displayEvents () .addInterest ("reshape", this);

      // this .tool .centerDisplay = true;
      this .tool .bboxDisplay   = true;
      this .tool .bboxColor     = this .toolBBoxColor;
   }

   removeTool ()
   {
      this .toolNode .getBrowser () .displayEvents () .removeInterest ("reshape", this);

      return super .removeTool ();
   }

   static box = new X3D .Box3 ();

   reshape ()
   {
      const
         bbox       = this .toolNode .getBBox (X3DTransformNodeTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center;

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize;

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter;
   }
}

module .exports = X3DTransformNodeTool
