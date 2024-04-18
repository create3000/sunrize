"use strict";

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool");

class ViewpointTool extends X3DViewpointNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("position")    .addReference (this .node ._position);
      this .tool .getField ("orientation") .addReference (this .node ._orientation);
   }
}

module .exports = ViewpointTool;
