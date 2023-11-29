"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class NurbsTrimmedSurfaceTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();
   }
}

module .exports = NurbsTrimmedSurfaceTool;
