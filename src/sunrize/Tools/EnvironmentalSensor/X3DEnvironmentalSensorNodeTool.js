"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D")

class X3DEnvironmentalSensorNodeTool extends X3DNodeTool
{
   static createOnSelection = false
   static createOnDemand    = true

   async initialize ()
   {
      await super .initialize (__dirname, "X3DEnvironmentalSensorNodeTool.x3d")

      this .toolNode ._size   .addFieldInterest (this .tool .size)
      this .toolNode ._center .addFieldInterest (this .tool .center)

      this .tool .boxColor = this .toolBoxColor
      this .tool .size     = this .toolNode ._size
      this .tool .center   = this .toolNode ._center
   }

   getMustDisplay ()
   {
      return true
   }
}

module .exports = X3DEnvironmentalSensorNodeTool
