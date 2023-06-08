"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors")

class HAnimHumanoidTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

module .exports = HAnimHumanoidTool
