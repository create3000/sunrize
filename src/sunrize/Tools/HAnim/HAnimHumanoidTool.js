"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors")

class HAnimHumanoidTool extends X3DTransformNodeTool
{
   toolBBoxColor = ToolColors .GREEN
}

module .exports = HAnimHumanoidTool
