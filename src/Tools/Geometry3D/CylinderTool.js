"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors"),
   X3D                 = require ("../../X3D"),
   _                   = require ("../../Application/GetText");

class CylinderTool extends X3DGeometryNodeTool
{
   #transformNode = null;
   #changing      = [false, false];

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
      transformTool .group         = this .getTypeName ();
      transformTool .undo          = false;
      transformTool .tools         = ["SCALE"];
      transformTool .keys          = ["SHIFT"];
      transformTool .connectedAxes = ["XZ", "ZX"];
      transformTool .centerDisplay = false;
      transformTool .centerTool    = false;
      transformTool .bboxColor     = ToolColors .BLUE;

      this .tool .group       = this .getTypeName ();
      this .tool .undo        = true;
      this .tool .addChildren = new X3D .MFNode (transformNode);

      // Connections

      this .node ._height .addInterest ("set_height", this);
      this .node ._radius .addInterest ("set_radius", this);

      this .node ._side                          .addInterest ("set_optionNode", this);
      this .node ._bottom                        .addInterest ("set_optionNode", this);
      this .node ._top                           .addInterest ("set_optionNode", this);
      this .getBrowser () .getCylinderOptions () .addInterest ("set_optionNode", this);

      this .set_height_and_radius ();
      this .set_optionNode ();
   }

   disposeTool ()
   {
      this .node ._height .removeInterest ("set_height", this);
      this .node ._radius .removeInterest ("set_radius", this);

      this .node ._side                          .removeInterest ("set_optionNode", this);
      this .node ._bottom                        .removeInterest ("set_optionNode", this);
      this .node ._top                           .removeInterest ("set_optionNode", this);
      this .getBrowser () .getCylinderOptions () .removeInterest ("set_optionNode", this);

      super .disposeTool ();
   }

   getTransformTool ()
   {
      return this .#transformNode .getValue () .getTool ();
   }

   set_scale (scale)
   {
      if (this .#changing .includes (true))
      {
         this .#changing .fill (false);
         return;
      }

      this .#changing .fill (true);

      this .node ._height = Math .abs (scale .y) * 2;
      this .node ._radius = (Math .abs (scale .x) + Math .abs (scale .z)) / 2;
   }

   set_height ()
   {
      this .set_height_and_radius (0);
   }

   set_radius ()
   {
      this .set_height_and_radius (1);
   }

   set_height_and_radius (i)
   {
      if (this .#changing [i])
      {
         this .#changing [i] = false;
         return;
      }

      this .#changing [i] = true;

      const
         y = Math .abs (this .node ._height .getValue () / 2),
         r = Math .abs (this .node ._radius .getValue ());

      this .#transformNode .scale = new X3D .Vector3 (r, y, r);
   }

   set_optionNode ()
   {
      const
         optionNode = this .getBrowser () .getCylinderOptions (),
         dimension  = optionNode ._dimension .getValue (),
         coordIndex = [ ];

      if (this .node ._side .getValue ())
         coordIndex .push (... optionNode .getSideGeometry () ._coordIndex);

      if (this .node ._bottom .getValue ())
      {
         coordIndex .push (... optionNode .getBottomGeometry () ._coordIndex);
         coordIndex .splice (-1, 0, coordIndex .at (-dimension - 1));
      }

      if (this .node ._top .getValue ())
      {
         coordIndex .push (... optionNode .getTopGeometry () ._coordIndex);
         coordIndex .splice (-1, 0, coordIndex .at (-dimension - 1));
      }

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord          = optionNode .getSideGeometry () ._coord;

      this .addExternalNode (optionNode .getSideGeometry () ._coord);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["height", "radius"]);
   }

   getUndoDescription (activeTool, name)
   {
      if (name)
         return _ ("Resize Node %s »%s«");

      return _ ("Resize Node %s");
   }
}

module .exports = CylinderTool;
