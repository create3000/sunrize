"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class GeoTransformTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .GREEN;
}

module .exports = GeoTransformTool;
