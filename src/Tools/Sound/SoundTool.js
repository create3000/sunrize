"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   _                = require ("../../Application/GetText");

class SoundTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "SoundTool.x3d");

      this .tool .getValue () .getField ("location")  .addReference (this .node ._location);
      this .tool .getValue () .getField ("direction") .addReference (this .node ._direction);
      this .tool .getValue () .getField ("minBack")   .addReference (this .node ._minBack);
      this .tool .getValue () .getField ("minFront")  .addReference (this .node ._minFront);
      this .tool .getValue () .getField ("maxBack")   .addReference (this .node ._maxBack);
      this .tool .getValue () .getField ("maxFront")  .addReference (this .node ._maxFront);

      this .tool .getValue () .getField ("isActive") .addInterest ("handleUndo", this);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction", "minBack", "minFront", "maxBack", "maxFront"]);
   }

   getUndoDescription (activeTool, name)
   {
      switch (activeTool)
      {
         case "MIN_BACK":
         {
            if (name)
               return _("Translate field »minBack« of Node %s »%s«");

            return _("Translate »minBack« of Node %s");
         }
         case "MIN_FRONT":
         {
            if (name)
               return _("Translate field »minFront of Node %s »%s«");

            return _("Translate »minFront« of Node %s");
         }
         case "MAX_BACK":
         {
            if (name)
               return _("Translate field »maxBack« of Node %s »%s«");

            return _("Translate »maxBack« of Node %s");
         }
         case "MAX_FRONT":
         {
            if (name)
               return _("Translate field »maxFront« of Node %s »%s«");

            return _("Translate »maxFront of Node %s");
         }
         default:
         {
            return super .getUndoDescription (activeTool, name);
         }
      }
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

module .exports = SoundTool;
