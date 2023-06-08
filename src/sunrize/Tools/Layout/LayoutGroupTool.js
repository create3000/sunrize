"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   LayoutGroup          = X3D .require ("x_ite/Components/Layout/LayoutGroup"),
   Vector3              = X3D .require ("standard/Math/Numbers/Vector3"),
   Box3                 = X3D .require ("standard/Math/Geometry/Box3")

class LayoutGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

module .exports = LayoutGroupToolTool
