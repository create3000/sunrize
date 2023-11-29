"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class BoxTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      this .node ._size                     .addInterest ("set_size",      this);
      this .getBrowser () .getBoxOptions () .addInterest ("set_optionNode", this);

      this .tool .linesDisplay = true;

      this .set_size (this .node ._size);
      this .set_optionNode (this .getBrowser () .getBoxOptions ());
   }

   set_size (size)
   {
      const
         x = Math .abs (size .x / 2),
         y = Math .abs (size .y / 2),
         z = Math .abs (size .z / 2);

      this .tool .size = new X3D .Vector3 (x, y, z);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = optionNode .getGeometry () ._coordIndex;
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
   }
}

module .exports = BoxTool;
