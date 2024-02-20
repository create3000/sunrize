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
      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      transformTool .setUserData (this .#changing, true);

		// The position is transformed to an absolute position and then transformed into the coordinate system of the grid
		// for easier snapping position calculation.

		// Get absolute position.

		const absoluteMatrix = transformTool .getMatrixFromFields () .multRight (transformTool .getModelMatrix ());

		if (transformTool .tool .keepCenter || !this .tool .snapToCenter)
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
      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      transformTool .setUserData (this .#changing, true);

      // Snap rotation to axes.

		const
         matrixBefore = transformTool .getLastMatrix () .copy () .multRight (transformTool .getModelMatrix ()), // Matrix before transformation
         matrixAfter  = transformTool .getMatrixFromFields () .copy () .multRight (transformTool .getModelMatrix ()); // Matrix after transformation

		const distances = [
         matrixAfter .xAxis .copy () .normalize () .dot (matrixBefore .xAxis .copy () .normalize ()),
		   matrixAfter .yAxis .copy () .normalize () .dot (matrixBefore .yAxis .copy () .normalize ()),
		   matrixAfter .zAxis .copy () .normalize () .dot (matrixBefore .zAxis .copy () .normalize ()),
      ];

      const
         index0 = distances .reduce ((max, v, i, a) => v > a [max] ? i : max, 0), // Index of rotation axis
         index1 = (index0 + 1) % distances .length,
         index2 = (index0 + 2) % distances .length;

		const y = [
         matrixAfter .xAxis .copy (),
         matrixAfter .yAxis .copy (),
         matrixAfter .zAxis .copy ()
      ]; // Rotation axis, equates to grid normal

      const z = [
         matrixAfter .yAxis .copy (),
         matrixAfter .zAxis .copy (),
         matrixAfter .yAxis .copy (),
      ]; // Axis which snaps, later transformed to grid space

		const gridMatrix = this .getGridMatrix ();

      const
		   Y         = y [index1] .copy () .cross (y [index2]) .normalize (), // Normal of rotation plane
		   X         = gridMatrix .yAxis .copy () .cross (Y), // Intersection between both planes
		   Z         = X .copy () .cross (Y), // Front vector
		   gridPlane = gridMatrix .submatrix .copy ();

      let
		   rotationPlane = new X3D .Matrix3 (X [0], X [1], X [2], Y [0], Y [1], Y [2], Z [0], Z [1], Z [2]),
		   gridRotation  = this .tool .rotation .getValue () .getMatrix ();

		// If X or Z are near 0 then Y is collinear to the y-axis.

		if (1 - Math .abs (gridMatrix .yAxis .normalize () .dot (Y)) < 1e-6)
		{
			rotationPlane = new X3D .Matrix3 ();
			gridRotation  = new X3D .Matrix3 ();
		}

		const
         vectorToSnap   = z [index0],
         vectorOnGrid   = rotationPlane .copy () .inverse () .multRight (gridRotation) .multRight (gridPlane .copy () .inverse ()) .multVecMatrix (vectorToSnap .copy ()) .normalize (), // Vector inside grid space.
         snapVector     = gridPlane .multRight (gridRotation .copy () .inverse ()) .multRight (rotationPlane) .multVecMatrix (this .getSnapPosition (vectorOnGrid)),
         invModelMatrix = transformTool .getModelMatrix () .copy () .inverse (),
         snapRotation   = new X3D .Rotation4 (
            invModelMatrix .multDirMatrix (vectorToSnap .copy ()),
            invModelMatrix .multDirMatrix (snapVector .copy ())
         );

		const currentMatrix = new X3D .Matrix4 ()
         .set (transformTool ._translation      .getValue (),
		         transformTool ._rotation         .getValue () .copy () .multRight (snapRotation),
		         transformTool ._scale            .getValue (),
		         transformTool ._scaleOrientation .getValue (),
		         transformTool ._center           .getValue ());

		if (transformTool .tool .keepCenter)
			transformTool .setMatrixKeepCenter (currentMatrix);
		else
			transformTool .setMatrixWithCenter (currentMatrix);
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
