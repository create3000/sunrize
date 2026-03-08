"use strict";

const
   X3DParametricGeometryNodeTool = require ("./X3DParametricGeometryNodeTool"),
   X3DGeometryNodeTool           = require ("../Rendering/X3DGeometryNodeTool");

class NurbsCurveTool extends X3DParametricGeometryNodeTool (X3DGeometryNodeTool)
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .set_toolRebuildParametricGeometry ();
   }

   set_toolRebuildParametricGeometry ()
   {
      this .parametricGeometryNodeTool .uDimension = this .node ._controlPoint .getValue () ?._point .length ?? 0;
      this .parametricGeometryNodeTool .vDimension = 1;

      super .set_toolRebuildParametricGeometry ();
   }
}

module .exports = NurbsCurveTool;
