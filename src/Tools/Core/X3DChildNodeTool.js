"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DChildNodeTool extends X3DNodeTool
{
   isRenderingRequired ()
   {
      return true;
   }

   async initializeTool (... args)
   {
      await super .loadTool ("tool", ... args);
   }
}

module .exports = X3DChildNodeTool;
