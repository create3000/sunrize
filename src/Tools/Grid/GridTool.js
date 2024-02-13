"use strict";

const X3DGridNodeTool = require ("./X3DGridNodeTool");

class GridTool extends X3DGridNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "GridTool.x3d");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }
}

module .exports = GridTool;
