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

      this .node ._enabled .addInterest (_set_enabled, this .target)

      this [_set_enabled] ()
   }

   [_set_enabled] ()
   {
      this .tool .bboxStyle = this .node ._enabled .getValue () ? 1 : 2
   }

   removeTool ()
   {
      this .node ._enabled .removeInterest (_set_enabled, this .target)

      return super .removeTool ()
   }
}

Object .assign (Collision .prototype,
{
   createTool: function ()
   {
      return new CollisionTool (this)
   },
})
