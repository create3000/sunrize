"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class SoundTool extends X3DChildNodeTool
{
   static createOnSelection = false

   toolWhichChoice = 0

   async initialize ()
   {
      await super .initialize (__dirname, "SoundTool.x3d")

      this .toolNode ._location  .addFieldInterest (this .tool .location)
      this .toolNode ._direction .addFieldInterest (this .tool .direction)
      this .toolNode ._minBack   .addFieldInterest (this .tool .getField ("minBack"))
      this .toolNode ._minFront  .addFieldInterest (this .tool .getField ("minFront"))
      this .toolNode ._maxBack   .addFieldInterest (this .tool .getField ("maxBack"))
      this .toolNode ._maxFront  .addFieldInterest (this .tool .getField ("maxFront"))

      this .tool .location  = this .toolNode ._location
      this .tool .direction = this .toolNode ._direction
      this .tool .minBack   = this .toolNode ._minBack
      this .tool .minFront  = this .toolNode ._minFront
      this .tool .maxBack   = this .toolNode ._maxBack
      this .tool .maxFront  = this .toolNode ._maxFront
   }
}

module .exports = SoundTool
