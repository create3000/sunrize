"use strict";

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors");

class BillboardTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .PINK;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("axisOfRotation") .addReference (this .node ._axisOfRotation);

      this .tool .centerDisplay = true;
   }
}

module .exports = BillboardTool;
