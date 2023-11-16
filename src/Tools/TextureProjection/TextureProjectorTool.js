"use strict"

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool")

class TextureProjectorTool extends X3DTextureProjectorNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .node ._fieldOfView  .addFieldInterest (this .tool .getField ("perspectiveFieldOfView"))
      this .node ._nearDistance .addFieldInterest (this .tool .getField ("perspectiveNearDistance"))
      this .node ._farDistance  .addFieldInterest (this .tool .getField ("perspectiveFarDistance"))
      this .node ._aspectRatio  .addFieldInterest (this .tool .getField ("perspectiveAspectRatio"))

      this .tool .perspectiveFieldOfView  = this .node ._fieldOfView
      this .tool .perspectiveNearDistance = this .node ._nearDistance
      this .tool .perspectiveFarDistance  = this .node ._farDistance
      this .tool .perspectiveAspectRatio  = this .node ._aspectRatio
   }
}

module .exports = TextureProjectorTool
