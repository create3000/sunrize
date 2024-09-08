"use strict";

const
   X3DNurbsSurfaceGeometryNodeTool = require ("./X3DNurbsSurfaceGeometryNodeTool"),
   ToolColors                      = require ("../Core/ToolColors");

class NurbsPatchSurfaceTool extends X3DNurbsSurfaceGeometryNodeTool
{
   async initializeTool (type)
   {
      await Promise .all ([
         super .initializeTool (type),
         super .loadTool ("nurbsSurfaceGeometryTool", __dirname, "X3DNurbsSurfaceGeometryNodeTool.x3d"),
      ]);

      this .nurbsSurfaceGeometryTool .controlPointColor = ToolColors .DARK_BLUE;

      this .nurbsSurfaceGeometryTool .getField ("controlPoint") .addReference (this .node ._controlPoint);

      this .addExternalNode (this .node ._controlPoint);
   }
}

module .exports = NurbsPatchSurfaceTool;
