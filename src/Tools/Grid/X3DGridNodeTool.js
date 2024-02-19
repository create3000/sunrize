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

      X3DGridNodeTool .addToolInterest (this, () => this .set_transform_tools ());
   }

   disposeTool ()
   {
      X3DGridNodeTool .removeToolInterest (this);
   }

   set_transform_tools ()
   {
      console .log (X3DGridNodeTool .tools .size);
   }

   /**
    * @param {X3D .Vector3} position
    * @returns Snap position from position in world space.
    */
   getSnapPosition (position)
   {
      position = position .copy ();

      const
         tool       = this .tool,
         gridMatrix = new X3D .Matrix4d ();

      gridMatrix
         .set (tool .translation, tool .rotation, tool .scale)
         .multRight (this .getModelMatrix ())
         .inverse ();

      const
         invGridMatrix = gridMatrix .copy () .inverse (),
         snapPosition  = gridMatrix .multVecMatrix (this .getGridSnapPosition (invGridMatrix .multVecMatrix (position)));

      return snapPosition;
   }
}

module .exports = X3DGridNodeTool;
