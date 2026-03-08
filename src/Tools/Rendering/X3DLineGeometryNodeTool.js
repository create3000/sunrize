"use strict";

const
   X3DGeometryNodeTool = require ("./X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors");

class X3DLineGeometryNodeTool extends X3DGeometryNodeTool
{
   set_toolRebuildGeometry ()
   {
      const points = this .node .getVertices () .filter ((_, i) => i % 4 < 3);

      this .tool .pointsCoord .point = points;
   }
}

module .exports = X3DLineGeometryNodeTool;
