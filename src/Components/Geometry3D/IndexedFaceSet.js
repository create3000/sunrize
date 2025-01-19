const X3D = require ("../../X3D");

Object .assign (X3D .IndexedFaceSet .prototype,
{
   toPrimitive (executionContext = this .getExecutionContext ())
   {
      const geometry = executionContext .createNode ("IndexedLineSet", false);

      geometry ._metadata       = this ._metadata;
      geometry ._colorPerVertex = this ._colorPerVertex;
      geometry ._attrib         = this ._attrib;
      geometry ._fogCoord       = this ._fogCoord;
      geometry ._color          = this ._color;
      geometry ._coord          = this ._coord;

      if (this ._normalPerVertex .getValue ())
      {
         if (!this ._normalIndex .length || this ._normalIndex .equals (this ._coordIndex))
         {
            geometry ._tangent = this ._tangent;
            geometry ._normal  = this ._normal;
         }
      }

      // The coord index must end with -1!

      const
         lineIndex  = new Set (),
         colorIndex = geometry ._colorIndex,
         coordIndex = geometry ._coordIndex,
         length     = this ._coordIndex .length;

      let
         line  = false,
         last  = -1,
         first = 0,
         face  = 0;

      for (let i = 1; i < length; ++ i)
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
            if (this ._color .getValue ())
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
            if (this ._color .getValue ())
            {
               if (this ._colorPerVertex .getValue ())
                  colorIndex .push (this .getColorPerVertexIndex (p));
            }

            coordIndex .push (previous);
         }

         if (this ._color .getValue ())
         {
            if (this ._colorPerVertex .getValue ())
               colorIndex .push (this .getColorPerVertexIndex (c));
         }

         coordIndex .push (index);

         last = index;
         line = true;
      }

      geometry .setup ();

      return geometry;
   },
});
