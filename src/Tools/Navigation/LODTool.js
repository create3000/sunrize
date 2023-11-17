"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class LODTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .CYAN;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .node ._center .addFieldInterest (this .tool .getField ("center"));

      this .tool .centerDisplay = true;
      this .tool .center        = this .node ._center;
   }

   disposeTool ()
   {
      this .node ._center .removeFieldInterest (this .tool .center);
   }
}

module .exports = LODTool;
