"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   CADLayer             = X3D .require ("x_ite/Components/CADGeometry/CADLayer")

class CADLayerTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_YELLOW
}

Object .assign (CADLayer .prototype,
{
   addTool: function ()
   {
      return new CADLayerTool (this)
   },
})
