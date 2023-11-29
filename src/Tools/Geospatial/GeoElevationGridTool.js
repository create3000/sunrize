"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class GeoElevationGridTool extends X3DGeometryNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .linewidthScaleFactor = 1;
   }
}

module .exports = GeoElevationGridTool;
