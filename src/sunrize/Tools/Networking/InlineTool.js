"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Inline               = X3D .require ("x_ite/Components/Networking/Inline")

class InlineTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .WHITE
}

module .exports = InlineTool
