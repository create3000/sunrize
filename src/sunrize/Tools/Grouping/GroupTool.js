"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Group                = X3D .require ("x_ite/Components/Grouping/Group")

class GroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

module .exports = GroupTool
