const X3D = require ("../../X3D");

X3D .NurbsSwungSurface .prototype .traverse = function (type, renderObject)
{
   this .getTrajectoryCurve () ?.traverse (type, renderObject);
};
