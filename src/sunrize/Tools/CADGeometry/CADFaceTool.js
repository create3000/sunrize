"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class CADFaceTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .BROWN
}

module .exports = CADFaceTool
