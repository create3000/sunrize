const X3D = require ("../../X3D");

Object .assign (X3D .NurbsSweptSurface .prototype,
{
   traverse (type, renderObject)
   {
      this .getTrajectoryCurve () ?.traverse (type, renderObject);
   },
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = this .toIndexedFaceSet (executionContext,
      {
         double: true,
         texCoord: true,
      });

      geometry ._metadata    = this ._metadata;
      geometry ._solid       = this ._solid;
      geometry ._ccw         = this ._ccw;
      geometry ._creaseAngle = Math .PI;

      return geometry;
   },
});
