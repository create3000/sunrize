"use strict";

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool");

class TextureProjectorParallelTool extends X3DTextureProjectorNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("parallelFieldOfView")  .addReference (this .node ._fieldOfView);
      this .tool .getField ("parallelNearDistance") .addReference (this .node ._nearDistance);
      this .tool .getField ("parallelFarDistance")  .addReference (this .node ._farDistance);
      this .tool .getField ("parallelAspectRatio")  .addReference (this .node ._aspectRatio);
   }
}

module .exports = TextureProjectorParallelTool;
