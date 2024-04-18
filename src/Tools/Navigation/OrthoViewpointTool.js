"use strict";

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool");

class OrthoViewpointTool extends X3DViewpointNodeTool
{
   toolType = 1;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("position")    .addReference (this .node ._position);
      this .tool .getField ("orientation") .addReference (this .node ._orientation);
   }
}

module .exports = OrthoViewpointTool;
