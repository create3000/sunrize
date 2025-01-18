const X3D = require ("../../X3D");

Object .assign (X3D .IndexedLineSet .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext)
   {
      const geometry = executionContext .createNode ("PointSet", false);

      geometry ._attrib   = this ._attrib;
      geometry ._fogCoord = this ._fogCoord;

      if (this ._colorPerVertex .getValue ())
         geometry ._color = this ._color;

      geometry ._coord = this ._coord;

      geometry .setup ();

      return geometry;
   },
});
