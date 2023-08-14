"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D")

class X3DEnvironmentalSensorNodeTool extends X3DNodeTool
{
   static createOnSelection = false
   static createOnDemand    = true

   constructor (node)
   {
      super (node)

      this .toolType = [0, X3D .X3DConstants .X3DNode, X3D .X3DConstants .X3DChildNode]
   }

   async initialize ()
   {
      super .initialize ()

      await this .loadTool (__dirname, "X3DEnvironmentalSensorNodeTool.x3d")

      this .toolNode ._size   .addFieldInterest (this .tool .size)
      this .toolNode ._center .addFieldInterest (this .tool .center)

      this .tool .boxColor = this .toolBoxColor
      this .tool .size     = this .toolNode ._size
      this .tool .center   = this .toolNode ._center
   }

   getType ()
   {
      return this .toolType
   }
}

module .exports = X3DEnvironmentalSensorNodeTool
