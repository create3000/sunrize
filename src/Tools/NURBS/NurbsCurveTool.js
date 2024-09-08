"use strict";

const
   X3DParametricGeometryNodeTool = require ("./X3DParametricGeometryNodeTool"),
   X3DLineGeometryNodeTool       = require ("../Rendering/X3DLineGeometryNodeTool");

class NurbsCurveTool extends X3DParametricGeometryNodeTool (X3DLineGeometryNodeTool)
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .parametricGeometryNodeTool .vDimension = 1;

      // this .parametricGeometryNodeTool .getField ("uDimension") .addReference (this .node ._uDimension);
   }
}

module .exports = NurbsCurveTool;
