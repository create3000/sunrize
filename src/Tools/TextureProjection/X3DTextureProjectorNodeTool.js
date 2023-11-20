"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DTextureProjectorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DTextureProjectorNodeTool.x3d");

      this .tool .getField ("on")        .addReference (this .node ._on);
      this .tool .getField ("location")  .addReference (this .node ._location);
      this .tool .getField ("direction") .addReference (this .node ._direction);
      this .tool .getField ("upVector")  .addReference (this .node ._upVector);
      this .tool .getField ("texture")   .addReference (this .node ._texture);

      this .addExternalNode (this .node ._texture);
   }
}

module .exports = X3DTextureProjectorNodeTool;
