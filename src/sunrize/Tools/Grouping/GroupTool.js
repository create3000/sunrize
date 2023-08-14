"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class GroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_GREEN
}

module .exports = GroupTool
