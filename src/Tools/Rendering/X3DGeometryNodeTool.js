"use strict";

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   ToolColors  = require ("../Core/ToolColors");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool (type)
   {
      await super .loadTool (__dirname, "X3DGeometryNodeTool.x3d");

      this .tool .linesColor = ToolColors .BLUE;

      if (type === "CUSTOM")
         return;

      this .node ._rebuild .addInterest ("set_toolGeometry", this);

      this .tool .linesCoord = this .getToolScene () .createNode ("CoordinateDouble");

      this .set_toolGeometry ();
   }

   disposeTool ()
   {
      this .node ._rebuild .removeInterest ("set_toolGeometry", this);

      super .disposeTool ();
   }

   set_toolGeometry ()
   {
      const
         points = this .node .getVertices () .filter ((_, i) => i % 4 !== 3),
         length = points .length / 3;

      if (length !== this .tool .linesCoord .point .length)
      {
         const coordIndex = [ ];

         for (let i = 0; i < length; i += 3)
            coordIndex .push (i, i + 1, i + 2, i, -1);

         this .tool .set_linesCoordIndex = coordIndex;
      }

      this .tool .linesCoord .point = points;
   }
}

module .exports = X3DGeometryNodeTool;
