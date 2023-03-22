"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   CADPart              = X3D .require ("x_ite/Components/CADGeometry/CADPart")

class CADPartTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

Object .assign (CADPart .prototype,
{
   createTool: function ()
   {
      return new CADPartTool (this)
   },
})
