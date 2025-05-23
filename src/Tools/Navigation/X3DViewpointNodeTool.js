"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DViewpointNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   toolType = 0;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "X3DViewpointNodeTool.x3d");

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);

      this .node ._isBound .addFieldInterest (this .tool .getField ("bound"));

      this .tool .type  = this .toolType;
      this .tool .bound = this .node ._isBound;
   }

   disposeTool ()
   {
      this .node ._isBound .removeFieldInterest (this .tool .getField ("bound"));

      super .disposeTool ();
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

module .exports = X3DViewpointNodeTool;
