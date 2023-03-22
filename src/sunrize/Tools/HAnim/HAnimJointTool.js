"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   HAnimJoint           = X3D .require ("x_ite/Components/HAnim/HAnimJoint")

class HAnimJointTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

Object .assign (HAnimJoint .prototype,
{
   createTool: function ()
   {
      return new HAnimJointTool (this)
   },
})
