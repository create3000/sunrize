const X3D = require ("../../X3D");

X3D .ElevationGrid .prototype .toPrimitive = function (executionContext = this .getExecutionContext ())
{
   const
      coordIndex = this .createCoordIndex (),
      points     = this .createPoints (),
      coord      = executionContext .createNode ("Coordinate", false),
      geometry   = executionContext .createNode ("IndexedFaceSet", false);

   geometry ._solid           = this ._solid;
   geometry ._ccw             = this ._ccw;
   geometry ._creaseAngle     = this ._creaseAngle;
   geometry ._colorPerVertex  = this ._colorPerVertex;
   geometry ._normalPerVertex = this ._normalPerVertex;

   geometry ._coordIndex = coordIndex .map ((index, i) => i % 3 === 2 ? [index, -1] : index) .flat ();
   geometry ._fogCoord   = this ._fogCoord;
   geometry ._color      = this ._color;
   geometry ._texCoord   = this ._texCoord;
   geometry ._tangent    = this ._tangent;
   geometry ._normal     = this ._normal ;
   geometry ._coord      = coord;

   coord ._point = points .flatMap (point => [... point]);

   coord    .setup ();
   geometry .setup ();

   return geometry;
};
