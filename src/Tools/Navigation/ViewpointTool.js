"use strict";

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool");

class ViewpointTool extends X3DViewpointNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getValue () .getField ("position")    .addReference (this .node ._position);
      this .tool .getValue () .getField ("orientation") .addReference (this .node ._orientation);
   }
}

module .exports = ViewpointTool;
