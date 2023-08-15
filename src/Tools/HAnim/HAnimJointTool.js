"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors")

class HAnimJointTool extends X3DTransformNodeTool
{
   toolBBoxColor = ToolColors .GREEN
}

module .exports = HAnimJointTool
