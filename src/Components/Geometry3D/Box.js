const X3D = require ("../../X3D");

X3D .Box .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
   const
      browser  = this .getBrowser (),
      geometry = browser .getBoxOptions () .getGeometry () .copy (executionContext),
      size1_2  = this ._size .divide (2);

   geometry ._solid = this ._solid;

   geometry ._texCoord = geometry ._texCoord .getValue () .copy (executionContext);
   geometry ._coord    = geometry ._coord    .getValue () .copy (executionContext);

   for (const [i, point] of geometry ._coord .point .entries ())
      geometry ._coord .point [i] = point .multVec (size1_2);

   geometry ._texCoord .getValue () .setup ();
   geometry ._coord    .getValue () .setup ();
   geometry .setup ();

   return geometry;
};
