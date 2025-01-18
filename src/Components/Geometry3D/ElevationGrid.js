const X3D = require ("../../X3D");

Object .assign (X3D .ElevationGrid .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedFaceSet (executionContext,
      {
         fogCoord: !!this ._fogCoord .getValue (),
         color: !!this ._color .getValue (),
         texCoord: true,
         tangent: !!this ._tangent .getValue (),
         normal: !!this ._normal .getValue (),
      });

      geometry ._solid = this ._solid;

      return geometry;
   },
});
