"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D");

class X3DGridNodeTool extends X3DActiveLayerNodeTool
{
   #transformTools = [ ];
   #changing       = Symbol ();

   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool (... args)
   {
      await super .initializeTool (... args);

      this .tool .getField ("translation") .setUnit ("length");

      X3DGridNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      this .set_transform_tools ();
   }

   disposeTool ()
   {
      X3DGridNodeTool .removeToolInterest (this);
   }

   set_transform_tools ()
   {
      for (const transformTool of this .#transformTools)
         transformTool .removeInterest ("set_transform", this);

      this .#transformTools .length = 0;

      for (const transformTool of X3DGridNodeTool .tools)
      {
         if (!(transformTool instanceof X3D .X3DTransformNode))
            continue;

         this .#transformTools .push (transformTool);
      }

      for (const transformTool of this .#transformTools)
         transformTool .addInterest ("set_transform", this, transformTool);
   }

   set_transform (transformTool)
   {
      if (!this ._visible .getValue ())
         return;

      if (!transformTool .tool .isActive)
         return;

      switch (transformTool .tool .activeTool)
      {
         case "TRANSLATE":
            this .set_translation (transformTool);
            return;
         case "ROTATE":
            this .set_rotation (transformTool);
            return;
         case "SCALE":
            this .set_scale (transformTool);
            return;
      }
   }

   set_translation (transformTool)
   {
      if (transformTool [this .#changing])
      {
         transformTool [this .#changing] = false;
         return;
      }

      transformTool [this .#changing] = true;

		// The position is transformed to an absolute position and then transformed into the coordinate system of the grid
		// for easier snapping position calculation.

		// Get absolute position.

		const absoluteMatrix = transformTool .getMatrixFromFields () .multRight (transformTool .getModelMatrix ());

		if (transformTool .tool .keepCenter)
		{
			// snapping to bbox center.
			var position = transformTool .getSubBBox (new X3D .Box3 ()) .multRight (absoluteMatrix) .center;
		}
		else
		{
			var position = absoluteMatrix .multVecMatrix (transformTool ._center .getValue () .copy ());
		}

		// Calculate snapping position and apply absolute translation.

		const
         snapMatrix    = new X3D .Matrix4 () .set (this .getSnapPosition (position) .subtract (position)),
		   currentMatrix = absoluteMatrix .multRight (snapMatrix) .multRight (transformTool .getModelMatrix () .copy () .inverse ());

		if (transformTool .tool .keepCenter)
         transformTool .setMatrixKeepCenter (currentMatrix);
		else
         transformTool .setMatrixWithCenter (currentMatrix);
   }

   set_rotation (transformTool)
   {
      if (transformTool [this .#changing])
      {
         transformTool [this .#changing] = false;
         return;
      }

      transformTool [this .#changing] = true;
   }

   set_scale (transformTool)
   {

   }

   /**
    * @returns Grid matrix in world space.
    */
   getGridMatrix ()
   {
      const tool = this .tool;

      return new X3D .Matrix4 ()
         .set (tool .translation .getValue (), tool .rotation .getValue (), tool .scale .getValue ())
         .multRight (this .getModelMatrix ());
   }
   /**
    * @param {X3D .Vector3} position
    * @returns Snap position from position in world space.
    */
   getSnapPosition (position)
   {
      position = position .copy ();

      const
         gridMatrix    = this .getGridMatrix (),
         invGridMatrix = gridMatrix .copy () .inverse (),
         snapPosition  = gridMatrix .multVecMatrix (this .getGridSnapPosition (invGridMatrix .multVecMatrix (position)));

      return snapPosition;
   }
}

module .exports = X3DGridNodeTool;
