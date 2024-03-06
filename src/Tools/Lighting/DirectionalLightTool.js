"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class DirectionalLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location") .addInterest ("set_location", this);
      this .tool .getField ("direction") .addReference (this .node ._direction);

      this .registerMetaDataCallback (this, "DirectionalLight/location", this .set_meta_location .bind (this));
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

   #changing = false;

   set_location ()
   {
      this .#changing = true;

      this .setMetaData ("DirectionalLight/location", this .tool .location);

      this .#changing = false;
   }

   set_meta_location ()
   {
      if (this .#changing)
         return;

      this .getMetaData ("DirectionalLight/location", this .tool .location);
   }
}

module .exports = DirectionalLightTool;
