"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class LayoutGroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_GREEN
}

module .exports = LayoutGroupTool
