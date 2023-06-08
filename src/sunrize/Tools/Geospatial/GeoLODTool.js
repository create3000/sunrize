"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D")
   Vector3              = X3D .require ("standard/Math/Numbers/Vector3")

class GeoLODTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_CYAN

   async initialize ()
   {
      await super .initialize ()

      this .tool .centerDisplay = true
   }

   static center = new Vector3 (0, 0, 0)

   reshape ()
   {
      super .reshape ()

      const center = this .toolNode .getCoord (this .toolNode ._center, GeoLODTool .center)

      if (!this .tool .center .getValue () .equals (center))
         this .tool .center = center
   }
}

module .exports = GeoLODTool
