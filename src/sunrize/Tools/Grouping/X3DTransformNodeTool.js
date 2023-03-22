"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D"),
   Box3        = X3D .require ("standard/Math/Geometry/Box3")

class X3DTransformNodeTool extends X3DNodeTool
{
   async initialize ()
   {
      super .initialize ();

      await this .load (__dirname, "X3DBoundedObjectTool.x3d")

      this .node .getBrowser () .displayEvents () .addInterest ("reshape", this)

      this .tool .bboxColor = this .bboxColor
   }

   static box = new Box3 ()

   reshape ()
   {
      const
         bbox       = this .node .getBBox (X3DTransformNodeTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter
   }

   traverse (type, renderObject)
   {
      this .node .traverse (type, renderObject)
      this .innerNode?.traverse (type, renderObject)
   }
}

module .exports = X3DTransformNodeTool
