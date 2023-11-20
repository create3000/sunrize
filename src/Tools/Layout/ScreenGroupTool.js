"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class ScreenGroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .LIME;
}

module .exports = ScreenGroupTool;
