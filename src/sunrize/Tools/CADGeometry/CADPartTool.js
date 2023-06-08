"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors")

class CADPartTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

module .exports = CADPartTool
