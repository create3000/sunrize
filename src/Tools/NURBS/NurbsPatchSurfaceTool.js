"use strict";

const X3DNurbsSurfaceGeometryNodeTool = require ("./X3DNurbsSurfaceGeometryNodeTool");

class NurbsPatchSurfaceTool extends X3DNurbsSurfaceGeometryNodeTool
{
   async initializeTool (type)
   {
      await Promise .all ([
         super .initializeTool (type),
         // super .loadTool (__dirname, "X3DNurbsSurfaceGeometryNode.x3d", "nurbsSurfaceGeometry"),
      ]);
   }
}

module .exports = NurbsPatchSurfaceTool;
