"use strict";

const X3DGeometryNodeTool = require ("./X3DGeometryNodeTool");

class IndexedTriangleStripSetTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("STANDARD");
   }
}

module .exports = IndexedTriangleStripSetTool;
