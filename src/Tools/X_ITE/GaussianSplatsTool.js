"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class GaussianSplatsTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .VIOLET;
}

module .exports = GaussianSplatsTool;
