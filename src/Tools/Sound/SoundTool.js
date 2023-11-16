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

      this .node ._location  .addFieldInterest (this .tool .getField ("location"))
      this .node ._direction .addFieldInterest (this .tool .getField ("direction"))
      this .node ._minBack   .addFieldInterest (this .tool .getField ("minBack"))
      this .node ._minFront  .addFieldInterest (this .tool .getField ("minFront"))
      this .node ._maxBack   .addFieldInterest (this .tool .getField ("maxBack"))
      this .node ._maxFront  .addFieldInterest (this .tool .getField ("maxFront"))

      this .tool .location  = this .node ._location
      this .tool .direction = this .node ._direction
      this .tool .minBack   = this .node ._minBack
      this .tool .minFront  = this .node ._minFront
      this .tool .maxBack   = this .node ._maxBack
      this .tool .maxFront  = this .node ._maxFront
   }
}

module .exports = SoundTool
