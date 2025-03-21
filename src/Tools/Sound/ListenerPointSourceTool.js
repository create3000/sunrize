"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class ListenerPointSourceTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "ListenerPointSourceTool.x3d");

      this .tool .getField ("position")    .addReference (this .node ._position);
      this .tool .getField ("orientation") .addReference (this .node ._orientation);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["position", "orientation"]);
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

module .exports = ListenerPointSourceTool;
