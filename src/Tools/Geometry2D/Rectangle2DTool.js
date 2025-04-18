"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D"),
   _                   = require ("../../Application/GetText");

class Rectangle2DTool extends X3DGeometryNodeTool
{
   #transformNode = null;
   #changing      = false;

   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      // Transform Tool

      const
         groupNode     = this .getToolScene () .createNode ("Group"),
         transformNode = this .getToolScene () .createNode ("Transform"),
         transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

      this .#transformNode = transformNode;

      transformNode .scale .addInterest ("set_scale", this);
      transformNode .scale .addFieldInterest (this .tool .size);
      transformTool .getField ("isActive") .addInterest ("handleUndo", this);

      groupNode     .bboxSize      = new X3D .Vector3 (2, 2, 0);
      transformNode .children      = [groupNode];
      transformTool .group         = this .getTypeName ();
      transformTool .undo          = false;
      transformTool .tools         = ["SCALE"];
      transformTool .keys          = ["SHIFT"];
      transformTool .centerDisplay = false;
      transformTool .centerTool    = false;
      transformTool .zAxisDisplay  = false;
      transformTool .bboxEvents    = false;
      transformTool .bboxDisplay   = false;

      this .tool .group       = this .getTypeName ();
      this .tool .undo        = true;
      this .tool .addChildren = new X3D .MFNode (transformNode);

      // Connections

      this .node ._size                             .addInterest ("set_size",       this);
      this .getBrowser () .getRectangle2DOptions () .addInterest ("set_optionNode", this);

      this .set_size (this .node ._size);
      this .set_optionNode (this .getBrowser () .getRectangle2DOptions ());
   }

   disposeTool ()
   {
      this .node ._size                             .removeInterest ("set_size",       this);
      this .getBrowser () .getRectangle2DOptions () .removeInterest ("set_optionNode", this);

      super .disposeTool ();
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

      this .node ._size = new X3D .Vector2 (scale .x, scale .y) .abs () .multiply (2);
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
         y = Math .abs (size .y / 2);

      this .#transformNode .scale = new X3D .Vector3 (x, y, 1);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = [0, 1, 2, 3, 0, -1];
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["size"]);
   }

   getUndoDescription (activeTool, name)
   {
      if (name)
         return _("Resize Node %s »%s«");

      return _("Resize Node %s");
   }
}

module .exports = Rectangle2DTool;
