"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   X3D              = require ("../../X3D");

class X3DTextureProjectorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   toolWhichChoice = 0;

   async initialize ()
   {
      await super .initialize (__dirname, "X3DTextureProjectorNodeTool.x3d");

      this .node ._on        .addFieldInterest (this .tool .getField ("on"));
      this .node ._location  .addFieldInterest (this .tool .getField ("location"));
      this .node ._direction .addFieldInterest (this .tool .getField ("direction"));
      this .node ._upVector  .addFieldInterest (this .tool .getField ("upVector"));
      this .node ._texture   .addFieldInterest (this .tool .getField ("texture"));

      this .tool .on        = this .node ._on;
      this .tool .location  = this .node ._location;
      this .tool .direction = this .node ._direction;
      this .tool .upVector  = this .node ._upVector;
      this .tool .texture   = this .node ._texture;

      this .addExternalNode (this .node ._texture);
   }
}

module .exports = X3DTextureProjectorNodeTool;
