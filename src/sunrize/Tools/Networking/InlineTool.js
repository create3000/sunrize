"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class InlineTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .WHITE
}

module .exports = InlineTool
