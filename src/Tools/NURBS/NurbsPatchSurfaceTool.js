"use strict";

const X3DNurbsSurfaceGeometryNodeTool = require ("./X3DNurbsSurfaceGeometryNodeTool");

class NurbsPatchSurfaceTool extends X3DNurbsSurfaceGeometryNodeTool
{
   async initializeTool (type)
   {
      await Promise .all ([
         super .initializeTool (type),
         super .loadTool ("nurbsSurfaceGeometryTool", __dirname, "X3DNurbsSurfaceGeometryNodeTool.x3d"),
      ]);

      console .log (this .nurbsSurfaceGeometryTool .selected)
   }
}

module .exports = NurbsPatchSurfaceTool;
