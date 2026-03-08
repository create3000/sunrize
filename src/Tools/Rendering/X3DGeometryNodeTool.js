"use strict";

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   ToolColors  = require ("../Core/ToolColors");

class X3DGeometryNodeTool extends X3DNodeTool
{
   async initializeTool (type)
   {
      await super .loadTool ("tool", __dirname, "X3DGeometryNodeTool.x3d");

      this .tool .linesColor  = ToolColors .BLUE;
      this .tool .pointsColor = ToolColors .BLUE;

      switch (this .getGeometryType ())
      {
         case 0:
         case 1:
            this .tool .pointsDisplay = true;
            this .tool .linesDisplay  = false;
            break;
         case 2:
         case 3:
            this .tool .pointsDisplay = false;
            this .tool .linesDisplay  = true;
            break
      }

      if (type === "CUSTOM")
         return;

      this .node ._rebuild .addInterest ("set_toolRebuildGeometry", this);

      this .tool .linesCoord  = this .getToolScene () .createNode ("CoordinateDouble");
      this .tool .pointsCoord = this .getToolScene () .createNode ("CoordinateDouble");

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

   traverseBefore (type, renderObject)
   {
      this .node .traverseBefore ?.(type, renderObject);
   }

   traverseAfter (type, renderObject)
   {
      if (this .isNodeTraversable (type))
         this .node .traverseAfter ?.(type, renderObject);

      this .traverse (type, renderObject);
   }
}

module .exports = X3DGeometryNodeTool;
