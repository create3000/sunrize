"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class InstancedShapeTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .ORANGE;
}

module .exports = InstancedShapeTool;
