"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DChildNodeTool extends X3DNodeTool
{
   getMustDisplay ()
   {
      return true;
   }

   async initializeTool (... args)
   {
      await super .loadTool (... args);
   }
}

module .exports = X3DChildNodeTool;
