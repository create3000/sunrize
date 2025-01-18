const X3D = require ("../../X3D");

Object .assign (X3D .ArcClose2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = X3D .X3DGeometryNode .prototype .toPrimitive .call (this, executionContext, { texCoord: true });

      geometry ._solid = this ._solid;

      return geometry;
   },
});
