"use strict"

const
   X3DEnvironmentalSensorNodeTool = require ("./X3DEnvironmentalSensorNodeTool"),
   ToolColors                     = require ("../Core/ToolColors")

class VisibilitySensorTool extends X3DEnvironmentalSensorNodeTool
{
   boxColor = ToolColors .VISIBILITY_SENSOR
}

module .exports = VisibilitySensorTool
