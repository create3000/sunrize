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
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
   ];

   static #normals = [
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
      new X3D .Vector3 (0, 0, 0),
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
		   absolutePosition    = this .getModelMatrix () .multVecMatrix (this .tool .position .getValue () .copy ()),
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

		const snapTranslation = this .getSnapTranslation (absolutePosition, xCenters, xAxes, xNormals, dynamicSnapDistance)
		   .add (this .getSnapTranslation (absolutePosition, yCenters, yAxes, yNormals, dynamicSnapDistance))
		   .add (this .getSnapTranslation (absolutePosition, zCenters, zAxes, zNormals, dynamicSnapDistance));

		this .tool .snapped = snapTranslation .magnitude () > 0.0001;

		if (snapTranslation .equals (X3D .Vector3 .Zero))
			return;

		// Snap.

		const
         snapMatrix    = new X3D .Matrix4 () .set (snapTranslation),
		   currentMatrix = absoluteMatrix .multRight (snapMatrix) .multRight (transformTool .getModelMatrix () .copy () .inverse ());

      transformTool .setUserData (this .#changing, true);

		if (transformTool .tool .keepCenter)
         transformTool .setMatrixKeepCenter (currentMatrix);
		else
         transformTool .setMatrixWithCenter (currentMatrix);
   }

   set_rotation (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }

   set_scale (transformTool)
   {
      // if (transformTool .getUserData (this .#changing))
      // {
      //    transformTool .setUserData (this .#changing, false);
      //    return;
      // }
   }

   getSnapTranslation (position, centers, axes, normals, snapDistance)
   {
      // Return first successful snap translation.

      for (let i = 0; i < 3; ++ i)
      {
         const
            center        = centers [i],
            axis          = axes [i],
            normal        = normals [i],
            positionPlane = new X3D .Plane3 (position, normal),
            axisLine      = new X3D .Line3 (center, axis .magnitude () > 0 ? axis .normalize () : normal),
            intersection  = new X3D .Vector3 (0, 0, 0),
            intersected   = positionPlane .intersectsLine (axisLine, intersection);

         if (!intersected)
            continue;

         const translation = intersection .subtract (center);

         if (translation .magnitude () > snapDistance)
            continue;

         return translation;
      }

      return new X3D .Vector3 (0, 0, 0);
   }

   getDynamicSnapDistance ()
   {
      const
         executionContext    = this .tool .getValue () .getBody (),
		   sphereNode          = executionContext .getNamedNode ("Sphere") .getValue (),
		   vectorNode          = executionContext .getNamedNode ("Vector") .getValue (),
		   bbox                = sphereNode .getBBox (new X3D .Box3 ()) .multRight (vectorNode .getMatrix ()) .multRight (this .getModelMatrix ()),
		   dynamicSnapDistance = Math .max (... bbox .size) / 2;

		return dynamicSnapDistance;
   }
}

module .exports = SnapTarget;
