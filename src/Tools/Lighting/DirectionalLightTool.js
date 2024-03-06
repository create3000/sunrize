"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class DirectionalLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location") .addInterest ("set_location", this);
      this .tool .getField ("direction") .addReference (this .node ._direction);

      this .getMetaData ("DirectionalLight/location", this .tool .location);

      this .tool .type = 0;
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction"]);
   }

   set_location ()
   {
      this .setMetaData ("DirectionalLight/location", this .tool .location);
   }
}

module .exports = DirectionalLightTool;
