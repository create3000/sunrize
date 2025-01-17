const X3D = require ("../../X3D");

Object .assign (X3D .Arc2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         vertices = this .getVertices (),
         geometry = executionContext .createNode ("IndexedLineSet", false);

      geometry ._coord = executionContext .createNode ("Coordinate", false);

      for (let i = 0, length = vertices .length / 8; i < length; ++ i)
         geometry ._coordIndex .push (i);

      geometry ._coordIndex .push (geometry ._coordIndex .at (-1) + 1, -1);

      for (let i = 0, length = vertices .length; i < length; i += 8)
         geometry ._coord .point .push (new X3D .SFVec3f (vertices [i], vertices [i + 1], 0));

      geometry ._coord .point .push (new X3D .SFVec3f (vertices .at (-4), vertices .at (-3), 0));

      geometry ._coord .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
