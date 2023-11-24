"use strict";

const
   X3DNodeTool = require ("./X3DNodeTool"),
   X3D         = require ("../../X3D"),
   Editor      = require ("../../Undo/Editor"),
   UndoManager = require ("../../Undo/UndoManager"),
   _           = require ("../../Application/GetText");

class X3DChildNodeTool extends X3DNodeTool
{
   static #tools = new Set ();

   #groupedTools  = new Set ();
   #initialValues = new Map ();

   getMustDisplay ()
   {
      return true;
   }

   async initializeTool (... args)
   {
      await this .loadTool (... args);

      X3DChildNodeTool .#tools .add (this);
   }

   disposeTool ()
   {
      X3DChildNodeTool .#tools .delete (this);

      super .disposeTool ();
   }

   handleUndo (active)
   {
      if (!this .tool .undo)
         return;

      console .log (this .getTypeName (), active .getValue (), this .tool .activeTool)

      if (active .getValue ())
         this .prepareUndo ();
      else
         this .finishUndo ()
   }

   prepareUndo ()
   {
      // Begin undo.

      const
         typeName    = this .getTypeName (),
         name        = this .getDisplayName (),
         description = this .getUndoDescription (this .tool .activeTool, name);

      UndoManager .shared .beginUndo (description, typeName, name);

      // Prepare undo.

      if (this .beginUndo () === false)
         return;

      this .#groupedTools .add (this);

      if (this .tool .group === "NONE")
         return;

      // Prepare grouping.

      for (const other of X3DChildNodeTool .#tools)
      {
         if (other .tool .group === `${this .tool .activeTool}_TOOL`)
            other .tool .grouping = true;
      }

      for (const other of X3DChildNodeTool .#tools)
      {
         if (other === this)
            continue;

         if (other .tool .group !== this .tool .group)
            continue;

         if (other .beginUndo () === false)
            continue;

         this .#groupedTools .add (other);
      }
   }

   getUndoDescription (activeTool, name)
   {
      switch (activeTool)
      {
         case "TRANSLATE":
         {
            if (name)
               return _ ("Translate %s »%s«");

            return _ ("Translate %s");
         }
         case "ROTATE":
         {
            if (name)
               return _ ("Rotate %s »%s«");

            return _ ("Rotate %s");
         }
         case "SCALE":
         {
            if (name)
               return _ ("Scale %s »%s«");

            return _ ("Scale %s");
         }
         case "CENTER":
         {
            if (name)
               return _ ("Translate Center Of %s »%s«");

            return _ ("Translate Center Of %s");
         }
         default:
         {
            return `No Undo Description Available For '${activeTool}'`;
         }
      }
   }

   finishUndo ()
   {
      for (const other of X3DChildNodeTool .#tools)
      {
         if (other .tool .grouping)
            other .tool .grouping = false;
      }

      for (const other of this .#groupedTools)
         other .endUndo ();

      this .#groupedTools .clear ();

      UndoManager .shared .endUndo ();
   }

   beginUndo () { }

   endUndo ()
   {
      this .undoSetValues ();
   }

   undoSaveInitialValues (fields)
   {
      for (const name of fields)
         this .#initialValues .set (name, this .getField (name) .copy ());
   }

   undoSetValues ()
   {
      for (const [name, initialValue] of this .#initialValues)
      {
         const value = this .getField (name) .copy ();

         this .getField (name) .assign (initialValue);

         Editor .setFieldValue (this .getExecutionContext (), this .node, this .getField (name), value);
      }

      this .#initialValues .clear ();
   }

   traverse (type, renderObject)
   {
      switch (type)
      {
         case X3D .TraverseType .POINTER:
            break;
         default:
            this .node .traverse (type, renderObject);
            break;
      }

      renderObject .getHumanoids () .push (null);

      this .toolInnerNode ?.traverse (type, renderObject);

      renderObject .getHumanoids () .pop ();
   }
}

module .exports = X3DChildNodeTool;
