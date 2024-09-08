"use strict";

const ToolColors = require ("../Core/ToolColors");

const X3DParametricGeometryNodeTool = Base => class extends Base
{
   async initializeTool ()
   {
      await Promise .all ([
         super .initializeTool (),
         super .loadTool ("parametricGeometryNodeTool", __dirname, "X3DParametricGeometryNodeTool.x3d"),
      ]);

      this .parametricGeometryNodeTool .controlPointColor = ToolColors .DARK_BLUE;

      this .parametricGeometryNodeTool .getField ("controlPoint") .addReference (this .node ._controlPoint);

      this .addExternalNode (this .node ._controlPoint);
   }
};

module .exports = X3DParametricGeometryNodeTool;
