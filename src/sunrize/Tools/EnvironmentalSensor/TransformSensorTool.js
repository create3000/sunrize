"use strict"

const
   X3DEnvironmentalSensorNodeTool = require ("./X3DEnvironmentalSensorNodeTool"),
   ToolColors                     = require ("../Core/ToolColors")

class TransformSensorTool extends X3DEnvironmentalSensorNodeTool
{
   toolBoxColor = ToolColors .TRANSFORM_SENSOR
}

module .exports = TransformSensorTool
