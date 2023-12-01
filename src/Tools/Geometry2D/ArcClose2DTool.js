"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors"),
   X3D                 = require ("../../X3D"),
   _                   = require ("../../Application/GetText");

class ArcClose2DTool extends X3DGeometryNodeTool
{
   #transformNode = null;
   #changing      = false;

   async initializeTool ()
   {
      await super .initializeTool ();

      // Transform Tool

      const
         transformNode = this .getToolScene () .createNode ("Transform"),
         transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

      this .#transformNode = transformNode;

      transformNode .scale .addInterest ("set_scale", this);
      transformTool .getField ("isActive") .addInterest ("handleUndo", this);

      transformNode .bboxSize      = new X3D .Vector3 (2, 2, 0);
      transformTool .group         = this .getTypeName ();
      transformTool .undo          = false;
      transformTool .tools         = ["SCALE"];
      transformNode .keys          = [ ];
      transformTool .connectedAxes = ["XY", "YX", "ZX"];
      transformTool .centerDisplay = false;
      transformTool .centerTool    = false;
      transformTool .zAxisDisplay  = false;
      transformTool .bboxColor     = ToolColors .BLUE;

      this .tool .group       = this .getTypeName ();
      this .tool .undo        = true;
      this .tool .addChildren = new X3D .MFNode (transformNode);

      // Connections

      this .node ._radius .addInterest ("set_radius", this);

      this .set_radius (this .node ._radius);
   }

   disposeTool ()
   {
      this .node ._radius .removeInterest ("set_radius", this);

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

      this .node ._radius = (Math .abs (scale .x) + Math .abs (scale .y)) / 2;
   }

   set_radius (radius)
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .#changing = true;

      const r = Math .abs (radius .getValue ());

      this .#transformNode .scale = new X3D .Vector3 (r, r, 1);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["radius"]);
   }

   getUndoDescription (activeTool, name)
   {
      if (name)
         return _ ("Resize Node %s »%s«");

      return _ ("Resize Node %s");
   }
}

module .exports = ArcClose2DTool;
