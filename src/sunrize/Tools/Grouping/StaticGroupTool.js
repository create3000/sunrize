"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   StaticGroup          = X3D .require ("x_ite/Components/Grouping/StaticGroup")

class StaticGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREY
}

Object .assign (StaticGroup .prototype,
{
   addTool: function ()
   {
      return new StaticGroupTool (this)
   },
})
