"use strict";

const
   X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool"),
   X3D                    = require ("../../X3D");

class X3DGridNodeTool extends X3DActiveLayerNodeTool
{
   #transformTools = [ ];
   #events         = Symbol ();
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
      {
         transformTool .tool .getField ("isActive") .removeInterest ("set_active",    this);
         transformTool                              .removeInterest ("set_transform", this);
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
         transformTool .tool .getField ("isActive") .addInterest ("set_active",    this, transformTool);
         transformTool                              .addInterest ("set_transform", this, transformTool, false);
      }
   }

   set_active (transformTool, active)
   {
      if (active .getValue ())
         transformTool .setUserData (this .#events, false);
      else
         this .set_transform (transformTool, transformTool .getUserData (this .#events));
   }

   set_transform (transformTool, active)
   {
      if (!this ._visible .getValue ())
         return;

      if (!(active || transformTool .tool .isActive))
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
      transformTool .setUserData (this .#events, true);

      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

		// The position is transformed to an absolute position and then transformed into the coordinate system of the grid
		// for easier snapping position calculation.

		// Get absolute position.

		const absoluteMatrix = transformTool .getCurrentMatrix () .multRight (transformTool .getModelMatrix ());

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
         gridMatrix    = this .getGridMatrix (),
         invGridMatrix = gridMatrix .copy () .inverse ();

		const
         snapMatrix    = new X3D .Matrix4 () .set (gridMatrix .multVecMatrix (this .getSnapPosition (invGridMatrix .multVecMatrix (position .copy ()), true)) .subtract (position)),
		   currentMatrix = absoluteMatrix .multRight (snapMatrix) .multRight (transformTool .getModelMatrix () .copy () .inverse ());

      transformTool .setUserData (this .#changing, true);

		if (transformTool .tool .keepCenter)
         transformTool .setMatrixKeepCenter (currentMatrix);
		else
         transformTool .setMatrixWithCenter (currentMatrix);
   }

   static #rotationAxes = {
      X_AXIS: 0,
      Y_AXIS: 1,
      Z_AXIS: 2,
   };

   set_rotation (transformTool)
   {
      transformTool .setUserData (this .#events, true);

      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      // Snap rotation to axes.

		const absoluteMatrix = transformTool .getCurrentMatrix () .copy () .multRight (transformTool .getModelMatrix ()); // Matrix after transformation

      const
         index0 = X3DGridNodeTool .#rotationAxes [transformTool .tool .activeHandle], // Index of rotation axis
         index1 = (index0 + 1) % 3,
         index2 = (index0 + 2) % 3;

		const y = [
         absoluteMatrix .xAxis .copy (),
         absoluteMatrix .yAxis .copy (),
         absoluteMatrix .zAxis .copy ()
      ]; // Rotation axis, equates to grid normal

      const z = [
         absoluteMatrix .yAxis .copy (),
         absoluteMatrix .zAxis .copy (),
         absoluteMatrix .yAxis .copy (),
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
         snapVector     = rotationPlane .multVecMatrix (gridRotation .copy () .inverse () .multVecMatrix (gridPlane .multVecMatrix (this .getSnapPosition (vectorOnGrid .copy (), false)))),
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

      transformTool .setUserData (this .#changing, true);

		if (transformTool .tool .keepCenter)
			transformTool .setMatrixKeepCenter (currentMatrix);
		else
			transformTool .setMatrixWithCenter (currentMatrix);
   }

   static #scaleHandles = {
      X_FRONT: 0,
      Y_FRONT: 1,
      Z_FRONT: 2,
      X_BACK: 3,
      Y_BACK: 4,
      Z_BACK: 5,
      SCALE_1: 6,
      SCALE_2: 7,
      SCALE_3: 8,
      SCALE_4: 9,
      SCALE_5: 10,
      SCALE_6: 11,
      SCALE_7: 12,
      SCALE_8: 13,
   };

   set_scale (transformTool)
   {
      transformTool .setUserData (this .#events, true);

      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

		const handle = X3DGridNodeTool .#scaleHandles [transformTool .tool .activeHandle];

		// All points are first transformed to grid space, then a snapping position is calculated, and then transformed back to absolute space.

		const currentMatrix = handle < 6
         ? this .getScaleMatrix (transformTool, handle)
         : this .getUniformScaleMatrix (transformTool, handle - 6);

      transformTool .setUserData (this .#changing, true);

		if (transformTool .tool .keepCenter)
			transformTool .setMatrixKeepCenter (currentMatrix);
		else
			transformTool .setMatrixWithCenter (currentMatrix);
   }

   static #axes = [
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
   ];

   getScaleMatrix (transformTool, handle)
   {
      // All points are first transformed to grid space, then a snapping position is calculated, and then transformed back to absolute space.

      const
         MIN_DELTA = 1e-6,
         MIN_RATIO = 1e-3;

      // Get absolute position.

      const
         currentMatrix     = transformTool .getCurrentMatrix (),
         absoluteMatrix    = currentMatrix .copy () .multRight (transformTool .getModelMatrix ()),
         invAbsoluteMatrix = absoluteMatrix .copy () .inverse (),
         sub               = transformTool .getSubBBox (new X3D .Box3 ()), // BBox of the children.
         aabb              = new X3D .Box3 (sub .size, sub .center),       // AABB BBox
         bbox              = aabb .copy () .multRight (absoluteMatrix),    // Absolute OBB of AABB
         position          = bbox .center .copy ();                        // Absolute position

      // Calculate snapping scale for one axis. The ratio is calculated in transforms sub space.

      const
         gridMatrix    = this .getGridMatrix (),
         invGridMatrix = gridMatrix .copy () .inverse ();

      const
         axis         = handle % 3,
         sgn          = handle < 3 ? 1 : -1,
         direction    = bbox .getAxes (X3DGridNodeTool .#axes) [axis] .copy () .multiply (sgn),
         point        = direction .copy () .add (position),
         snapPosition = gridMatrix .multVecMatrix (this .getSnapPositionWithNormal (invGridMatrix .multVecMatrix (point .copy ()), invGridMatrix .multDirMatrix (direction .copy ()) .normalize ()));

      let
         after  = invAbsoluteMatrix .multVecMatrix (snapPosition .copy ()) .subtract (aabb .center) [axis],
         before = aabb .getAxes (X3DGridNodeTool .#axes) [axis] [axis] * sgn;

      if (transformTool .tool .scaleMode === "SCALE_FROM_OPPOSITE_HANDLE")
      {
         // Scale from corner.
         after  += before;
         before *= 2;
      }

      const
         delta = after - before,
         ratio = after / before;

      // We must procced with the original current matrix and a snapping scale of [1 1 1], for correct grouped event handling.

      if (Math .abs (delta) < MIN_DELTA || Math .abs (ratio) < MIN_RATIO || isNaN (ratio) || Math .abs (ratio) === Infinity)
         return currentMatrix;

      let snapScale = new X3D .Vector3 (1, 1, 1);

      snapScale [axis] = ratio;
      snapScale        = this .getConnectedAxes (transformTool, axis, snapScale);

      let snapMatrix = new X3D .Matrix4 ();

      snapMatrix .scale (snapScale);

      snapMatrix .multRight (this .getOffset (transformTool, aabb, snapMatrix, aabb .getAxes (X3DGridNodeTool .#axes) [axis] .copy () .multiply (sgn)));
      snapMatrix .multRight (currentMatrix);

      return snapMatrix;
   }

   static #points = [
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
   ];

   getUniformScaleMatrix (transformTool, handle)
   {
      // All points are first transformed to grid space, then a snapping position is calculated, and then transformed back to absolute space.

      // Get absolute position.

      const
         currentMatrix  = transformTool .getCurrentMatrix (),
         absoluteMatrix = currentMatrix .copy () .multRight (transformTool .getModelMatrix ()),
         sub            = transformTool .getSubBBox (new X3D .Box3 ()), // BBox of the children.
         aabb           = new X3D .Box3 (sub .size, sub .center),       // AABB BBox
         bbox           = aabb .copy () .multRight (absoluteMatrix),    // Absolute OBB of AABB
         position       = bbox .center .copy ();                        // Absolute position

      // Calculate snapping scale and apply absolute relative translation.

      const
         gridMatrix    = this .getGridMatrix (),
         invGridMatrix = gridMatrix .copy () .inverse (),
         points        = bbox .getPoints (X3DGridNodeTool .#points);

      let min = Infinity;

      if (transformTool .tool .scaleMode === "SCALE_FROM_OPPOSITE_HANDLE")
      {
         // Uniform scale from corner.

         const
            point  = points [handle],
            before = point .copy () .subtract (position),
            after  = gridMatrix .multVecMatrix (this .getSnapPositionWithNormal (invGridMatrix .multVecMatrix (point .copy ()), invGridMatrix .multDirMatrix (before .copy ()) .normalize ())) .subtract (position);

         after  .add (before);
         before .multiply (2);

         const
            delta = after .copy () .subtract (before),
            ratio = after .copy () .divVec (before);

         for (let i = 0; i < 3; ++ i)
         {
            const r = Math .abs (ratio [i] - 1);

            if (delta [i] && r < Math .abs (min - 1))
               min = ratio [i];
         }
      }
      else
      {
         // Scale from center.

         for (const point of points)
         {
            const
               before = point .copy () .subtract (position),
               after  = gridMatrix .multVecMatrix (this .getSnapPositionWithNormal (invGridMatrix .multVecMatrix (point .copy ()), invGridMatrix .multDirMatrix (before .copy ()) .normalize ())) .subtract (position),
               delta  = after .copy () .subtract (before),
               ratio  = after .copy () .divVec (before);

            for (let i = 0; i < 3; ++ i)
            {
               const r = Math .abs (ratio [i] - 1);

               if (delta [i] && r < Math .abs (min - 1))
                  min = ratio [i];
            }
         }
      }

      // We must proceed with the original current matrix and a snapping scale of [1 1 1], for correct grouped event handling.

      if (min === 0 || min === Infinity)
         return currentMatrix;

      let snapMatrix = new X3D .Matrix4 ();

      snapMatrix .scale (new X3D .Vector3 (min, min, min));

      snapMatrix .multRight (this .getOffset (transformTool, bbox, snapMatrix, points [handle] .copy () .subtract (bbox .center)));
      snapMatrix = absoluteMatrix .multRight (snapMatrix) .multRight (transformTool .getModelMatrix () .copy () .inverse ());

      return snapMatrix;
   }

   getConnectedAxes (transformTool, axis, scale)
   {
      const axes = {
         X: 0,
         Y: 1,
         Z: 2,
      };

      for (const connectedAxis of transformTool .tool .connectedAxes)
      {
         const
            lhs = axes [connectedAxis [0]],
            rhs = axes [connectedAxis [1]];

         if (rhs === axis)
            scale [lhs] = scale [rhs];
      }

      return scale;
   }

   getOffset (transformTool, bbox, scaleMatrix, offset)
   {
      // To keep the bbox center at its point we must compute a translation offset.

      let distanceFromCenter = bbox .center .copy ();

      if (transformTool .tool .scaleMode === "SCALE_FROM_OPPOSITE_HANDLE")
         distanceFromCenter .subtract (offset);

      const translation = new X3D .Matrix4 ()
         .set (distanceFromCenter .subtract (scaleMatrix .multDirMatrix (distanceFromCenter .copy ())));

      return translation;
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
}

module .exports = X3DGridNodeTool;
