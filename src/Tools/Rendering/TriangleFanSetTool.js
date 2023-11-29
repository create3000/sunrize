"use strict";

const X3DGeometryNodeTool = require ("./X3DGeometryNodeTool");

class TriangleFanSetTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("STANDARD");
   }
}

module .exports = TriangleFanSetTool;
