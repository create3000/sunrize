"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors"),
   X3D                 = require ("../../X3D"),
   _                   = require ("../../Application/GetText");

class SphereTool extends X3DGeometryNodeTool
{
   #transformNode = null;
   #changing      = false;

   async initializeTool ()
   {
      await super .initializeTool ("CUSTOM");

      // Transform Tool

      const
         transformNode = this .getToolScene () .createNode ("Transform"),
         transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

      this .#transformNode = transformNode;

      transformNode .scale .addInterest ("set_scale", this);
      transformNode .scale .addFieldInterest (this .tool .size);
      transformTool .getField ("isActive") .addInterest ("handleUndo", this);

      transformNode .bboxSize      = new X3D .Vector3 (2, 2, 2);
      transformTool .group         = "Sphere";
      transformTool .undo          = false;
      transformTool .tools         = ["SCALE"];
      transformTool .connectedAxes = ["XY", "XZ", "YX", "YZ", "ZX", "ZY"];
      transformTool .centerTool    = false;
      transformTool .bboxColor     = ToolColors .BLUE;

      this .tool .group       = "Sphere";
      this .tool .undo        = true;
      this .tool .addChildren = new X3D .MFNode (transformNode);

      // Connections

      this .node ._radius                      .addInterest ("set_radius",     this);
      this .getBrowser () .getSphereOptions () .addInterest ("set_optionNode", this);

      this .set_radius (this .node ._radius);
      this .set_optionNode (this .getBrowser () .getSphereOptions ());
   }

   disposeTool ()
   {
      this .node ._radius                      .removeInterest ("set_radius",     this);
      this .getBrowser () .getSphereOptions () .removeInterest ("set_optionNode", this);
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

      this .node ._radius = (Math .abs (scale .x) + Math .abs (scale .y) + Math .abs (scale .z)) / 3;
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

      this .#transformNode .scale = new X3D .Vector3 (r, r, r);
   }

   set_optionNode (optionNode)
   {
      this .tool .set_linesCoordIndex = optionNode .getGeometry () ._coordIndex;
      this .tool .linesCoord          = optionNode .getGeometry () ._coord;

      this .addExternalNode (optionNode .getGeometry () ._coord);
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

module .exports = SphereTool;
