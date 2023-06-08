"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Shape                = X3D .require ("x_ite/Components/Shape/Shape")

class ShapeTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ORANGE
}

module .exports = ShapeTool
