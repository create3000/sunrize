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

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .removeToolInterest (this);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
   }
}

module .exports = X3DSnapNodeTool;
