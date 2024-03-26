"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class SpatialSoundTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SpatialSoundTool.x3d");

      this .tool .getField ("location")  .addReference (this .node ._location);
      this .tool .getField ("direction") .addReference (this .node ._direction);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction"]);
   }
}

module .exports = SpatialSoundTool;
