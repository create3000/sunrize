"use strict";

const X3DTextureProjectorNodeTool = require ("./X3DTextureProjectorNodeTool");

class TextureProjectorTool extends X3DTextureProjectorNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("perspectiveFieldOfView")  .addReference (this .node ._fieldOfView);
      this .tool .getField ("perspectiveNearDistance") .addReference (this .node ._nearDistance);
      this .tool .getField ("perspectiveFarDistance")  .addReference (this .node ._farDistance);
      this .tool .getField ("perspectiveAspectRatio")  .addReference (this .node ._aspectRatio);
   }
}

module .exports = TextureProjectorTool;
