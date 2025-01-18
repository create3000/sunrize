const X3D = require ("../../X3D");

Object .assign (X3D .NurbsCurve .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedLineSet (executionContext,
      {
         double: !!X3D .X3DCast (X3D .X3DConstants .CoordinateDouble, this ._controlPoint),
      });

      geometry ._metadata = this ._metadata;
      
      return geometry;
   },
});
