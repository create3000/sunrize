"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class DirectionalLightTool extends X3DLightNodeTool
{
   #changing = false;

   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location") .addInterest ("set_location", this);
      this .tool .getField ("direction") .addReference (this .node ._direction);

      this .addMetaDataCallback (this, "DirectionalLight/location", this .set_meta_location .bind (this));
      this .getMetaData ("DirectionalLight/location", this .tool .location);

      this .tool .type = 0;
   }

   disposeTool ()
   {
      this .removeMetaDataCallback (this, "DirectionalLight/location");

      super .disposeTool ();
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction"]);
   }

   set_location ()
   {
      this .#changing = true;

      this .setMetaData ("DirectionalLight/location", this .tool .location);
   }

   set_meta_location ()
   {
      if (this .#changing)
      {
         this .#changing = false;
         return;
      }

      this .getMetaData ("DirectionalLight/location", this .tool .location);
   }
}

module .exports = DirectionalLightTool;
