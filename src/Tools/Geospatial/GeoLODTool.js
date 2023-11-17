"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D")

class GeoLODTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .DARK_CYAN

   async initializeTool ()
   {
      await super .initializeTool ()

      this .tool .centerDisplay = true
   }

   static center = new X3D .Vector3 (0, 0, 0)

   reshape ()
   {
      super .reshape ()

      const center = this .node .getCoord (this .node ._center, GeoLODTool .center)

      if (!this .tool .center .getValue () .equals (center))
         this .tool .center = center
   }
}

module .exports = GeoLODTool
