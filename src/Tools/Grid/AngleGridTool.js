"use strict";

const X3DGridNodeTool = require ("./X3DGridNodeTool");

class AngleGridTool extends X3DGridNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "AngleGridTool.x3d");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }
}

module .exports = AngleGridTool;
