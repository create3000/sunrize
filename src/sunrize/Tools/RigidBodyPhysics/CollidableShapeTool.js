"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

const
   _set_enabled = Symbol ()

class CollidableShapeTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_RED

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._enabled .addInterest (_set_enabled, this .toolTarget)

      this [_set_enabled] ()
   }

   removeTool ()
   {
      this .toolNode ._enabled .removeInterest (_set_enabled, this .toolTarget)

      return super .removeTool ()
   }

   [_set_enabled] ()
   {
      this .tool .bboxStyle = this .toolNode ._enabled .getValue () ? 1 : 2
   }
}

module .exports = CollidableShapeTool
