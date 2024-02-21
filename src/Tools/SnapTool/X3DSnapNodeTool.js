"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D");

class X3DSnapNodeTool extends X3DActiveLayerNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SnapTool.x3d");
   }
}

module .exports = X3DSnapNodeTool;
