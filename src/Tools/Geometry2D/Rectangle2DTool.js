"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class Rectangle2DTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      this .node ._size                             .addInterest ("set_size",       this);
      this .getBrowser () .getRectangle2DOptions () .addInterest ("set_optionNode", this);

      this .tool .linesDisplay = true;

      this .set_size (this .node ._size);
      this .set_optionNode (this .getBrowser () .getRectangle2DOptions ());
   }

   set_size (size)
   {
      const
         x = Math .abs (size .x / 2),
         y = Math .abs (size .y / 2);

      this .tool .size = new X3D .Vector3 (x, y, 1);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = [0, 1, 2, 3, 0, -1];
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
   }
}

module .exports = Rectangle2DTool;
