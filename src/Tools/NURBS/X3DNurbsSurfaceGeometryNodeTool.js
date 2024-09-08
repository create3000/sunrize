"use strict";

const
   X3DGeometryNodeTool           = require ("../Rendering/X3DGeometryNodeTool"),
   X3DParametricGeometryNodeTool = require ("./X3DParametricGeometryNodeTool");;

class X3DNurbsSurfaceGeometryNodeTool extends X3DParametricGeometryNodeTool (X3DGeometryNodeTool)
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .parametricGeometryNodeTool .getField ("uDimension") .addReference (this .node ._uDimension);
      this .parametricGeometryNodeTool .getField ("vDimension") .addReference (this .node ._vDimension);

      this .set_toolRebuildParametricGeometry ();
   }
}


module .exports = X3DNurbsSurfaceGeometryNodeTool;
