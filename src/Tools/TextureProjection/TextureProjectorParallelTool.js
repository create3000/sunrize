"use strict";

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool");

class TextureProjectorParallelTool extends X3DTextureProjectorNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getValue () .getField ("parallelFieldOfView")  .addReference (this .node ._fieldOfView);
      this .tool .getValue () .getField ("parallelNearDistance") .addReference (this .node ._nearDistance);
      this .tool .getValue () .getField ("parallelFarDistance")  .addReference (this .node ._farDistance);

      this .node ._aspectRatio .addFieldInterest (this .tool .getValue () .getField ("parallelAspectRatio"));

      this .tool .parallelAspectRatio = this .node ._aspectRatio;
   }

   disposeTool ()
   {
      this .node ._aspectRatio .removeFieldInterest (this .tool .getValue () .getField ("parallelAspectRatio"));

      super .disposeTool ();
   }
}

module .exports = TextureProjectorParallelTool;
