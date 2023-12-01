"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class BoxTool extends X3DGeometryNodeTool
{
   #transformNode = null;
   #changing      = false;

   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      const
         transformNode = this .getToolScene () .createNode ("Transform"),
         transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

      this .#transformNode = transformNode;

      transformNode .scale .addInterest ("set_scale", this);
      transformNode .scale .addFieldInterest (this .tool .size);
      transformTool .getField ("isActive") .addInterest ("handleUndo", this);

      transformNode .bboxSize     = new X3D .Vector3 (2, 2, 2);
      transformTool .group        = "Box";
      transformTool .undo         = false;
      transformTool .tools        = ["SCALE"];
      transformTool .centerTool   = false;
      transformTool .zAxisDisplay = false;
      transformTool .bboxDisplay  = false;

      this .tool .group       = "Box";
      this .tool .undo        = true;
      this .tool .addChildren = new X3D .MFNode (transformNode);

      this .node ._size                     .addInterest ("set_size",       this);
      this .getBrowser () .getBoxOptions () .addInterest ("set_optionNode", this);

      this .set_size (this .node ._size);
      this .set_optionNode (this .getBrowser () .getBoxOptions ());
   }

   disposeTool ()
   {
      this .node ._size                     .removeInterest ("set_size",       this);
      this .getBrowser () .getBoxOptions () .removeInterest ("set_optionNode", this);
   }

   getTransformTool ()
   {
      return this .#transformNode .getValue () .getTool ();
   }

   set_scale (scale)
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .#changing = true;

      this .node ._size = new X3D .Vector3 (scale .x * 2, scale .y * 2, scale .z * 2);
   }

   set_size (size)
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .#changing = true;

      const
         x = Math .abs (size .x / 2),
         y = Math .abs (size .y / 2),
         z = Math .abs (size .z / 2);

      this .#transformNode .scale = new X3D .Vector3 (x, y, z);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = optionNode .getGeometry () ._coordIndex;
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
   }
}

module .exports = BoxTool;
