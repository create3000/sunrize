"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class ExtrusionTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ("STANDARD");
   }
}

module .exports = ExtrusionTool;
