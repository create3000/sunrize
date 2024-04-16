"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   Editor           = require ("../../Undo/Editor");

class X3DEnvironmentalSensorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DEnvironmentalSensorNodeTool.x3d");

      this .tool .getField ("size")   .addReference (this .node ._size);
      this .tool .getField ("center") .addReference (this .node ._center);

      this .tool .getField ("isActive") .addInterest ("handleUndo", this);

      this .tool .boxColor = this .toolBoxColor;
   }

   beginUndo ()
   {
      this .undoSaveInitialValues (["size", "center"]);
   }

   getBBox (bbox, shadows)
   {
      if (shadows)
         return bbox .set ();

      return bbox .set (this ._size .getValue (), this ._center .getValue ());
   }
}

module .exports = X3DEnvironmentalSensorNodeTool;
