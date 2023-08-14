"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class SwitchTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .YELLOW
}

module .exports = SwitchTool
