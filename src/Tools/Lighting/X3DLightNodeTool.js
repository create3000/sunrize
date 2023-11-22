"use strict";

const
   X3DChildNodeTool     = require ("../Core/X3DChildNodeTool"),
   X3DTransformNodeTool = require ("../Grouping/X3DTransformNodeTool"),
   Editor               = require ("../../Undo/Editor"),
   UndoManager          = require ("../../Undo/UndoManager");

class X3DLightNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DLightNodeTool.x3d");

      this .tool .getField ("on")        .addReference (this .node ._on);
      this .tool .getField ("color")     .addReference (this .node ._color);
      this .tool .getField ("intensity") .addReference (this .node ._intensity);

      this .tool .getField ("isActive") .addInterest ("set_active__", this);
   }

   #initialLocation;
   #initialDirection;

   set_active__ (active)
   {
      if (active .getValue ())
      {
         this .#initialLocation  = this ._location  ?.copy ();
         this .#initialDirection = this ._direction ?.copy ();
      }
      else
      {
         X3DTransformNodeTool .beginUndo (this .tool .activeTool, this .getTypeName (), this .getDisplayName ());

         const
            location  = this ._location  ?.copy (),
            direction = this ._direction ?.copy ();

         if (location)
            this ._location = this .#initialLocation;

         if (direction)
            this ._direction = this .#initialDirection;

         if (location)
            Editor .setFieldValue (this .getExecutionContext (), this .node, this ._location, location);

         if (direction)
            Editor .setFieldValue (this .getExecutionContext (), this .node, this ._direction, direction);

         UndoManager .shared .endUndo ();
      }
   }
}

module .exports = X3DLightNodeTool;
