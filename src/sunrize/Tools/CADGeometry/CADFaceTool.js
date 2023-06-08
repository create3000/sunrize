"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   CADFace              = X3D .require ("x_ite/Components/CADGeometry/CADFace")

class CADFaceTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .BROWN
}

module .exports = CADFaceTool
