"use strict"

const
   X3DNodeTool = require ("../Core/X3DNodeTool"),
   X3D         = require ("../../X3D")

class X3DLightNodeTool extends X3DNodeTool
{
   static createOnSelection = false

   async initialize ()
   {
      await super .initialize (__dirname, "X3DLightNodeTool.x3d")

      this .toolNode ._on        .addFieldInterest (this .tool .getField ("on"))
      this .toolNode ._color     .addFieldInterest (this .tool .color)
      this .toolNode ._intensity .addFieldInterest (this .tool .intensity)

      this .tool .on        = this .toolNode ._on
      this .tool .color     = this .toolNode ._color
      this .tool .intensity = this .toolNode ._intensity
   }

   getMustDisplay ()
   {
      return true
   }
}

module .exports = X3DLightNodeTool
