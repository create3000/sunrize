"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class LODTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .CYAN

   async initialize ()
   {
      await super .initialize ()

      this .node ._center .addFieldInterest (this .tool .getField ("center"))

      this .tool .centerDisplay = true
      this .tool .center        = this .node ._center
   }

   removeTool ()
   {
      this .node ._center .removeFieldInterest (this .tool .center)

      return super .removeTool ()
   }
}

module .exports = LODTool
