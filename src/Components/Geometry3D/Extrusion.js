const X3D = require ("../../X3D");

Object .assign (X3D .Extrusion .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         geometry = executionContext .createNode ("IndexedFaceSet",    false),
         texCoord = executionContext .createNode ("TextureCoordinate", false),
         coord    = executionContext .createNode ("Coordinate",        false);

      geometry ._solid       = this ._solid;
      geometry ._ccw         = this ._ccw;
      geometry ._convex      = this ._convex;
      geometry ._creaseAngle = this ._creaseAngle;

      geometry ._texCoord = texCoord;
      geometry ._coord    = coord;

      // Fill the geometry with points.

      const points = this .createPoints ();

      const
         numSpines          = this ._spine .length,
         numCrossSections   = this ._crossSection .length,
         numSpines_1        = numSpines - 1,
         numCrossSections_1 = numCrossSections - 1;

      if (numSpines < 2 || numCrossSections < 2)
      {
         texCoord .setup ();
         coord    .setup ();
         geometry .setup ();

         return geometry;
      }

      const closedSpine = this .getClosed (this ._spine)
         && this .getClosed (this ._orientation)
         && this .getClosed (this ._scale);

      const closedCrossSection = this .getClosed (this ._crossSection);

      // Coordinates

      for (let s = 0; s < numSpines_1; ++ s)
      {
         for (let c = 0; c < numCrossSections_1; ++ c)
         {
            /* 0---3
             * |\  |
             * | \ |
             * |__\|
             * 1   2
             */

            const
               c1 = closedCrossSection ? (c + 1) % numCrossSections_1 : c + 1,
               s1 = closedSpine        ? (s + 1) % numSpines_1        : s + 1;

            const
               p0 = s * numCrossSections + c,
               p1 = s * numCrossSections + c1,
               p2 = s1 * numCrossSections + c1,
               p3 = s1 * numCrossSections + c;

            geometry ._coordIndex .push (p0, p1, p2, -1, p0, p2, p3, -1);
         }
      }

      coord ._point = points .flatMap (point => [... point]);

      // Texture coordinates

      for (let s = 0; s < numSpines_1; ++ s)
      {
         for (let c = 0; c < numCrossSections_1; ++ c)
         {
            const
               c1 = c + 1,
               s1 = s + 1;

            const
               p0 = s * numCrossSections + c,
               p1 = s * numCrossSections + c1,
               p2 = s1 * numCrossSections + c1,
               p3 = s1 * numCrossSections + c;

            geometry ._texCoordIndex .push (p0, p1, p2, -1, p0, p2, p3, -1);
         }
      }

      const texCoordPoints = [ ];

      for (let s = 0; s < numSpines; ++ s)
      {
         for (let c = 0; c < numCrossSections; ++ c)
         {
            const
               tx = c / numCrossSections_1,
               ty = s / numSpines_1;

            texCoordPoints .push (tx, ty);
         }
      }

      texCoord ._point = texCoordPoints;

      // Caps

      let min = max = this ._crossSection [0];

      for (let c = 1; c < numCrossSections; ++ c)
      {
         min = min .min (this ._crossSection [c]);
         max = max .max (this ._crossSection [c]);
      }

      const
         capSize      = max .subtract (min),
         capMax       = Math .max (capSize .x, capSize .y),
         numCapPoints = closedCrossSection ? numCrossSections_1 : numCrossSections;

      // Begin Cap

      if (this ._beginCap .getValue ())
      {
         // Coordinates

         const numCoords = coord ._point .length;

         for (let c = numCapPoints - 1; c >= 0; -- c)
            coord ._point .push (coord ._point [c]);

         for (let c = 0; c < numCapPoints; ++ c)
            geometry ._coordIndex .push (numCoords + c);

         geometry ._coordIndex .push (-1);

         // Texture coordinates

         const numTexCoords = texCoord ._point .length;

         for (let c = numCapPoints - 1; c >= 0; -- c)
            texCoord ._point .push (this ._crossSection [c] .subtract (min) .divide (capMax));

         for (let c = 0; c < numCapPoints; ++ c)
            geometry ._texCoordIndex .push (numTexCoords + c);

         geometry ._texCoordIndex .push (-1);
      }

      // End Cap

      if (this ._endCap .getValue ())
      {
         // Coordinates

         const first = numSpines * numCrossSections - numCrossSections;

         const numCoords = coord ._point .length;

         for (let c = 0; c < numCapPoints; ++ c)
            coord ._point .push (coord ._point [first + c]);

         for (let c = 0; c < numCapPoints; ++ c)
            geometry ._coordIndex .push (numCoords + c);

         geometry ._coordIndex .push (-1);

         // Texture coordinates

         const numTexCoords = texCoord ._point .length;

         for (let c = 0; c < numCapPoints; ++ c)
            texCoord ._point .push (this ._crossSection [c] .subtract (min) .divide (capMax));

         for (let c = 0; c < numCapPoints; ++ c)
            geometry ._texCoordIndex .push (numTexCoords + c);

         geometry ._texCoordIndex .push (-1);
      }

      // geometry ._optimize ();

      texCoord .setup ();
      coord    .setup ();
      geometry .setup ();

      return geometry;
   },
});
