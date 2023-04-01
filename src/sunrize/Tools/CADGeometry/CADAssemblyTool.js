"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   CADAssembly          = X3D .require ("x_ite/Components/CADGeometry/CADAssembly")

class CADAssemblyTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

Object .assign (CADAssembly .prototype,
{
   addTool: function ()
   {
      return new CADAssemblyTool (this)
   },
})
