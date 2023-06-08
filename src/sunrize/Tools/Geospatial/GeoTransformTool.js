"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class GeoTransformTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .GREEN
}

module .exports = GeoTransformTool
