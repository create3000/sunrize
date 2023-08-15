"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class X3DVolumeDataNodeTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_ORANGE
}

module .exports = X3DVolumeDataNodeTool
