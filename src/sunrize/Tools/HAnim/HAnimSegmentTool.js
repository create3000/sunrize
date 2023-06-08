"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   HAnimSegment         = X3D .require ("x_ite/Components/HAnim/HAnimSegment")

class HAnimSegmentTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

module .exports = HAnimSegmentTool
