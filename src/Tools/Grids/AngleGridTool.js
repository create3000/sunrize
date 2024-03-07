"use strict";

const
   X3DGridNodeTool = require ("./X3DGridNodeTool"),
   X3D             = require ("../../X3D");

class AngleGridTool extends X3DGridNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool (__dirname, "AngleGridTool.x3d");
   }

   getSnapPosition (position, snapY)
   {
      const
         offset      = Math .PI / 2,
         translation = position .copy ();

      // Calculate snapping radius and snapping angle

      const
         complex    = new X3D .Complex (translation .x, translation .z),
         phi        = 2 * Math .PI / this .tool .dimension [1],
         radius     = complex .magnitude,
         angle      = complex .angle;

      let
         snapRadius = Math .round (radius),
         snapAngle  = Math .round ((angle - offset) / phi) * phi + offset;

      if (Math .abs (snapRadius - radius) > Math .abs (this .tool .snapDistance))
         snapRadius = radius;

      if (Math .abs (snapAngle - angle) > Math .abs (this .tool .snapDistance * phi) || this .tool .dimension [1] === 0)
         snapAngle = angle;

      const snapPolar = X3D .Complex .Polar (snapRadius, snapAngle);

      translation .x = snapPolar .real;
      translation .z = snapPolar .imag;

      const y = this .getSnapPositionY (translation .y);

      if (snapY)
      {
         if (Math .abs (y - translation .y) < Math .abs (this .tool .snapDistance))
            translation .y = y;
      }

      if (snapRadius === radius && snapAngle === angle && translation .y !== y)
         return position;

      return translation;
   }

   getSnapPositionWithNormal (position, direction)
   {
      return position;
   }

   getSnapPositionY (position)
   {
      const
         o  = this .tool .dimension [2] % 2 * 0.5, // Add a half scale if dimension is odd.
         p  = Math .round (position),
         p1 = p - o,
         p2 = p + o;

      return Math .abs (p1 - position) < Math .abs (p2 - position) ? p1 : p2;
   }
}

module .exports = AngleGridTool;
