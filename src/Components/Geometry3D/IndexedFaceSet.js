const X3D = require ("../../X3D");

Object .assign (X3D .IndexedFaceSet .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = executionContext .createNode ("IndexedLineSet", false);

      geometry ._colorPerVertex = this ._colorPerVertex;
      geometry ._attrib         = this ._attrib;
      geometry ._fogCoord       = this ._fogCoord;
      geometry ._color          = this ._color;
      geometry ._coord          = this ._coord;

      if (this ._coordIndex .length)
      {
         // The coord index must end with -1!

         const lineIndex = new Set ();

         const
            colorIndex = geometry ._colorIndex,
            coordIndex = geometry ._coordIndex;

         let
            line  = false,
            last  = -1,
            first = 0,
            face  = 0;

         for (let i = 1, length = this ._coordIndex .length; i < length; ++ i)
         {
            const
               p        = i - 1,
               previous = this ._coordIndex [p];

            let
               index = this ._coordIndex [i],
               c     = i;

            if (index === -1)
            {
               index = this ._coordIndex [first];
               c     = first;
            }

            const
               minMax = `${Math .min (previous, index)} ${Math .max (previous, index)}`,
               exists = lineIndex .has (minMax);

            if (!exists)
               lineIndex .add (minMax);

            if ((previous === -1 || exists) && line)
            {
               if (this ._colorIndex .length)
               {
                  if (this ._colorPerVertex .getValue ())
                     colorIndex .push (-1);
                  else
                     colorIndex .push (this .getColorPerFaceIndex (face));
               }

               coordIndex .push (-1);

               line = false;
            }

            if (previous === -1)
            {
               first = i;
               face += 1;
               last  = -1;
               continue;
            }

            if (exists)
               continue;

            if (last !== previous)
            {
               if (this ._colorIndex .length)
               {
                  if (this ._colorPerVertex .getValue ())
                     colorIndex .push (this .getColorPerVertexIndex (p));
               }

               coordIndex .push (previous);
            }

            if (this ._colorIndex .length)
            {
               if (this ._colorPerVertex .getValue ())
                  colorIndex .push (this .getColorPerVertexIndex (c));
            }

            coordIndex .push (index);

            last = index;
            line = true;
         }
      }

      geometry .setup ();

      return geometry;
   },
});
