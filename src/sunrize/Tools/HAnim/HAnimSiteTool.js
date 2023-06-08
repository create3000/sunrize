"use strict"

const
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   HAnimSite            = X3D .require ("x_ite/Components/HAnim/HAnimSite")

class HAnimSiteTool extends X3DTransformNodeTool
{
   bboxColor = ToolColors .GREEN
}

module .exports = HAnimSiteTool
