const X3D = require ("../../X3D");

const Barycentric =
{
   /**
    * @param point  in cartesian coordinate system.
    * @param a      first point of triangle.
    * @param b      second point of triangle.
    * @param c      third point of triangle.
    * @returns Barycentric coordinates (u, v, w) for point with respect to triangle (a, b, c).
    */
   to (point, a, b, c)
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
   },
   /**
    * @param  point0  first point of triangle.
    * @param  point1  second point of triangle.
    * @param  point2  third point of triangle.
    * @param  barycentric  barycentric vector of triangle.
    * @returns Computes coordinates on triangle defined point0, point1, point2 by from barycentric coordinates.
    */
   from (barycentric, point0, point1, point2)
   {
      return point0 .copy () .multiply (barycentric [0])
         .add (point1 .copy () .multiply (barycentric [1]))
         .add (point2 .copy () .multiply (barycentric [2]));
   },
   /**
    * @param barycentric  barycentric vector within triangle.
    * @returns Returns the vertices of the triangle of an arbitrary barycentric point.
    */
   triangle (barycentric)
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
   },
};

module .exports = Barycentric;
