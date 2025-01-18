const X3D = require ("../../X3D");

Object .assign (X3D .Disk2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const
         innerRadius = Math .min (Math .abs (this ._innerRadius .getValue ()), Math .abs (this ._outerRadius .getValue ())),
         outerRadius = Math .max (Math .abs (this ._innerRadius .getValue ()), Math .abs (this ._outerRadius .getValue ()));

      if (innerRadius === outerRadius)
      {
         // Point

         if (outerRadius === 0)
         {
            const geometry = executionContext .createNode ("PointSet", false);

            geometry ._coord = executionContext .createNode ("Coordinate", false);

            geometry ._coord .point .push (new X3D .SFVec3f ());

            geometry ._coord .getValue () .setup ();
            geometry .setup ();

            return geometry;
         }

         // Circle

         const
            browser  = this .getBrowser (),
            geometry = browser .getCircle2DOptions () .getGeometry () .copy (executionContext);

         geometry ._coord = geometry ._coord .getValue () .copy (executionContext);

         for (const [i, point] of geometry ._coord .point .entries ())
            geometry ._coord .point [i] = point .multiply (outerRadius);

         geometry ._coord .getValue () .setup ();
         geometry .setup ();

         return geometry;
      }

      const geometry = this .toIndexedFaceSet (executionContext, { texCoord: true });

      geometry ._solid = this ._solid;

      return geometry;
   },
});
