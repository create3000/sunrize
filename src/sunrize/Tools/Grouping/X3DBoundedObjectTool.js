"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D"),
   Box3        = X3D .require ("standard/Math/Geometry/Box3")

class X3DBoundedObjectTool extends X3DNodeTool
{
   async initialize ()
   {
      super .initialize ()

      await this .loadTool (__dirname, "X3DBoundedObjectTool.x3d")

      this .toolNode .getBrowser () .displayEvents () .addInterest ("reshape", this .toolTarget)

      this .tool .bboxColor = this .bboxColor
   }

   removeTool ()
   {
      this .toolNode .getBrowser () .displayEvents () .removeInterest ("reshape", this .toolTarget)

      return super .removeTool ()
   }

   static box = new Box3 ()

   reshape ()
   {
      const
         bbox       = this .toolNode .getBBox (X3DBoundedObjectTool .box),
         bboxSize   = bbox .size,
         bboxCenter = bbox .center

      if (!this .tool .bboxSize .getValue () .equals (bboxSize))
         this .tool .bboxSize = bboxSize

      if (!this .tool .bboxCenter .getValue () .equals (bboxCenter))
         this .tool .bboxCenter = bboxCenter
   }

   traverse (type, renderObject)
   {
      this .toolNode .traverse (type, renderObject)

      renderObject .getHumanoids () .push (null)

      this .toolInnerNode ?.traverse (type, renderObject)

      renderObject .getHumanoids () .pop ()
   }
}

module .exports = X3DBoundedObjectTool
