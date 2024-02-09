"use strict";

const X3DGridNodeTool = require ("./X3DGridNodeTool");

class AxonometricGridTool extends X3DGridNodeTool
{
   constructor (browser)
   {
      super (browser);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "AxonometricGridTool.x3d");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }
}

module .exports = AxonometricGridTool;
