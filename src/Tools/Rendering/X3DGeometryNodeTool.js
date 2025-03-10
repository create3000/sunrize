"use strict";

const
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

   getBoxShape (size)
   {
      const
         shapeNode      = this .getToolScene () .createNode ("Shape"),
         appearanceNode = this .getToolScene () .createNode ("Appearance"),
         materialNode   = this .getToolScene () .createNode ("UnlitMaterial"),
         boxNode        = this .getToolScene () .createNode ("Box");

      materialNode .transparency = 1;
      boxNode .size              = size;
      appearanceNode .material   = materialNode;
      shapeNode .appearance      = appearanceNode;
      shapeNode .geometry        = boxNode;

      return shapeNode;
   }

   set_toolRebuildGeometry ()
   {
      const
         points    = this .node .getVertices () .filter ((_, i) => i % 4 < 3),
         numPoints = points .length / 3;

      if (numPoints !== this .tool .linesCoord .point .length)
      {
         const coordIndex = [ ];

         for (let i = 0; i < numPoints; i += 3)
            coordIndex .push (i, i + 1, i + 2, i, -1);

         this .tool .set_linesCoordIndex = coordIndex;
      }

      this .tool .linesCoord .point = points;
   }
}

module .exports = X3DGeometryNodeTool;
