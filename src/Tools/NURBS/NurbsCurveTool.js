"use strict";

const
   X3DLineGeometryNodeTool = require ("../Rendering/X3DLineGeometryNodeTool"),
   ToolColors              = require ("../Core/ToolColors");

class NurbsCurveTool extends X3DLineGeometryNodeTool
{
   async initializeTool (type)
   {
      await Promise .all ([
         super .initializeTool (type),
         super .loadTool ("nurbsCurveTool", __dirname, "X3DNurbsSurfaceGeometryNodeTool.x3d"),
      ]);

      this .nurbsCurveTool .controlPointColor = ToolColors .DARK_BLUE;
      this .nurbsCurveTool .vDimension        = 1;

      // this .nurbsCurveTool .getField ("uDimension") .addReference (this .node ._uDimension);

      this .nurbsCurveTool .getField ("controlPoint") .addReference (this .node ._controlPoint);

      this .addExternalNode (this .node ._controlPoint);
   }
}

module .exports = NurbsCurveTool;
