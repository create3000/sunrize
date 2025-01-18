const X3D = require ("../../X3D");

Object .assign (X3D .X3DGeometryNode .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext (), options = { })
   {
      const geometry = executionContext .createNode ("IndexedFaceSet", false);

      // Coordinate

      const [coordIndex, points] = this .mergePoints (this .getVertices ());

      geometry ._coordIndex   = coordIndex .flatMap ((index, i) => i % 3 === 2 ? [index, -1] : index);
      geometry ._coord        = executionContext .createNode ("Coordinate", false);
      geometry ._coord .point = points .filter ((p, i) => i % 4 < 3);

      // TextureCoordinate

      if (options .texCoord)
      {
         const [texCoordIndex, texCoords] = this .mergePoints (this .getTexCoords ());

         geometry ._texCoordIndex = texCoordIndex .flatMap ((index, i) => i % 3 === 2 ? [index, -1] : index);

         if (geometry ._texCoordIndex .equals (geometry ._coordIndex))
            geometry ._texCoordIndex = [ ];

         if (texCoords .some ((p, i)=> (i === 2 && p !== 0) || (i === 3 && p !== 1)))
         {
            geometry ._texCoord        = executionContext .createNode ("TextureCoordinate3D", false);
            geometry ._texCoord .point = texCoords;
         }
         else
         {
            geometry ._texCoord        = executionContext .createNode ("TextureCoordinate", false);
            geometry ._texCoord .point = texCoords .filter ((p, i) => i % 4 < 2);
         }
      }

      // Normal

      if (options .normal)
      {
         const [normalIndex, normals] = this .mergePoints (this .getNormals ());

         geometry ._normalIndex   = normalIndex .flatMap ((index, i) => i % 3 === 2 ? [index, -1] : index);
         geometry ._normal        = executionContext .createNode ("Normal", false);
         geometry ._normal .point = normals;

         if (geometry ._normalIndex .equals (geometry ._coordIndex))
            geometry ._normalIndex = [ ];
      }

      // Setup

      geometry ._texCoord .getValue () .setup ();
      geometry ._coord    .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
   mergePoints (array)
   {
      const
         index       = [ ],
         points      = new X3D .MFVec4f (),
         pointsIndex = new Map (),
         length      = array .length;

      for (let i = 0; i < length; i += 4)
      {
         const p = new X3D .SFVec4f (array [i], array [i + 1], array [i + 2], array [i + 3]);

         if (!pointsIndex .has (p .toString ()))
         {
            pointsIndex .set (p .toString (), points .length);
            points .push (p);
         }

         index .push (pointsIndex .get (p .toString ()));
      }

      return [index, points .flat ()];
   },
});
