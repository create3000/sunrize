const X3D = require ("../../X3D");

X3D .Extrusion .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
   const
      geometry = executionContext .createNode ("IndexedFaceSet"),
      texCoord = executionContext .createNode ("TextureCoordinate"),
      coord    = executionContext .createNode ("Coordinate");

   geometry .solid       = this ._solid;
   geometry .ccw         = this ._ccw;
   geometry .convex      = this ._convex;
   geometry .creaseAngle = this ._creaseAngle;

   geometry .texCoord = texCoord;
   geometry .coord    = coord;

   // Fill the geometry with points.

   const points = this .createPoints ();

   const
      numSpines          = this ._spine .length,
      numCrossSections   = this ._crossSection .length,
      numSpines_1        = numSpines - 1,
      numCrossSections_1 = numCrossSections - 1;

   if (numSpines < 2 || numCrossSections < 2)
      return geometry;

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

         geometry .coordIndex .push (p0, p1, p2, -1, p0, p2, p3, -1);
      }
   }

   coord .point = points .flatMap (point => [... point]);

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

         geometry .texCoordIndex .push (p0, p1, p2, -1, p0, p2, p3, -1);
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

   texCoord .point = texCoordPoints;

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

      const numCoords = coord .point .length;

      for (let c = numCapPoints - 1; c >= 0; -- c)
         coord .point .push (coord .point [c]);

      for (let c = 0; c < numCapPoints; ++ c)
         geometry .coordIndex .push (numCoords + c);

      geometry .coordIndex .push (-1);

      // Texture coordinates

      const numTexCoords = texCoord .point .length;

      for (let c = numCapPoints - 1; c >= 0; -- c)
         texCoord .point .push (this ._crossSection [c] .subtract (min) .divide (capMax));

      for (let c = 0; c < numCapPoints; ++ c)
         geometry .texCoordIndex .push (numTexCoords + c);

      geometry .texCoordIndex .push (-1);
   }

   // End Cap

   if (this ._endCap .getValue ())
   {
      // Coordinates

      const first = numSpines * numCrossSections - numCrossSections;

      const numCoords = coord .point .length;

      for (let c = 0; c < numCapPoints; ++ c)
         coord .point .push (coord .point [first + c]);

      for (let c = 0; c < numCapPoints; ++ c)
         geometry .coordIndex .push (numCoords + c);

      geometry .coordIndex .push (-1);

      // Texture coordinates

      const numTexCoords = texCoord .point .length;

      for (let c = 0; c < numCapPoints; ++ c)
         texCoord .point .push (this ._crossSection [c] .subtract (min) .divide (capMax));

      for (let c = 0; c < numCapPoints; ++ c)
         geometry .texCoordIndex .push (numTexCoords + c);

      geometry .texCoordIndex .push (-1);
   }

   // geometry .getValue () .optimize ();

   return geometry;
};
