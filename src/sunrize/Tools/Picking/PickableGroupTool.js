"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   PickableGroup        = X3D .require ("x_ite/Components/Picking/PickableGroup")

class PickableGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ROSE
}

Object .assign (PickableGroup .prototype,
{
   addTool: function ()
   {
      return new PickableGroupTool (this)
   },
})
