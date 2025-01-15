const X3D = require ("../../X3D");

X3D .Cone .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
   const
      browser   = this .getBrowser (),
      geometry  = browser .getConeOptions () .getSideGeometry () .copy (executionContext),
      radius    = this ._bottomRadius .getValue (),
      height1_2 = this ._height .getValue () / 2;

   geometry ._solid = this ._solid;

   geometry ._texCoord = geometry ._texCoord .getValue () .copy (executionContext);
   geometry ._normal   = geometry ._normal   .getValue () .copy (executionContext);
   geometry ._coord    = geometry ._coord    .getValue () .copy (executionContext);

   for (const point of geometry ._coord .point)
   {
      point .x *= radius;
      point .y *= height1_2;
      point .z *= radius;
   }

   if (!this ._side .getValue ())
   {
      geometry ._texCoordIndex .length = 0;
      geometry ._normalIndex   .length = 0;
      geometry ._coordIndex    .length = 0;
   }

   if (this ._bottom .getValue ())
   {
      for (const index of browser .getConeOptions () .getBottomGeometry () ._texCoordIndex)
         geometry ._texCoordIndex .push (index);

      for (const index of browser .getConeOptions () .getBottomGeometry () ._normalIndex)
         geometry ._normalIndex .push (index);

      for (const index of browser .getConeOptions () .getBottomGeometry () ._coordIndex)
         geometry ._coordIndex .push (index);
   }

   geometry ._texCoord .getValue () .setup ();
   geometry ._normal   .getValue () .setup ();
   geometry ._coord    .getValue () .setup ();
   geometry .setup ();

   return geometry;
};
