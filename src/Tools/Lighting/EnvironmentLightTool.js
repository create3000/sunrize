"use strict";

const X3DLightNodeTool = require ("./X3DLightNodeTool");

class EnvironmentLightTool extends X3DLightNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ();

      this .tool .getField ("location") .addReference (this .node ._origin);
      this .tool .getField ("rotation") .addReference (this .node ._rotation);

      this .tool .type = 3;
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["origin", "rotation"]);
   }
}

module .exports = EnvironmentLightTool;
