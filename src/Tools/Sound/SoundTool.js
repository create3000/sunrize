"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   _                = require ("../../Application/GetText");
   
class SoundTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "SoundTool.x3d");

      this .tool .getField ("location")  .addReference (this .node ._location);
      this .tool .getField ("direction") .addReference (this .node ._direction);
      this .tool .getField ("minBack")   .addReference (this .node ._minBack);
      this .tool .getField ("minFront")  .addReference (this .node ._minFront);
      this .tool .getField ("maxBack")   .addReference (this .node ._maxBack);
      this .tool .getField ("maxFront")  .addReference (this .node ._maxFront);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction", "maxBack"]);
   }

   getUndoDescription (activeTool, name)
   {
      switch (activeTool)
      {
         case "MAX_BACK":
         {
            if (name)
               return _ ("Translate MaxBack Of %s »%s«");

            return _ ("Translate MaxBack Of %s");
         }
         default:
         {
            return super .getUndoDescription (activeTool, name);
         }
      }
   }
}

module .exports = SoundTool;
