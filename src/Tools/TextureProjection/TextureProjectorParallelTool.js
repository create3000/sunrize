"use strict"

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool")

class TextureProjectorParallelTool extends X3DTextureProjectorNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ()

      this .node ._fieldOfView  .addFieldInterest (this .tool .getField ("parallelFieldOfView"))
      this .node ._nearDistance .addFieldInterest (this .tool .getField ("parallelNearDistance"))
      this .node ._farDistance  .addFieldInterest (this .tool .getField ("parallelFarDistance"))
      this .node ._aspectRatio  .addFieldInterest (this .tool .getField ("parallelAspectRatio"))

      this .tool .parallelFieldOfView  = this .node ._fieldOfView
      this .tool .parallelNearDistance = this .node ._nearDistance
      this .tool .parallelFarDistance  = this .node ._farDistance
      this .tool .parallelAspectRatio  = this .node ._aspectRatio
   }
}

module .exports = TextureProjectorParallelTool
