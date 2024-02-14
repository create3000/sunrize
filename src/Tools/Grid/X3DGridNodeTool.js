"use strict";

const X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool");

class X3DGridNodeTool extends X3DActiveLayerNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool (... args)
   {
      await super .initializeTool (... args);

      this .tool .getField ("translation") .setUnit ("length");
   }
}

module .exports = X3DGridNodeTool;
