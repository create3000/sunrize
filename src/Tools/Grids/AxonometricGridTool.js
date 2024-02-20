"use strict";

const
   X3DGridNodeTool = require ("./X3DGridNodeTool"),
   Barycentric     = require ("./Barycentric"),
   X3D             = require ("../../X3D");

class AxonometricGridTool extends X3DGridNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "AxonometricGridTool.x3d");

      this .tool .getField ("angles") .setUnit ("angle");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }

   getSnapPosition (position)
   {
      let p = position .copy ();

      p .y = 0;

      // Construct simplex.

      const
         angles = [this .tool .angles [0], this .tool .angles [1], Math .PI - this .tool .angles [0] - this .tool .angles [1]],
         u      = Math .sin (angles [1]) / Math .sin (angles [2]),
         v      = 1,
         As     = new X3D .Vector3 (0, 0, 0),
         Bs     = new X3D .Vector3 (v, 0, 0),
         Cs     = new X3D .Rotation4 (0, 1, 0, angles [0]) .multVecRot (new X3D .Vector3 (u, 0, 0));

      // Construct triangle.

      const
         triangle = Barycentric .triangle (Barycentric .to (position, As, Bs, Cs)),
         A        = Barycentric .from (triangle [0], As, Bs, Cs),
         B        = Barycentric .from (triangle [1], As, Bs, Cs),
         C        = Barycentric .from (triangle [2], As, Bs, Cs);

      // Find closest point.

      const
         vertices = [A, B, C],
         vD       = [A .distance (p), B .distance (p), C .distance (p)],
         min      = vD .reduce ((min, v, i, a) => v < a [min] ? i : min, 0);

      // Test all three vertices of the triangle.


      if (vD [min] < Math .abs (this .tool .snapDistance))
      {
         p = vertices [min];
      }
      else
      {
         // Test all three edges of the triangle.

         const
            uV     = A .copy () .subtract (C),
            vV     = B .copy () .subtract (A),
            tV     = C .copy () .subtract (B),
            nU     = new X3D .Vector3 (uV .z, 0, -uV .x) .normalize (),
            nV     = new X3D .Vector3 (vV .z, 0, -vV .x) .normalize (),
            nT     = new X3D .Vector3 (tV .z, 0, -tV .x) .normalize (),
            pU     = new X3D .Plane3 (A, nU),
            pV     = new X3D .Plane3 (B, nV),
            pT     = new X3D .Plane3 (C, nT),
            planes = [pU, pV, pT],
            eD     = [pU .getDistanceToPoint (p), pV .getDistanceToPoint (p), pT .getDistanceToPoint (p)],
            min    = eD .reduce ((min, v, i, a) => v < a [min] ? i : min, 0);

         if (eD [min] < Math .abs (this .tool .snapDistance))
            p = planes [min] .getClosestPointToPoint (p);
      }

      {
         // snapping y-Axis.

         const
            o  = this .tool .dimension [1] % 2 * 0.5, // Add a half scale if dimension is odd.
            yr = Math .round (position .y),
            p1 = yr - o,
            p2 = yr + o,
            y  = Math .abs (p1 - position .y) < Math .abs (p2 - position .y) ? p1 : p2;

         if (Math .abs (y - position .y) < Math .abs (this .tool .snapDistance))
            p .y = y;
         else
            p .y = position .y;
      }

      return p;
   }

   getSnapPositionWithNormal (position, direction)
   {
      return position;
   }
}

module .exports = AxonometricGridTool;
