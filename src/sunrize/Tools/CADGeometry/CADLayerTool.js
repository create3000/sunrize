"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class CADLayerTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_YELLOW
}

module .exports = CADLayerTool
