"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class DirectionalLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("direction") .addReference (this .node ._direction);

      this .tool .type = 0;
   }
}

module .exports = DirectionalLightTool;
