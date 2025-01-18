const X3D = require ("../../X3D");

Object .assign (X3D .TriangleSet2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         texCoords = this .getTexCoords (),
         vertices  = this .getVertices (),
         geometry  = executionContext .createNode ("IndexedFaceSet", false);

      geometry ._metadata = this ._metadata;
      geometry ._solid    = this ._solid;

      geometry ._texCoord = executionContext .createNode ("TextureCoordinate", false);
      geometry ._coord    = executionContext .createNode ("Coordinate",        false);

      for (let i = 0, length = vertices .length / 12; i < length; ++ i)
         geometry ._coordIndex .push (i * 3, i * 3 + 1, i * 3 + 2, -1);

      for (let i = 0, length = vertices .length; i < length; i += 4)
      {
         geometry ._texCoord .point .push (new X3D .SFVec2f (texCoords [i], texCoords [i + 1]));
         geometry ._coord    .point .push (new X3D .SFVec3f (vertices  [i], vertices  [i + 1], 0));
      }

      geometry ._texCoord .getValue () .setup ();
      geometry ._coord    .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
