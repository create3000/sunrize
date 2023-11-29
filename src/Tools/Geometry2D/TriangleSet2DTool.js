"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class TriangleSet2DTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();
   }
}

module .exports = TriangleSet2DTool;
