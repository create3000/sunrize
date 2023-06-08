"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   ScreenGroup          = X3D .require ("x_ite/Components/Layout/ScreenGroup")

class ScreenGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .LIME
}

module .exports = ScreenGroupTool
