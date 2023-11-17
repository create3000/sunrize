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

      this .node ._axisOfRotation .addFieldInterest (this .tool .getField ("axisOfRotation"));

      this .tool .centerDisplay  = true;
      this .tool .axisOfRotation = this .node ._axisOfRotation;
   }

   disposeTool ()
   {
      this .node ._axisOfRotation .removeFieldInterest (this .tool .axisOfRotation);
   }
}

module .exports = BillboardTool;
