const X3D = require ("../../X3D");

Object .assign (X3D .X3DNurbsSurfaceGeometryNode .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedFaceSet (executionContext,
      {
         double: !!X3D .X3DCast (X3D .X3DConstants .CoordinateDouble, this ._controlPoint),
         texCoord: true,
      });

      geometry ._metadata    = this ._metadata;
      geometry ._solid       = this ._solid;
      geometry ._creaseAngle = Math .PI;

      return geometry;
   },
});
