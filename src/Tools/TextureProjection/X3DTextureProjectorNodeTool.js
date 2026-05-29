"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DTextureProjectorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "X3DTextureProjectorNodeTool.x3d");

      this .tool .getValue () .getField ("on")        .addReference (this .node ._on);
      this .tool .getValue () .getField ("location")  .addReference (this .node ._location);
      this .tool .getValue () .getField ("direction") .addReference (this .node ._direction);
      this .tool .getValue () .getField ("upVector")  .addReference (this .node ._upVector);
      this .tool .getValue () .getField ("texture")   .addReference (this .node ._texture);

      this .tool .getValue () .getField ("isActive") .addInterest ("handleUndo", this);

      this .addExternalNode (this .node ._texture);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction", "upVector"]);
   }

   isBoundedObject ()
   {
      return true;
   }

   getBBox (bbox, shadows)
   {
      return this .getToolBBox (bbox, shadows);
   }
}

module .exports = X3DTextureProjectorNodeTool;
