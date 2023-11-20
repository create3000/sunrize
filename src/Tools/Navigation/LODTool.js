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

      this .tool .getField ("center") .addReference (this .node ._center);

      this .tool .centerDisplay = true;
   }
}

module .exports = LODTool;
