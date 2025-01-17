const X3D = require ("../../X3D");

Object .assign (X3D .Circle2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         browser  = this .getBrowser (),
         geometry = browser .getCircle2DOptions () .getGeometry () .copy (executionContext),
         radius   = this ._radius .getValue ();

      geometry ._coord = geometry ._coord .getValue () .copy (executionContext);

      for (const [i, point] of geometry ._coord .point .entries ())
         geometry ._coord .point [i] = point .multiply (radius);

      geometry ._coord .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
