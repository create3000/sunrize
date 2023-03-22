"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   Billboard            = X3D .require ("x_ite/Components/Navigation/Billboard")

class BillboardTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .PINK

   async initialize ()
   {
      await super .initialize ()

      this .node ._axisOfRotation .addFieldInterest (this .tool .axisOfRotation)

      this .tool .centerDisplay  = true
      this .tool .axisOfRotation = this .node ._axisOfRotation
   }

   removeTool ()
   {
      super .removeTool ()

      this .node ._axisOfRotation .removeFieldInterest (this .tool .axisOfRotation)
   }
}

Object .assign (Billboard .prototype,
{
   createTool: function ()
   {
      return new BillboardTool (this)
   },
})
