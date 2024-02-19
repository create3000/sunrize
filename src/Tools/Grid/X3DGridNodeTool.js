"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D");

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

   #transformTools = [ ];

   set_transform_tools ()
   {
      for (const transformTool of this .#transformTools)
      {
         transformTool ._translation .removeInterest ("set_translation", this);
         transformTool ._rotation    .removeInterest ("set_rotation",    this);
         transformTool ._scale       .removeInterest ("set_scale",       this);
      }

      this .#transformTools .length = 0;

      for (const transformTool of X3DGridNodeTool .tools)
      {
         if (!(transformTool instanceof X3D .X3DTransformNode))
            continue;

         this .#transformTools .push (transformTool);
      }

      for (const transformTool of this .#transformTools)
      {
         transformTool ._translation .addInterest ("set_translation", this, transformTool);
         transformTool ._rotation    .addInterest ("set_rotation",    this, transformTool);
         transformTool ._scale       .addInterest ("set_scale",       this, transformTool);
      }
   }

   set_translation (transformTool)
   {
      console .log (transformTool ._translation .toString ())
   }

   set_rotation (transformTool)
   {

   }

   set_scale (transformTool)
   {

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
