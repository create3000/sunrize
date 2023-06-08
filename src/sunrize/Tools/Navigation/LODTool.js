"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class LODTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .CYAN

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._center .addFieldInterest (this .tool .center)

      this .tool .centerDisplay = true
      this .tool .center        = this .toolNode ._center
   }

   removeTool ()
   {
      this .toolNode ._center .removeFieldInterest (this .tool .center)

      return super .removeTool ()
   }
}

module .exports = LODTool
