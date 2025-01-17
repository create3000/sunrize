const X3D = require ("../../X3D");

Object .assign (X3D .Cylinder .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         browser   = this .getBrowser (),
         geometry  = browser .getCylinderOptions () .getSideGeometry () .copy (executionContext),
         radius    = this ._radius .getValue (),
         height1_2 = this ._height .getValue () / 2;

      geometry ._normalIndex = [ ];
      geometry ._solid       = this ._solid;
      geometry ._creaseAngle = Math .PI;

      geometry ._texCoord = geometry ._texCoord .getValue () .copy (executionContext);
      geometry ._normal   = null;
      geometry ._coord    = geometry ._coord .getValue () .copy (executionContext);

      for (const point of geometry ._coord .point)
      {
         point .x *= radius;
         point .y *= height1_2;
         point .z *= radius;
      }

      if (!this ._side .getValue ())
      {
         geometry ._texCoordIndex .length = 0;
         geometry ._coordIndex    .length = 0;
      }

      if (this ._top .getValue ())
      {
         for (const index of browser .getCylinderOptions () .getTopGeometry () ._texCoordIndex)
            geometry ._texCoordIndex .push (index);

         for (const index of browser .getCylinderOptions () .getTopGeometry () ._coordIndex)
         {
            if (index < 0)
            {
               geometry ._coordIndex .push (-1);
            }
            else
            {
               geometry ._coordIndex .push (geometry ._coord .point .length);
               geometry ._coord .point .push (geometry ._coord .point [index]);
            }
         }
      }

      if (this ._bottom .getValue ())
      {
         for (const index of browser .getCylinderOptions () .getBottomGeometry () ._texCoordIndex)
            geometry ._texCoordIndex .push (index);

         for (const index of browser .getCylinderOptions () .getBottomGeometry () ._coordIndex)
         {
            if (index < 0)
            {
               geometry ._coordIndex .push (-1);
            }
            else
            {
               geometry ._coordIndex .push (geometry ._coord .point .length);
               geometry ._coord .point .push (geometry ._coord .point [index]);
            }
         }
      }

      // geometry .optimize ();

      geometry ._texCoord .getValue () .setup ();
      geometry ._coord    .getValue () .setup ();
      geometry .setup ();

      return geometry;
   },
});
