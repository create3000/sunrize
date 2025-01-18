const X3D = require ("../../X3D");

Object .assign (X3D .LineSet .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext)
   {
      const geometry = executionContext .createNode ("IndexedLineSet", false);

      geometry ._attrib   = this ._attrib;
      geometry ._fogCoord = this ._fogCoord;
      geometry ._color    = this ._color;
      geometry ._tangent  = this ._tangent;
      geometry ._normal   = this ._normal;
      geometry ._coord    = this ._coord;

      let index = 0;

      for (const length of this ._vertexCount)
      {
         if (length < 2)
            continue;

         for (let i = 0; i < length; ++ i, ++ index)
            geometry ._coordIndex .push (index);

         geometry ._coordIndex .push (-1);
      }

      geometry .setup ();

      return geometry;
   },
});
