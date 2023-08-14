"use strict"

const
   X3DEnvironmentalSensorNodeTool = require ("./X3DEnvironmentalSensorNodeTool"),
   ToolColors                     = require ("../Core/ToolColors")

class ProximitySensorTool extends X3DEnvironmentalSensorNodeTool
{
   boxColor = ToolColors .PROXIMITY_SENSOR
}

module .exports = ProximitySensorTool
