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
      super .initialize ()

      await this .loadTool (__dirname, "X3DEnvironmentalSensorNodeTool.x3d")

      this .toolNode ._size   .addFieldInterest (this .tool .size)
      this .toolNode ._center .addFieldInterest (this .tool .center)

      this .tool .selected = this .selected
      this .tool .boxColor = this .boxColor
      this .tool .size     = this .toolNode ._size
      this .tool .center   = this .toolNode ._center
   }

   setSelected (value)
   {
      this .selected = value

      if (this .tool)
         this .tool .selected = value
   }
}

module .exports = X3DEnvironmentalSensorNodeTool
