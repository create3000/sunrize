"use strict";

const X3DChildNodeTool = require ("../Core/X3DChildNodeTool");

class X3DEnvironmentalSensorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .loadTool ("tool", __dirname, "X3DEnvironmentalSensorNodeTool.x3d");

      this .tool .getValue () .getField ("size")   .addReference (this .node ._size);
      this .tool .getValue () .getField ("center") .addReference (this .node ._center);

      this .tool .getValue () .getField ("isActive") .addInterest ("handleUndo", this);

      this .tool .boxColor = this .toolBoxColor;
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["size", "center"]);
   }

   isBoundedObject ()
   {
      return true;
   }

   getBBox (bbox, shadows)
   {
      if (shadows)
         return bbox .set ();

      return bbox .set (this ._size .getValue (), this ._center .getValue ());
   }
}

module .exports = X3DEnvironmentalSensorNodeTool;
