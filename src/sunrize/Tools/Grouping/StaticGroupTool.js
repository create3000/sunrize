"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class StaticGroupTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_GREY
}

module .exports = StaticGroupTool
