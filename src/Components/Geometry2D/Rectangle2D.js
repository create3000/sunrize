const X3D = require ("../../X3D");

Object .assign (X3D .Rectangle2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         browser  = this .getBrowser (),
         geometry = browser .getRectangle2DOptions () .getGeometry () .copy (executionContext),
         size1_2  = new X3D .SFVec3f (... this ._size .divide (2), 1);

      geometry ._solid = this ._solid;

      geometry ._texCoord = geometry ._texCoord .getValue () .copy (executionContext);
      geometry ._coord    = geometry ._coord    .getValue () .copy (executionContext);

      for (const [i, point] of geometry ._coord .point .entries ())
         geometry ._coord .point [i] = point .multVec (size1_2);

      geometry ._texCoord .getValue () .setup ();
      geometry ._coord    .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
