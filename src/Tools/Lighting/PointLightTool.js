"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class PointLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location") .addReference (this .node ._location);

      this .tool .type = 1;
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location"]);
   }
}

module .exports = PointLightTool;
