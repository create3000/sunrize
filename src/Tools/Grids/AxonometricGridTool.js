"use strict";

const
   X3DGridNodeTool = require ("./X3DGridNodeTool"),
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
         triangle = BarycentricTriangle (ToBarycentric (position, As, Bs, Cs)),
         A        = FromBarycentric (triangle [0], As, Bs, Cs),
         B        = FromBarycentric (triangle [1], As, Bs, Cs),
         C        = FromBarycentric (triangle [2], As, Bs, Cs);

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

/**
 * @returns Barycentric coordinates (u, v, w) for @a point with respect to triangle (a, b, c).
 * @param point  in cartesian coordinate system.
 * @param a      first point of triangle.
 * @param b      second point of triangle.
 * @param c      third point of triangle.
 * Type is any type supporting copy constructions.
 */
function ToBarycentric (point, a, b, c)
{
	const
      v0 = b .copy () .subtract (a),
	   v1 = c .copy () .subtract (a),
	   v2 = point .copy () .subtract (a);

	const
      d00   = v0 .dot (v0),
	   d01   = v0 .dot (v1),
	   d11   = v1 .dot (v1),
	   d20   = v2 .dot (v0),
	   d21   = v2 .dot (v1),
	   denom = d00 * d11 - d01 * d01;

	const
      v = (d11 * d20 - d01 * d21) / denom,
	   t = (d00 * d21 - d01 * d20) / denom,
	   u = 1 - v - t;

	return [u, v, t];
}

/**
 * @returns Computes coordinates on triangle defined @a point0, @a point1, @a point2 by from @a barycentric coordinates.
 * @param  point0  first point of triangle.
 * @param  point1  second point of triangle.
 * @param  point2  third point of triangle.
 * @param  barycentric  barycentric vector of triangle.
 */
function FromBarycentric (barycentric, point0, point1, point2)
{
	return point0 .copy () .multiply (barycentric [0])
      .add (point1 .copy () .multiply (barycentric [1]))
      .add (point2 .copy () .multiply (barycentric [2]));
}

/**
 * @param barycentric  barycentric vector within triangle.
 * @returns Returns the vertices of the triangle of an arbitrary barycentric point.
 */
function BarycentricTriangle (barycentric)
{
   const
	   min    = new X3D .Vector3 (... barycentric .map (v => Math .floor (v))),
	   max    = new X3D .Vector3 (... barycentric .map (v => Math .ceil (v))),
	   even   = min .x + min .y + min .z === 0,
	   A      = even ? new X3D .Vector3 (max .x, min .y, min .z) : new X3D .Vector3 (min .x, max .y, max .z),
	   B      = even ? new X3D .Vector3 (min .x, max .y, min .z) : new X3D .Vector3 (max .x, min .y, max .z),
	   C      = even ? new X3D .Vector3 (min .x, min .y, max .z) : new X3D .Vector3 (max .x, max .y, min .z);

	if (min .x === max .x)
	{
		A .x = 1 - A .y - A .z;
		B .x = 1 - B .y - B .z;
		C .x = 1 - C .y - C .z;
	}

	if (min .y === max .y)
	{
		A .y = 1 - A .z - A .x;
		B .y = 1 - B .z - B .x;
		C .y = 1 - C .z - C .x;
	}

	if (min .z === max .z)
	{
		A .z = 1 - A .x - A .y;
		B .z = 1 - B .x - B .y;
		C .z = 1 - C .x - C .y;
	}

	return [A, B, C];
}

module .exports = AxonometricGridTool;
