"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class HAnimSegmentTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

module .exports = HAnimSegmentTool
