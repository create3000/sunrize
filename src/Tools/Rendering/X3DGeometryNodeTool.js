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

      if (type !== "STANDARD")
         return;
      
      this .node .addInterest ("set_vertices", this);

      this .tool .linesDisplay = true;
      this .tool .linesCoord   = this .getExecutionContext () .createNode ("Coordinate");

      this .set_vertices ();
   }

   set_vertices ()
   {
      const
         coordIndex = [ ],
         points     = this .node .getVertices () .filter ((_, i) => i % 4 !== 3),
         length     = points .length / 3;

      for (let i = 0; i < length; i += 3)
         coordIndex .push (i, i + 1, i + 2, i, -1);

      this .tool .set_linesCoordIndex = coordIndex;
      this .tool .linesCoord .point   = points;
   }
}

module .exports = X3DGeometryNodeTool;
