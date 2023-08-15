"use strict"

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool")

class TextureProjectorParallelTool extends X3DTextureProjectorNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._fieldOfView  .addFieldInterest (this .tool .parallelFieldOfView)
      this .toolNode ._nearDistance .addFieldInterest (this .tool .getValue () .getField ("parallelNearDistance"))
      this .toolNode ._farDistance  .addFieldInterest (this .tool .getValue () .getField ("parallelFarDistance"))
      this .toolNode ._aspectRatio  .addFieldInterest (this .tool .getValue () .getField ("parallelAspectRatio"))

      this .tool .parallelFieldOfView  = this .toolNode ._fieldOfView
      this .tool .parallelNearDistance = this .toolNode ._nearDistance
      this .tool .parallelFarDistance  = this .toolNode ._farDistance
      this .tool .parallelAspectRatio  = this .toolNode ._aspectRatio
   }
}

module .exports = TextureProjectorParallelTool
