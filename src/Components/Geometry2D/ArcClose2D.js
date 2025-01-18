const X3D = require ("../../X3D");

Object .assign (X3D .ArcClose2D .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedFaceSet (executionContext, { texCoord: true });

      geometry ._metadata = this ._metadata;
      geometry ._solid    = this ._solid;

      return geometry;
   },
});
