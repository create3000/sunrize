const X3D = require ("../../X3D");

X3D .Sphere .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
   const
      browser  = this .getBrowser (),
      geometry = browser .getSphereOptions () .getGeometry () .copy (executionContext),
      radius   = this ._radius .getValue ();

   geometry ._texCoord = geometry ._texCoord .getValue () .copy (executionContext);
   geometry ._coord    = geometry ._coord    .getValue () .copy (executionContext);

   for (const [i, point] of geometry ._coord .point .entries ())
      geometry ._coord .point [i] = point .multiply (radius);

   geometry ._texCoord .getValue () .setup ();
   geometry ._coord    .getValue () .setup ();
   geometry .setup ();

   return geometry;
};
