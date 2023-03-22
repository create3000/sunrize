"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Switch               = X3D .require ("x_ite/Components/Grouping/Switch")

class SwitchTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .YELLOW
}

Object .assign (Switch .prototype,
{
   createTool: function ()
   {
      return new SwitchTool (this)
   },
})
