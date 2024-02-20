"use strict";

const
   X3DGridNodeTool = require ("./X3DGridNodeTool"),
   X3D             = require ("../../X3D");

class AxonometricGridTool extends X3DGridNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "AxonometricGridTool.x3d");

      this .tool .getField ("angles") .setUnit ("angle");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }
}

module .exports = AxonometricGridTool;
