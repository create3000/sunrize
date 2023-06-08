"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class ShapeTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ORANGE
}

module .exports = ShapeTool
