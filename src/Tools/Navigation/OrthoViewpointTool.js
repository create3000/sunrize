"use strict";

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool");

class OrthoViewpointTool extends X3DViewpointNodeTool
{
   toolType = 1;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("position") .addReference (this .node ._position);
   }
}

module .exports = OrthoViewpointTool;
