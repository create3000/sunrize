const X3D = require ("../../X3D");

Object .assign (X3D .X3DComposedGeometryNode .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext)
   {
      const geometry = executionContext .createNode ("IndexedFaceSet", false);

      geometry ._solid           = this ._solid;
      geometry ._ccw             = this ._ccw;
      geometry ._creaseAngle     = Math .PI;
      geometry ._colorPerVertex  = this ._colorPerVertex;
      geometry ._normalPerVertex = this ._normalPerVertex;

      geometry ._attrib   = this ._attrib;
      geometry ._fogCoord = this ._fogCoord;
      geometry ._color    = this ._color;
      geometry ._tangent  = this ._tangent;
      geometry ._normal   = this ._normal;
      geometry ._coord    = this ._coord;

      let
         verticesPerPolygon = this .getVerticesPerPolygon (),
         numVertices        = this .getNumVertices ();

      // Set size to a multiple of vertexCount.
      numVertices -= numVertices % verticesPerPolygon;

      for (let i = 0; i < numVertices; ++ i)
      {
         const index = this .getPolygonIndex (i);

         geometry ._coordIndex .push (index);

         if (i % verticesPerPolygon === verticesPerPolygon - 1)
            geometry ._coordIndex .push (-1);
      }

      geometry .setup ();

      return geometry;
   },
});
