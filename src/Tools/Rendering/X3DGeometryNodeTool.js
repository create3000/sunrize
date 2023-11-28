"use strict";

const X3DNodeTool = require ("../Core/X3DNodeTool");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DGeometryNodeTool.x3d");
   }
}

module .exports = X3DGeometryNodeTool;
