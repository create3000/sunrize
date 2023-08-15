"use strict"

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool")

class TextureProjectorTool extends X3DTextureProjectorNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._fieldOfView  .addFieldInterest (this .tool .getValue () .getField ("perspectiveFieldOfView"))
      this .toolNode ._nearDistance .addFieldInterest (this .tool .getValue () .getField ("perspectiveNearDistance"))
      this .toolNode ._farDistance  .addFieldInterest (this .tool .getValue () .getField ("perspectiveFarDistance"))
      this .toolNode ._aspectRatio  .addFieldInterest (this .tool .getValue () .getField ("perspectiveAspectRatio"))

      this .tool .perspectiveFieldOfView  = this .toolNode ._fieldOfView
      this .tool .perspectiveNearDistance = this .toolNode ._nearDistance
      this .tool .perspectiveFarDistance  = this .toolNode ._farDistance
      this .tool .perspectiveAspectRatio  = this .toolNode ._aspectRatio
   }
}

module .exports = TextureProjectorTool
