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

      this .set_transform_tools ();
   }

   disposeTool ()
   {
      X3DGridNodeTool .removeToolInterest (this);
   }

   #transformTools = [ ];
   #changing       = true;

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
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      if (!this ._visible .getValue ())
         return;

      if (!transformTool .tool .isActive)
         return;

      if (transformTool .tool .activeTool !== "TRANSLATE")
         return;

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

		// Calculate snapping position and apply absolute relative translation.

		const
         snapMatrix    = new X3D .Matrix4 () .set (this .getSnapPosition (position) .subtract (position)),
		   currentMatrix = absoluteMatrix .multRight (snapMatrix) .multRight (transformTool .getModelMatrix () .copy () .inverse ());

      this .#changing = true;

		if (transformTool .tool .keepCenter)
         transformTool .setMatrixKeepCenter (currentMatrix);
		else
         transformTool .setMatrixWithCenter (currentMatrix);
   }

   set_rotation (transformTool)
   {

   }

   set_scale (transformTool)
   {

   }

   /**
    * @returns Grid matrix in world space.
    */
   getGridMatrix ()
   {
      const
         tool       = this .tool,
         gridMatrix = new X3D .Matrix4 ();

      gridMatrix
         .set (tool .translation .getValue (), tool .rotation .getValue (), tool .scale .getValue ())
         .multRight (this .getModelMatrix ());

      return gridMatrix;
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
