"use strict";

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool");

class TextureProjectorTool extends X3DTextureProjectorNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getValue () .getField ("perspectiveFieldOfView")  .addReference (this .node ._fieldOfView);
      this .tool .getValue () .getField ("perspectiveNearDistance") .addReference (this .node ._nearDistance);
      this .tool .getValue () .getField ("perspectiveFarDistance")  .addReference (this .node ._farDistance);

      this .node ._aspectRatio .addFieldInterest (this .tool .getValue () .getField ("perspectiveAspectRatio"));

      this .tool .perspectiveAspectRatio = this .node ._aspectRatio;
   }

   disposeTool ()
   {
      this .node ._aspectRatio .removeFieldInterest (this .tool .getValue () .getField ("perspectiveAspectRatio"));

      super .disposeTool ();
   }
}

module .exports = TextureProjectorTool;
