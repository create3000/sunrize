"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class SpatialSoundTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "SpatialSoundTool.x3d");

      this .tool .getValue () .getField ("location")          .addReference (this .node ._location);
      this .tool .getValue () .getField ("direction")         .addReference (this .node ._direction);
      this .tool .getValue () .getField ("coneInnerAngle")    .addReference (this .node ._coneInnerAngle);
      this .tool .getValue () .getField ("coneOuterAngle")    .addReference (this .node ._coneOuterAngle);
      this .tool .getValue () .getField ("referenceDistance") .addReference (this .node ._referenceDistance);

      this .tool .getValue () .getField ("isActive") .addInterest ("handleUndo", this);
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["location", "direction"]);
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

module .exports = SpatialSoundTool;
