"use strict";

const
   X3DEnvironmentalSensorNodeTool = require ("../EnvironmentalSensor/X3DEnvironmentalSensorNodeTool"),
   ToolColors                     = require ("../Core/ToolColors");

class ViewpointGroupTool extends X3DEnvironmentalSensorNodeTool
{
   static createOnSelection = true;

   toolBoxColor = ToolColors .PROXIMITY_SENSOR;
}

module .exports = ViewpointGroupTool;
