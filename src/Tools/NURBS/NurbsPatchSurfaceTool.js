"use strict";

const X3DNurbsSurfaceGeometryNodeTool = require ("./X3DNurbsSurfaceGeometryNodeTool");

class NurbsPatchSurfaceTool extends X3DNurbsSurfaceGeometryNodeTool
{
   async initializeTool (type)
   {
      super .initializeTool (type),
      // await super .loadTool (__dirname, "X3DNurbsSurfaceGeometryNode.x3d", "nurbsSurfaceGeometryTool");
   }
}

module .exports = NurbsPatchSurfaceTool;
