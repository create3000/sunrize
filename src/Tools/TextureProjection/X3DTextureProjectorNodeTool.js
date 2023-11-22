"use strict";

const
   X3DChildNodeTool = require ("../Core/X3DChildNodeTool"),
   Editor           = require ("../../Undo/Editor"),
   UndoManager      = require ("../../Undo/UndoManager");

class X3DTextureProjectorNodeTool extends X3DChildNodeTool
{
   static createOnSelection = false;

   async initializeTool ()
   {
      await super .initializeTool (__dirname, "X3DTextureProjectorNodeTool.x3d");

      this .tool .getField ("on")        .addReference (this .node ._on);
      this .tool .getField ("location")  .addReference (this .node ._location);
      this .tool .getField ("direction") .addReference (this .node ._direction);
      this .tool .getField ("upVector")  .addReference (this .node ._upVector);
      this .tool .getField ("texture")   .addReference (this .node ._texture);

      this .tool .getField ("isActive") .addInterest ("set_active__", this);

      this .addExternalNode (this .node ._texture);
   }

   #initialLocation;
   #initialDirection;
   #initialUpVector;

   set_active__ (active)
   {
      if (active .getValue ())
      {
         this .#initialLocation  = this ._location  .copy ();
         this .#initialDirection = this ._direction .copy ();
         this .#initialUpVector  = this ._upVector  .copy ();
      }
      else
      {
         X3DChildNodeTool .beginUndo (this .tool .activeTool, this .getTypeName (), this .getDisplayName ());

         const
            location  = this ._location  .copy (),
            direction = this ._direction .copy (),
            upVector  = this ._upVector  .copy ();

         this ._location  = this .#initialLocation;
         this ._direction = this .#initialDirection;
         this ._upVector  = this .#initialUpVector;

         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._location,  location);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._direction, direction);
         Editor .setFieldValue (this .getExecutionContext (), this .node, this ._upVector,  upVector);

         UndoManager .shared .endUndo ();
      }
   }
}

module .exports = X3DTextureProjectorNodeTool;
