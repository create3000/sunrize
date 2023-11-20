"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DViewpointNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   toolType = 0;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DViewpointNodeTool.x3d");
      ;
      this .tool .getField ("orientation") .addReference (this .node ._orientation);

      this .node ._isBound .addFieldInterest (this .tool .getField ("bound"));

      this .tool .type  = this .toolType;
      this .tool .bound = this .node ._isBound;
   }

   disposeTool ()
   {
      this .node ._isBound .removeFieldInterest (this .tool .getField ("bound"));

      super .disposeTool ();
   }
}

module .exports = X3DViewpointNodeTool;
