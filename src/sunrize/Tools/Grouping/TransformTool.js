"use strict"

const
   X3DTransformNodeTool = require ("./X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors")

class TransformTool extends X3DTransformNodeTool
{
   toolBBoxColor = ToolColors .GREEN
}

module .exports = TransformTool
