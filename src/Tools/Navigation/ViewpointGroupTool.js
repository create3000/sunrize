"use strict";

const
   X3DEnvironmentalSensorNodeTool = require ("../EnvironmentalSensor/X3DEnvironmentalSensorNodeTool"),
   ToolColors                     = require ("../Core/ToolColors");

class ViewpointGroupTool extends X3DEnvironmentalSensorNodeTool
{
   toolBoxColor = ToolColors .PROXIMITY_SENSOR;
}

module .exports = ViewpointGroupTool;
