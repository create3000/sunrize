"use strict"

const
   X3DTransformNodeTool = require ("./X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Transform            = X3D .require ("x_ite/Components/Grouping/Transform")

class TransformTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

Object .assign (Transform .prototype,
{
   createTool: function ()
   {
      return new TransformTool (this)
   },
})
