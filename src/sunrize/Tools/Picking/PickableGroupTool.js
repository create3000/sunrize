"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class PickableGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ROSE
}

module .exports = PickableGroupTool
