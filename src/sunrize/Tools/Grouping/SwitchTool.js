"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class SwitchTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .YELLOW
}

module .exports = SwitchTool
