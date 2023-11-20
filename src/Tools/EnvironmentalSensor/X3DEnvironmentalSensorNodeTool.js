"use strict";

const
   X3DChildNodeTool     = require ("../Core/X3DChildNodeTool"),
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   X3D                  = require ("../../X3D"),
   Editor               = require ("../../Undo/Editor"),
   UndoManager          = require ("../../Undo/UndoManager");

class X3DEnvironmentalSensorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DEnvironmentalSensorNodeTool.x3d");

      this .tool .getField ("size")   .addReference (this .node ._size);
      this .tool .getField ("center") .addReference (this .node ._center);

      this .tool .getField ("isActive") .addInterest ("set_active__", this);

      this .tool .boxColor = this .toolBoxColor;
   }

   set_active__ (active)
   {
      if (active .getValue ())
      {
         this .initialSize   = this ._size   .copy ();
         this .initialCenter = this ._center .copy ();
      }
      else
      {
         X3DTransformNodeTool .beginUndo (this .tool .activeTool, this .getTypeName (), this .getDisplayName ());

         const
            size   = this ._size   .copy (),
            center = this ._center .copy ();

         this ._size   = this .initialSize;
         this ._center = this .initialCenter;

         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._size,   size);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._center, center);

         UndoManager .shared .endUndo ();
      }
   }
}

module .exports = X3DEnvironmentalSensorNodeTool;
