"use strict";

const X3DNodeTool = require ("../Core/X3DNodeTool");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool ()
   {
      await super .loadTool (__dirname, "X3DGeometryNodeTool.x3d");
   }
}

module .exports = X3DGeometryNodeTool;
