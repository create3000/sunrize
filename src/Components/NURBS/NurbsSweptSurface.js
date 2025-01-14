const X3D = require ("../../X3D");

X3D .NurbsSweptSurface .prototype .traverse = function (type, renderObject)
{
   this .getTrajectoryCurve () ?.traverse (type, renderObject);
};
