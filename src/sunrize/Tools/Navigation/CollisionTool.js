"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Collision            = X3D .require ("x_ite/Components/Navigation/Collision")

const
   _set_enabled = Symbol ()

class CollisionTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .RED

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

module .exports = CollisionTool
