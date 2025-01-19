const X3D = require ("../../X3D");

Object .assign (X3D .X3DGeometryNode .prototype,
{
   toIndexedLineSet (executionContext = this .getExecutionContext (), options = { })
   {
      const geometry = executionContext .createNode ("IndexedLineSet", false);

      // Coordinate

      const [coordIndex, points] = this .mergePoints (this .getVertices ());

      geometry ._coordIndex   = coordIndex .flatMap ((index, i) => i % 2 === 1 ? [index, -1] : index);
      geometry ._coord        = executionContext .createNode (options .double ? "CoordinateDouble" : "Coordinate", false);
      geometry ._coord .point = points .filter ((point, i) => i % 4 < 3);

      // Setup

      geometry ._coord .getValue () ?.setup ();
      geometry .setup ();

      return geometry;
   },
   toIndexedFaceSet (executionContext = this .getExecutionContext (), options = { })
   {
      const geometry = executionContext .createNode ("IndexedFaceSet", false);

      // Coordinate

      const [coordIndex, points] = this .mergePoints (this .getVertices ());

      geometry ._coordIndex   = coordIndex .flatMap ((index, i) => i % 3 === 2 ? [index, -1] : index);
      geometry ._coord        = executionContext .createNode (options .double ? "CoordinateDouble" : "Coordinate", false);
      geometry ._coord .point = points .filter ((p, i) => i % 4 < 3);

      // Tangent

      if (options .fogCoord)
      {
         geometry ._fogCoord        = executionContext .createNode ("FogCoordinate", false);
         geometry ._fogCoord .depth = this .getFogDepths ();
      }

      // Color

      if (options .color)
      {
         const [colorIndex, colors] = this .mergePoints (this .getColors ());

         geometry ._colorIndex = colorIndex .flatMap ((index, i) => i % 3 === 2 ? [index, -1] : index);

         if (geometry ._colorIndex .equals (geometry ._coordIndex))
            geometry ._colorIndex = [ ];

         if (colors .some ((p, i)=> i === 3 && p !== 1))
         {
            geometry ._color        = executionContext .createNode ("ColorRGBA", false);
            geometry ._color .color = colors;
         }
         else
         {
            geometry ._color        = executionContext .createNode ("Color", false);
            geometry ._color .color = colors .filter ((p, i) => i % 4 < 3);
         }
      }

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

      // Tangent

      if (options .tangent)
      {
         // TODO: Implement Tangent
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

      geometry ._fogCoord .getValue () ?.setup ();
      geometry ._color    .getValue () ?.setup ();
      geometry ._texCoord .getValue () ?.setup ();
      geometry ._tangent  .getValue () ?.setup ();
      geometry ._normal   .getValue () ?.setup ();
      geometry ._coord    .getValue () ?.setup ();
      geometry .setup ();

      return geometry;
   },
   mergePoints (array)
   {
      const
         index  = [ ],
         points = [ ],
         map    = new Map (),
         length = array .length;

      for (let i = 0; i < length; i += 4)
      {
         const key = `${array [i]} ${array [i + 1]} ${array [i + 2]} ${array [i + 3]}`;

         if (map .has (key))
         {
            index .push (map .get (key));
         }
         else
         {
            const l = points .length / 4;

            map .set (key, l);
            index .push (l);
            points .push (array [i], array [i + 1], array [i + 2], array [i + 3]);
         }
      }

      return [index, points];
   },
});
