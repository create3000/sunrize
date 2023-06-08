"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Anchor               = X3D .require ("x_ite/Components/Networking/Anchor")

class AnchorTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .LILA
}

module .exports = AnchorTool
