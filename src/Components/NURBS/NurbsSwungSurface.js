const X3D = require ("../../X3D");

Object .assign (X3D .NurbsSwungSurface .prototype,
{
   traverse (type, renderObject)
   {
      this .getTrajectoryCurve () ?.traverse (type, renderObject);
   },
});
