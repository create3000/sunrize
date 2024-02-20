"use strict";

const
   X3DGridNodeTool = require ("./X3DGridNodeTool"),
   X3D             = require ("../../X3D");

class GridTool extends X3DGridNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "GridTool.x3d");
   }

   disposeTool ()
   {
      super .disposeTool ();
   }

   getSnapPosition (position)
   {
      const translation = position .copy ();

      for (let i = 0; i < 3; ++ i)
      {
         const value = this .getSnapPositionForAxis (i, position);

         if (Math .abs (value - translation [i]) < Math .abs (this .tool .snapDistance))
            translation [i] = value;
      }

      return translation;
   }

   getSnapPositionForAxis (axis, position)
   {
      const
         o  = this .tool .dimension [axis] % 2 * 0.5, // Add a half scale if dimension is odd.
         p  = Math .round (position [axis]),
         p1 = p - o,
         p2 = p + o;

      return Math .abs (p1 - position [axis]) < Math .abs (p2 - position [axis]) ? p1 : p2;
   }

   getSnapPositionWithNormal (position, direction)
   {
      for (let i = 0; i < 3; ++ i)
      {
         const translation = this .getSnapPositionWithNormalForAxis (i, position, direction);

         if (translation .distance (position) < Math .abs (this .tool .snapDistance))
            return translation;
      }

      return position;
   }

   getSnapPositionWithNormalForAxis (axis, position, direction)
   {
      const
         value = this .getSnapPositionForAxis (axis, position),
         t     = (value - position [axis]) / direction [axis];

      return position .copy () .add (direction .copy () .multiply (t));
   }
}

module .exports = GridTool;
