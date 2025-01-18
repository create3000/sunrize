const X3D = require ("../../X3D");

Object .assign (X3D .X3DNurbsSurfaceGeometryNode .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedFaceSet (executionContext,
      {
         texCoord: true,
      });

      geometry ._solid       = this ._solid;
      geometry ._creaseAngle = Math .PI;

      return geometry;
   },
});
