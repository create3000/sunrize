"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors"),
   X3D                 = require ("../../X3D"),
   _                   = require ("../../Application/GetText");

class Disk2DTool extends X3DGeometryNodeTool
{
   #innerRadiusTransformNode = null;
   #innerRadiusChanging      = false;
   #outerRadiusTransformNode = null;
   #outerRadiusChanging      = false;

   async initializeTool ()
   {
      await super .initializeTool ();

      const toolChildren = new X3D .MFNode ();

      // Transform Tool outerRadius
      {
         const
            groupNode     = this .getToolScene () .createNode ("Group"),
            transformNode = this .getToolScene () .createNode ("Transform"),
            transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

         this .#outerRadiusTransformNode = transformNode;

         transformNode .scale .addInterest ("set_outerRadiusScale", this);
         transformTool .getField ("isActive") .addInterest ("handleUndo", this);
         transformTool .getField ("isActive") .addInterest ("set_outerRadiusActive", this);

         groupNode     .bboxSize      = new X3D .Vector3 (2, 2, 0);
         transformNode .children      = [groupNode];
         transformTool .group         = `${this .getTypeName ()}.outerRadius`;
         transformTool .undo          = false;
         transformTool .tools         = ["SCALE"];
         transformTool .keys          = [ ];
         transformTool .connectedAxes = ["XY", "YX", "ZX"];
         transformTool .centerDisplay = false;
         transformTool .centerTool    = false;
         transformTool .zAxisDisplay  = false;
         transformTool .bboxEvents    = false;
         transformTool .bboxColor     = ToolColors .BLUE;

         toolChildren .push (transformNode);

         // Connections outerRadius

         this .node ._outerRadius .addInterest ("set_outerRadius", this);

         this .set_outerRadius (this .node ._outerRadius);
      }

      // Transform Tool innerRadius
      {
         const
            groupNode     = this .getToolScene () .createNode ("Group"),
            transformNode = this .getToolScene () .createNode ("Transform"),
            transformTool = await transformNode .getValue () .addTool () .getToolInstance ();

         this .#innerRadiusTransformNode = transformNode;

         transformNode .scale .addInterest ("set_innerRadiusScale", this);
         transformTool .getField ("isActive") .addInterest ("handleUndo", this);
         transformTool .getField ("isActive") .addInterest ("set_innerRadiusActive", this);

         groupNode     .bboxSize      = new X3D .Vector3 (2, 2, 0);
         transformNode .children      = [groupNode];
         transformTool .group         = `${this .getTypeName ()}.innerRadius`;
         transformTool .undo          = false;
         transformTool .tools         = ["SCALE"];
         transformTool .keys          = [ ];
         transformTool .connectedAxes = ["XY", "YX", "ZX"];
         transformTool .centerDisplay = false;
         transformTool .centerTool    = false;
         transformTool .zAxisDisplay  = false;
         transformTool .bboxEvents    = false;
         transformTool .bboxColor     = ToolColors .BLUE;

         toolChildren .push (transformNode);

         // Connections innerRadius

         this .node ._innerRadius .addInterest ("set_innerRadius", this);

         this .set_innerRadius (this .node ._innerRadius);
      }

      this .tool .undo        = true;
      this .tool .addChildren =toolChildren;
   }

   disposeTool ()
   {
      this .node ._innerRadius .removeInterest ("set_innerRadius", this);
      this .node ._outerRadius .removeInterest ("set_outerRadius", this);

      super .disposeTool ();
   }

   // innerRadius

   getInnerRadiusTransformTool ()
   {
      return this .#innerRadiusTransformNode .getValue () .getTool ();
   }

   set_innerRadiusActive ()
   {
      this .tool .group = `${this .getTypeName ()}.innerRadius`;
   }

   set_innerRadiusScale (scale)
   {
      if (this .#innerRadiusChanging)
      {
         this .#innerRadiusChanging = false;
         return;
      }

      this .#innerRadiusChanging = true;

      this .node ._innerRadius = scale .abs () .dot (new X3D .SFVec3f (1, 1, 0)) / 2;
   }

   set_innerRadius (innerRadius)
   {
      if (this .#innerRadiusChanging)
      {
         this .#innerRadiusChanging = false;
         return;
      }

      this .#innerRadiusChanging = true;

      const r = Math .abs (innerRadius .getValue ());

      this .#innerRadiusTransformNode .scale = new X3D .Vector3 (r, r, 1);
   }

   // outerRadius

   set_outerRadiusActive ()
   {
      this .tool .group = `${this .getTypeName ()}.outerRadius`;
   }


   getOuterRadiusTransformTool ()
   {
      return this .#outerRadiusTransformNode .getValue () .getTool ();
   }

   set_outerRadiusScale (scale)
   {
      if (this .#outerRadiusChanging)
      {
         this .#outerRadiusChanging = false;
         return;
      }

      this .#outerRadiusChanging = true;

      this .node ._outerRadius = scale .abs () .dot (new X3D .SFVec3f (1, 1, 0)) / 2;
   }

   set_outerRadius (outerRadius)
   {
      if (this .#outerRadiusChanging)
      {
         this .#outerRadiusChanging = false;
         return;
      }

      this .#outerRadiusChanging = true;

      const r = Math .abs (outerRadius .getValue ());

      this .#outerRadiusTransformNode .scale = new X3D .Vector3 (r, r, 1);
   }

   // Undo

   beginUndo ()
   {
      this .undoSaveInitialValues (["innerRadius", "outerRadius"]);
   }

   getUndoDescription (activeTool, name)
   {
      if (name)
         return _("Resize Node %s »%s«");

      return _("Resize Node %s");
   }
}

module .exports = Disk2DTool;
