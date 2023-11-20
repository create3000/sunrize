"use strict";

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool");

class ViewpointTool extends X3DViewpointNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("position") .addReference (this .node ._position);
   }
}

module .exports = ViewpointTool;
