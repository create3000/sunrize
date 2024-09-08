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

      this .node ._rebuild .addInterest ("set_toolRebuildParametricGeometry", this);

      this .parametricGeometryNodeTool .hullColor         = ToolColors .LIGHT_GREY;
      this .parametricGeometryNodeTool .controlPointColor = ToolColors .DARK_BLUE;

      this .parametricGeometryNodeTool .getField ("controlPoint") .addReference (this .node ._controlPoint);

      this .addExternalNode (this .node ._controlPoint);
   }

   set_toolRebuildParametricGeometry ()
   {
      const
         uDimension = this .parametricGeometryNodeTool .uDimension,
         vDimension = this .parametricGeometryNodeTool .vDimension,
         hullIndex  = [ ];

      // Generate u connections.

      if (uDimension > 1)
      {
         for (let v = 0; v < vDimension; ++ v)
         {
            for (let u = 0; u < uDimension; ++ u)
               hullIndex .push (v * uDimension + u);

            hullIndex .push (-1);
         }
      }

      // Generate v connections.

      if (vDimension > 1)
      {
         for (let u = 0; u < uDimension; ++ u)
         {
            for (let v = 0; v < vDimension; ++ v)
               hullIndex .push (v * uDimension + u);

            hullIndex .push (-1);
         }
      }

      this .parametricGeometryNodeTool .set_hullIndex = hullIndex;
   }
};

module .exports = X3DParametricGeometryNodeTool;
