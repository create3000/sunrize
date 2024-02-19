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

   getGridSnapPosition (position)
   {
      const translation = position .copy ();

      for (let i = 0; i < 3; ++ i)
      {
         const value = this .getGridSnapPositionForAxis (i, position);

         if (Math .abs (value - translation [i]) < Math .abs (this .tool .snapDistance))
            translation [i] = value;
      }

      return translation;
   }

   getGridSnapPositionForAxis (axis, position)
   {
      const
         o  = this .tool .dimension [axis] % 2 * 0.5, // Add a half scale if dimension is odd.
         p  = Math .round (position [axis]),
         p1 = p - o,
         p2 = p + o;

      return Math .abs (p1 - position [axis]) < Math .abs (p2 - position [axis]) ? p1 : p2;
   }
}

module .exports = GridTool;
