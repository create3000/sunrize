"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   CollidableShape      = X3D .require ("x_ite/Components/RigidBodyPhysics/CollidableShape")

const
   _set_enabled = Symbol ()

class CollidableShapeTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_RED

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

Object .assign (CollidableShape .prototype,
{
   createTool: function ()
   {
      return new CollidableShapeTool (this)
   },
})
