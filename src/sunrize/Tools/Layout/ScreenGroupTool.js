"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class ScreenGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .LIME
}

module .exports = ScreenGroupTool
