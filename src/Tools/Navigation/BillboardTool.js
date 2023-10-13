"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class BillboardTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .PINK

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._axisOfRotation .addFieldInterest (this .tool .getField ("axisOfRotation"))

      this .tool .centerDisplay  = true
      this .tool .axisOfRotation = this .toolNode ._axisOfRotation
   }

   removeTool ()
   {
      this .toolNode ._axisOfRotation .removeFieldInterest (this .tool .axisOfRotation)

      return super .removeTool ()
   }
}

module .exports = BillboardTool
