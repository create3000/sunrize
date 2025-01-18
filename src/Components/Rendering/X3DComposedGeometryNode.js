const X3D = require ("../../X3D");

Object .assign (X3D .X3DComposedGeometryNode .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext)
   {
      return this .toIndexedFaceSet (executionContext,
      {
         double: !!X3D .X3DCast (X3D .X3DConstants .CoordinateDouble, this ._coord),
         fogCoord: !!this ._fogCoord .getValue (),
         color: !!this ._color .getValue (),
         texCoord: !!this ._texCoord .getValue (),
         tangent: !!this ._tangent .getValue (),
         normal: !!this ._normal .getValue (),
      });
   },
});
