"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DTransformNodeTool extends X3DChildNodeTool
{
   async initialize ()
   {
      await super .initialize (__dirname, "X3DTransformNodeTool.x3d");

      this .getBrowser () .displayEvents () .addInterest ("reshape", this);

      this .tool .getField ("isActive") .addInterest ("set_active", this);

      this .tool .getField ("translation")      .addReference (this .toolNode ._translation);
      this .tool .getField ("rotation")         .addReference (this .toolNode ._rotation);
      this .tool .getField ("scale")            .addReference (this .toolNode ._scale);
      this .tool .getField ("scaleOrientation") .addReference (this .toolNode ._scaleOrientation);
      this .tool .getField ("center")           .addReference (this .toolNode ._center);

      this .tool .centerDisplay = false;
      this .tool .bboxDisplay   = true;
      this .tool .bboxColor     = this .toolBBoxColor;
   }

   removeTool ()
   {
      this .getBrowser () .displayEvents () .removeInterest ("reshape", this);

      return super .removeTool ();
   }

   set_active (active)
   {
      if (active .getValue ())
      {

      }
      else
      {

      }
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
