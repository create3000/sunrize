"use strict";

const
   X3D         = require ("../../X3D"),
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   ToolColors  = require ("../Core/ToolColors");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool (type)
   {
      await super .loadTool ("tool", __dirname, "X3DGeometryNodeTool.x3d");

      this .tool .linesColor = ToolColors .BLUE;

      if (type === "CUSTOM")
         return;

      this .node ._rebuild .addInterest ("set_toolRebuildGeometry", this);

      this .tool .linesCoord = this .getToolScene () .createNode ("CoordinateDouble");

      this .set_toolRebuildGeometry ();
   }

   disposeTool ()
   {
      this .node ._rebuild .removeInterest ("set_toolRebuildGeometry", this);

      super .disposeTool ();
   }

   set_toolRebuildGeometry ()
   {
      const
         coordIndices = this .node .getCoordIndices (),
         vertices     = this .node .getVertices (),
         numTriangles = coordIndices .length;

      const
         coordIndex = [ ],
         points     = [ ];

      for (let i = 0; i < numTriangles; i += 3)
      {
         coordIndex .push (coordIndices [i], coordIndices [i + 1], coordIndices [i + 2], coordIndices [i], -1);

         const l = i + 3;

         for (let e = i; e < l; ++ e)
         {
            const c = coordIndices [e];

            points [c * 3]     = vertices [e * 4];
            points [c * 3 + 1] = vertices [e * 4 + 1];
            points [c * 3 + 2] = vertices [e * 4 + 2];
         }
      }

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord .point   = points;
   }
}

module .exports = X3DGeometryNodeTool;
