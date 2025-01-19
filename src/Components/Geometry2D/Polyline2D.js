const X3D = require ("../../X3D");

Object .assign (X3D .Polyline2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedLineSet (executionContext,
      {
         polyline: true,
      });

      geometry ._metadata = this ._metadata;

      return geometry;
   },
});
