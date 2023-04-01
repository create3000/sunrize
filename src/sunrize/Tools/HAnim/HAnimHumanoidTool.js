"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   HAnimHumanoid        = X3D .require ("x_ite/Components/HAnim/HAnimHumanoid")

class HAnimHumanoidTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

Object .assign (HAnimHumanoid .prototype,
{
   addTool: function ()
   {
      return new HAnimHumanoidTool (this)
   },
})
