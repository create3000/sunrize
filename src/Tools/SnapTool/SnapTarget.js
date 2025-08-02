"use strict";

const
   X3DSnapNodeTool = require ("./X3DSnapNodeTool"),
   ActionKeys      = require ("../../Application/ActionKeys"),
   X3D             = require ("../../X3D");

class SnapTarget extends X3DSnapNodeTool
{
   #transformTools = [ ];
   #changing       = Symbol ();

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .type = "SNAP_TARGET";
   }

   connectTool ()
   {
      super .connectTool ();

      X3DSnapNodeTool .snapTarget = true;

      X3DSnapNodeTool .addToolInterest (this, () => this .set_transform_tools ());

      this .set_transform_tools ();
   }

   disconnectTool ()
   {
      X3DSnapNodeTool .snapTarget = false;

      X3DSnapNodeTool .removeToolInterest (this);

      super .disconnectTool ();
   }

   set_transform_tools ()
   {
      for (const transformTool of this .#transformTools)
         transformTool .removeInterest ("set_transform", this);

      this .#transformTools .length = 0;

      for (const transformTool of X3DSnapNodeTool .tools)
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

      if (ActionKeys .value === (ActionKeys .Shift | ActionKeys .Control))
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

   static #axes = [
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
   ];

   static #normals = [
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
   ];

   set_translation (transformTool)
   {
      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      // Get absolute position.

      const
         dynamicSnapDistance = this .getDynamicSnapDistance (),
         absolutePosition    = this .tool .position .getValue () .copy (),
         absoluteMatrix      = transformTool .getCurrentMatrix () .multRight (transformTool .getModelMatrix ()),
         bbox                = transformTool .getSubBBox (new X3D .Box3 ()) .multRight (absoluteMatrix),
         center              = (this .tool .snapToCenter && !transformTool .tool .keepCenter) ? absoluteMatrix .multVecMatrix (transformTool ._center .getValue () .copy ()) : bbox .center .copy (),
         axes                = bbox .getAxes (SnapTarget .#axes),
         normals             = bbox .getNormals (SnapTarget .#normals);

      // Determine snap translation.

      const
         xCenters = [center, bbox .center .copy () .add (axes [0]), bbox .center .copy () .subtract (axes [0])],
         xAxes    = [axes [0], axes [0], axes [0] .copy () .negate ()],
         xNormals = [normals [0], normals [0], normals [0] .copy () .negate ()];

      const
         yCenters = [center, bbox .center .copy () .add (axes [1]), bbox .center .copy () .subtract (axes [1])],
         yAxes    = [axes [1], axes [1], axes [1] .copy () .negate ()],
         yNormals = [normals [1], normals [1], normals [1] .copy () .negate ()];

      const
         zCenters = [center, bbox .center .copy () .add (axes [2]), bbox .center .copy () .subtract (axes [2])],
         zAxes    = [axes [2], axes [2], axes [2] .copy () .negate ()],
         zNormals = [normals [2], normals [2], normals [2] .copy () .negate ()];

      const
         [snapTranslationX] = this .getSnapTranslation (absolutePosition, xCenters, xAxes, xNormals, dynamicSnapDistance),
         [snapTranslationY] = this .getSnapTranslation (absolutePosition, yCenters, yAxes, yNormals, dynamicSnapDistance),
         [snapTranslationZ] = this .getSnapTranslation (absolutePosition, zCenters, zAxes, zNormals, dynamicSnapDistance);

      const snapTranslation = snapTranslationX .add (snapTranslationY) .add (snapTranslationZ);

      this .tool .snapped = snapTranslation .norm () > 0.0001;

      if (snapTranslation .equals (X3D .Vector3 .Zero))
         return;

      // Snap translation.

      const
         snapMatrix    = new X3D .Matrix4 () .set (snapTranslation),
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
      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      const
         absolutePosition = this .tool .position .getValue () .copy (),
         absoluteNormal   = this .tool .normal .getValue () .copy () .normalize (),
         absoluteMatrix   = transformTool .getCurrentMatrix () .multRight (transformTool .getModelMatrix ()),
         bbox             = transformTool .getSubBBox (new X3D .Box3 ()) .multRight (absoluteMatrix);

      // Determine rotation axis and the tho snap axes.

      const
         index0 = SnapTarget .#rotationAxes [transformTool .tool .activeHandle], // Index of rotation axis
         index1 = (index0 + 1) % 3,
         index2 = (index0 + 2) % 3;

      const axes = [
         absoluteMatrix .xAxis .copy (),
         absoluteMatrix .yAxis .copy (),
         absoluteMatrix .zAxis .copy (),
      ]; // Rotation axis, equates to grid normal.

      const
         axis1 = axes [index1] .normalize (), // Snap axis 1
         axis2 = axes [index2] .normalize (), // Snap axis 2
         axis0 = axis1 .copy () .cross (axis2) .normalize (); // Rotation plane normal

      // Determine snap vector, from center to the position of this SnapTarget, projected onto plane of rotation axis.
      // If the angle between the normal of this SnapTarget and rotation axis is very small (<10°) the vector from
      // center to the position of this SnapTarget is used.

      const
         center     = absoluteMatrix .multVecMatrix (transformTool ._center .getValue () .copy ()),
         useNormal  = Math .abs (absoluteNormal .dot (axis0)) < Math .cos (X3D .Algorithm .radians (10)),
         snapVector = axis0 .copy () .cross (useNormal ? absoluteNormal : absolutePosition .copy () .subtract (center)) .cross (axis0) .normalize ();

      // Determine snap point onto plane and axes points onto plane with same distance to center as snap point.

      const
         dynamicSnapDistance = this .getDynamicSnapDistance () * 2,
         distance            = Math .max (bbox .center .distance (center), bbox .size .norm ()),
         snapPoint           = snapVector .copy () .multiply (distance),
         point1a             = axis1 .copy () .multiply (distance),
         point1b             = axis1 .copy () .negate () .multiply (distance),
         point2a             = axis2 .copy () .multiply (distance),
         point2b             = axis2 .copy () .negate () .multiply (distance);

      // Determine snap rotation.

      const
         distance1a   = snapPoint .distance (point1a),
         distance1b   = snapPoint .distance (point1b),
         distance1    = Math .min (distance1a, distance1b),
         distance2a   = snapPoint .distance (point2a),
         distance2b   = snapPoint .distance (point2b),
         distance2    = Math .min (distance2a, distance2b),
         snapRotation = new X3D .Rotation4 ();

      if (distance1 < distance2)
      {
         if (distance1 < dynamicSnapDistance)
         {
            const
               invModelMatrix = transformTool .getModelMatrix () .copy () .inverse (),
               from           = invModelMatrix .multDirMatrix (distance1a < distance1b ? axis1 : axis1 .negate ()),
               to             = invModelMatrix .multDirMatrix (snapVector);

            snapRotation .setFromToVec (from, to);
         }
      }
      else
      {
         if (distance2 < dynamicSnapDistance)
         {
            const
               invModelMatrix = transformTool .getModelMatrix () .copy () .inverse (),
               from           = invModelMatrix .multDirMatrix (distance2a < distance2b ? axis2 : axis2 .negate ()),
               to             = invModelMatrix .multDirMatrix (snapVector);

            snapRotation .setFromToVec (from, to);
         }
      }

      this .tool .snapped = Math .abs (snapRotation .angle) > 0.0001;

      if (snapRotation .equals (X3D .Rotation4 .Identity))
         return;

      // Snap rotation.

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
      if (transformTool .getUserData (this .#changing))
      {
         transformTool .setUserData (this .#changing, false);
         return;
      }

      const handle = SnapTarget .#scaleHandles [transformTool .tool .activeHandle];

      const currentMatrix = handle < 6
         ? this .getScaleMatrix (transformTool, handle)
         : this .getUniformScaleMatrix (transformTool, handle - 6);

      if (!currentMatrix)
         return;

      transformTool .setUserData (this .#changing, true);

      if (transformTool .tool .keepCenter)
         transformTool .setMatrixKeepCenter (currentMatrix);
      else
         transformTool .setMatrixWithCenter (currentMatrix);
   }

   getSnapTranslation (position, centers, axes, normals, snapDistance)
   {
      // Return first successful snap translation.

      const translations = [ ];

      for (let i = 0; i < centers .length; ++ i)
      {
         const
            center        = centers [i],
            axis          = axes [i],
            normal        = normals [i],
            positionPlane = new X3D .Plane3 (position, normal),
            axisLine      = new X3D .Line3 (center, axis .norm () > 0 ? axis .copy () .normalize () : normal),
            intersection  = new X3D .Vector3 (),
            intersected   = positionPlane .intersectsLine (axisLine, intersection);

         if (!intersected)
            continue;

         const translation = intersection .subtract (center);

         if (translation .norm () > snapDistance)
            continue;

         translations .push ([translation, i]);
      }

      if (translations .length)
         return translations .reduce (([p, pi], [c, ci]) => p .norm () < c .norm () ? [p, pi] : [c, ci]);

      return [new X3D .Vector3 (), undefined];
   }

   getScaleMatrix (transformTool, handle)
   {
      const
         MIN_DELTA = 1e-6,
         MIN_RATIO = 1e-3;

      const
         dynamicSnapDistance = this .getDynamicSnapDistance (),
         absolutePosition    = this .tool .position .getValue () .copy (),
         absoluteMatrix      = transformTool .getCurrentMatrix () .multRight (transformTool .getModelMatrix ()),
         subBBox             = transformTool .getSubBBox (new X3D .Box3 ()),
         subAABBox           = new X3D .Box3 (subBBox .size, subBBox .center),
         bbox                = subAABBox .copy () .multRight (absoluteMatrix),
         axes                = bbox .getAxes (SnapTarget .#axes),
         normals             = bbox .getNormals (SnapTarget .#normals);

      switch (transformTool .tool .scaleMode)
      {
         case "SCALE_FROM_CENTER":
         {
            // Scale one axis in both directions.

            const
               axis     = handle % 3,
               aCenters = [bbox .center .copy () .add (axes [axis]), bbox .center .copy () .subtract (axes [axis])],
               aAxes    = [axes [axis], axes [axis] .copy () .negate ()],
               aNormals = [normals [axis], normals [axis] .copy () .negate ()];

            const [snapTranslation, aAxis] = this .getSnapTranslation (absolutePosition, aCenters, aAxes, aNormals, dynamicSnapDistance);

            this .tool .snapped = snapTranslation .norm () > 0.0001;

            if (snapTranslation .equals (X3D .Vector3 .Zero))
               return undefined;

            const
               aBefore = aAxes [aAxis],
               aAfter  = aAxes [aAxis] .copy () .add (snapTranslation),
               aDelta  = aAfter .distance (aBefore),
               aRatio  = aAfter .norm () / aBefore .norm ();

            if (Math .abs (aDelta) < MIN_DELTA || Math .abs (aRatio) < MIN_RATIO || isNaN (aRatio) || Math .abs (aRatio) === Infinity)
            {
               return undefined;
            }

            let snapScale = new X3D .Vector3 (1, 1, 1);

            snapScale [axis] = aRatio;
            snapScale        = this .getConnectedAxes (transformTool, axis, snapScale);

            const
               center     = subAABBox .center,
               snapMatrix = new X3D .Matrix4 () .set (null, null, snapScale, null, center);

            snapMatrix .multRight (transformTool .getCurrentMatrix ());

            return snapMatrix;
         }
         case "SCALE_FROM_OPPOSITE_HANDLE":
         {
            const
               axis     = handle % 3,
               sgn      = handle < 3 ? 1 : -1,
               aCenters = [bbox .center .copy () .add (axes [axis] .copy () .multiply (sgn))],
               aAxes    = [axes [axis] .copy () .multiply (sgn)],
               aNormals = [normals [axis] .copy () .multiply (sgn)];

            const [snapTranslation, aAxis] = this .getSnapTranslation (absolutePosition, aCenters, aAxes, aNormals, dynamicSnapDistance);

            this .tool .snapped = snapTranslation .norm () > 0.0001;

            if (snapTranslation .equals (X3D .Vector3 .Zero))
               return undefined;

            const
               aBefore = aAxes [aAxis] .copy () .multiply (2),
               aAfter  = aBefore .copy () .add (snapTranslation),
               aDelta  = aAfter .distance (aBefore),
               aRatio  = aAfter .norm () / aBefore .norm ();

            if (Math .abs (aDelta) < MIN_DELTA || Math .abs (aRatio) < MIN_RATIO || isNaN (aRatio) || Math .abs (aRatio) === Infinity)
            {
               return undefined;
            }

            let snapScale = new X3D .Vector3 (1, 1, 1);

            snapScale [axis] = aRatio;
            snapScale        = this .getConnectedAxes (transformTool, axis, snapScale);

            const
               subAABBoxAxes = subAABBox .getAxes (SnapTarget .#axes),
               center        = subAABBoxAxes [axis] .multiply (-sgn) .add (subAABBox .center),
               snapMatrix    = new X3D .Matrix4 () .set (null, null, snapScale, null, center);

            snapMatrix .multRight (transformTool .getCurrentMatrix ());

            return snapMatrix;
         }
      }
   }

   static #adjacentFaces =
   [
      [0, 2, 4],
      [1, 2, 4],
      [1, 3, 4],
      [0, 3, 4],
      [0, 2, 5],
      [1, 2, 5],
      [1, 3, 5],
      [0, 3, 5],
   ];

   static #oppositePoints = [6, 7, 4, 5, 2, 3, 0, 1];

   static #points = [
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
      new X3D .Vector3 (),
   ];

   getUniformScaleMatrix (transformTool, handle)
   {
      const
         MIN_DELTA = 1e-6,
         MIN_RATIO = 1e-3;

      const
         dynamicSnapDistance = this .getDynamicSnapDistance (),
         absolutePosition    = this .tool .position .getValue () .copy (),
         absoluteMatrix      = transformTool .getCurrentMatrix () .multRight (transformTool .getModelMatrix ()),
         subBBox             = transformTool .getSubBBox (new X3D .Box3 ()),
         subAABBox           = new X3D .Box3 (subBBox .size, subBBox .center),
         bbox                = subAABBox .copy () .multRight (absoluteMatrix),
         axes                = bbox .getAxes (SnapTarget .#axes),
         normals             = bbox .getNormals (SnapTarget .#normals);

      switch (transformTool .tool .scaleMode)
      {
         case "SCALE_FROM_CENTER":
         {
            // Scale one axis in both directions.

            const
               aCenters = [
                  bbox .center .copy () .add (axes [0]),
                  bbox .center .copy () .subtract (axes [0]),
                  bbox .center .copy () .add (axes [1]),
                  bbox .center .copy () .subtract (axes [1]),
                  bbox .center .copy () .add (axes [2]),
                  bbox .center .copy () .subtract (axes [2]),
               ],
               aAxes = [
                  axes [0],
                  axes [0] .copy () .negate (),
                  axes [1],
                  axes [1] .copy () .negate (),
                  axes [2],
                  axes [2] .copy () .negate (),
               ],
               aNormals = [
                  normals [0],
                  normals [0] .copy () .negate (),
                  normals [1],
                  normals [1] .copy () .negate (),
                  normals [2],
                  normals [2] .copy () .negate (),
               ];

            const [snapTranslation, aAxis] = this .getSnapTranslation (absolutePosition, aCenters, aAxes, aNormals, dynamicSnapDistance);

            this .tool .snapped = snapTranslation .norm () > 0.0001;

            if (snapTranslation .equals (X3D .Vector3 .Zero))
               return undefined;

            const
               aBefore = aAxes [aAxis],
               aAfter  = aAxes [aAxis] .copy () .add (snapTranslation),
               aDelta  = aAfter .distance (aBefore),
               aRatio  = aAfter .norm () / aBefore .norm ();

            if (Math .abs (aDelta) < MIN_DELTA || Math .abs (aRatio) < MIN_RATIO || isNaN (aRatio) || Math .abs (aRatio) === Infinity)
            {
               return undefined;
            }

            const
               snapScale  = new X3D .Vector3 (aRatio, aRatio, aRatio),
               center     = subAABBox .center,
               snapMatrix = new X3D .Matrix4 () .set (null, null, snapScale, null, center);

            snapMatrix .multRight (transformTool .getCurrentMatrix ());

            return snapMatrix;
         }
         case "SCALE_FROM_OPPOSITE_HANDLE":
         {
            const
               aIndices = SnapTarget .#adjacentFaces [handle],
               aCenters = [
                  bbox .center .copy () .add (axes [0]),
                  bbox .center .copy () .subtract (axes [0]),
                  bbox .center .copy () .add (axes [1]),
                  bbox .center .copy () .subtract (axes [1]),
                  bbox .center .copy () .add (axes [2]),
                  bbox .center .copy () .subtract (axes [2]),
               ]
               .filter ((v, i) => aIndices .includes (i)),
               aAxes = [
                  axes [0],
                  axes [0] .copy () .negate (),
                  axes [1],
                  axes [1] .copy () .negate (),
                  axes [2],
                  axes [2] .copy () .negate (),
               ]
               .filter ((v, i) => aIndices .includes (i)),
               aNormals = [
                  normals [0],
                  normals [0] .copy () .negate (),
                  normals [1],
                  normals [1] .copy () .negate (),
                  normals [2],
                  normals [2] .copy () .negate (),
               ]
               .filter ((v, i) => aIndices .includes (i));

            const [snapTranslation, aAxis] = this .getSnapTranslation (absolutePosition, aCenters, aAxes, aNormals, dynamicSnapDistance);

            this .tool .snapped = snapTranslation .norm () > 0.0001;

            if (snapTranslation .equals (X3D .Vector3 .Zero))
               return undefined;

            const
               aBefore = aAxes [aAxis] .copy () .multiply (2),
               aAfter  = aBefore .copy () .add (snapTranslation),
               aDelta  = aAfter .distance (aBefore),
               aRatio  = aAfter .norm () / aBefore .norm ();

            if (Math .abs (aDelta) < MIN_DELTA || Math .abs (aRatio) < MIN_RATIO || isNaN (aRatio) || Math .abs (aRatio) === Infinity)
            {
               return undefined;
            }

            const
               snapScale       = new X3D .Vector3 (aRatio, aRatio, aRatio),
               subAABBoxPoints = subAABBox .getPoints (SnapTarget .#points),
               center          = subAABBoxPoints [SnapTarget .#oppositePoints [handle]],
               snapMatrix      = new X3D .Matrix4 () .set (null, null, snapScale, null, center);

            snapMatrix .multRight (transformTool .getCurrentMatrix ());

            return snapMatrix;
         }
      }
   }

   static #connectedAxes = {
      "X": 0,
      "Y": 1,
      "Z": 2,
   };

   getConnectedAxes (transformTool, axis, scale)
   {
      for (const connectedAxis of transformTool .tool .connectedAxes)
      {
         const
            lhs = SnapTarget .#connectedAxes [connectedAxis [0]],
            rhs = SnapTarget .#connectedAxes [connectedAxis [1]];

         if (rhs === axis)
            scale [lhs] = scale [rhs];
      }

      return scale;
   }

   getDynamicSnapDistance ()
   {
      const
         executionContext    = this .tool .getValue () .getBody (),
         sphereNode          = executionContext .getNamedNode ("Sphere") .getValue (),
         vectorNode          = executionContext .getNamedNode ("Vector") .getValue (),
         bbox                = sphereNode .getBBox (new X3D .Box3 ()) .multRight (vectorNode .getMatrix ()),
         dynamicSnapDistance = Math .max (... bbox .size) / 2;

      return dynamicSnapDistance;
   }
}

module .exports = SnapTarget;
