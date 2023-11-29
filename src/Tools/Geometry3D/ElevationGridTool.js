"use strict";

const
   X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool"),
   X3D                 = require ("../../X3D");

class ElevationGridTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

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

module .exports = ElevationGridTool;
