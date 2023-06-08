"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class AnchorTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .LILA
}

module .exports = AnchorTool
