"use strict";

const
   X3DGeometryNodeTool = require ("./X3DGeometryNodeTool"),
   ToolColors          = require ("../Core/ToolColors");

class X3DLineGeometryNodeTool extends X3DGeometryNodeTool
{
   async initializeTool (type)
   {
      await super .loadTool ("tool", __dirname, "X3DLineGeometryNodeTool.x3d");

      this .tool .pointsColor = ToolColors .BLUE;

      if (type === "CUSTOM")
         return;

      this .node ._rebuild .addInterest ("set_toolGeometry", this);

      this .tool .pointsCoord = this .getToolScene () .createNode ("CoordinateDouble");

      this .set_toolGeometry ();
   }

   disposeTool ()
   {
      this .node ._rebuild .removeInterest ("set_toolGeometry", this);

      super .disposeTool ();
   }

   set_toolGeometry ()
   {
      const points = this .node .getVertices () .filter ((_, i) => i % 4 < 3);

      this .tool .pointsCoord .point = points;
   }
}

module .exports = X3DLineGeometryNodeTool;
