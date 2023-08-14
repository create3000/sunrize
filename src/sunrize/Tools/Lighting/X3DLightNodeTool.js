"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D")

class X3DLightNodeTool extends X3DNodeTool
{
   static createOnSelection = false
   static createOnDemand    = true

   static lightType = new Map ([
      [X3D .X3DConstants .DirectionalLight, 0],
      [X3D .X3DConstants .PointLight, 1],
      [X3D .X3DConstants .SpotLight, 2],
   ])

   constructor (node)
   {
      super (node)

      this .toolType = [0, X3D .X3DConstants .X3DNode, X3D .X3DConstants .X3DChildNode]
   }

   async initialize ()
   {
      super .initialize ()

      await this .loadTool (__dirname, "X3DLightNodeTool.x3d")

      this .toolNode ._on        .addFieldInterest (this .tool .on)
      this .toolNode ._color     .addFieldInterest (this .tool .color)
      this .toolNode ._intensity .addFieldInterest (this .tool .intensity)

      this .tool .whichChoice = X3DLightNodeTool .lightType .get (this .toolNode .getType () .at (-1))
      this .tool .on          = this .toolNode ._on
      this .tool .color       = this .toolNode ._color
      this .tool .intensity   = this .toolNode ._intensity

      if (this .toolNode ._location)
      {
         this .toolNode ._location .addFieldInterest (this .tool .location)

         this .tool .location = this .toolNode ._location
      }

      if (this .toolNode ._direction)
      {
         this .toolNode ._direction .addFieldInterest (this .tool .direction)

         this .tool .direction = this .toolNode ._direction
      }
   }

   getType ()
   {
      return this .toolType
   }
}

module .exports = X3DLightNodeTool
