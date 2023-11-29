"use strict";

const X3DGeometryNodeTool = require ("./X3DGeometryNodeTool");

class TriangleSetTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();
   }
}

module .exports = TriangleSetTool;
