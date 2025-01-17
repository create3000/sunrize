const X3D = require ("../../X3D");

Object .assign (X3D .Polypoint2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = executionContext .createNode ("PointSet", false);

      geometry ._coord = executionContext .createNode ("Coordinate", false);

      for (const point of this ._point)
         geometry ._coord .point .push (new X3D .SFVec3f (... point, 0));

      geometry ._coord .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
