"use strict";

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   ToolColors  = require ("../Core/ToolColors");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool ()
   {
      await super .loadTool (__dirname, "X3DGeometryNodeTool.x3d");

      this .tool .linesColor = ToolColors .BLUE;
   }
}

module .exports = X3DGeometryNodeTool;
