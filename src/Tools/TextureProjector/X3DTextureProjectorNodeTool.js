"use strict"

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D")

class X3DTextureProjectorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false

   toolWhichChoice = 0

   async initialize ()
   {
      await super .initialize (__dirname, "X3DTextureProjectorNodeTool.x3d")

      this .toolNode ._on        .addFieldInterest (this .tool .getField ("on"))
      this .toolNode ._location  .addFieldInterest (this .tool .location)
      this .toolNode ._direction .addFieldInterest (this .tool .direction)
      this .toolNode ._upVector  .addFieldInterest (this .tool .upVector)
      this .toolNode ._texture   .addFieldInterest (this .tool .getField ("texture"))

      this .tool .on        = this .toolNode ._on
      this .tool .location  = this .toolNode ._location
      this .tool .direction = this .toolNode ._direction
      this .tool .upVector  = this .toolNode ._upVector
      this .tool .texture   = this .toolNode ._texture
   }
}

module .exports = X3DTextureProjectorNodeTool
