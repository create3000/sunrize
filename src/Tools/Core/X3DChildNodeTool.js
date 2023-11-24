"use strict";

const
   X3DNodeTool = require ("./X3DNodeTool"),
   X3D         = require ("../../X3D"),
   UndoManager = require ("../../Undo/UndoManager"),
   _           = require ("../../Application/GetText");

class X3DChildNodeTool extends X3DNodeTool
{
   static #tools = new Set ();
   #groupedTools = new Set ();

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

      if (active .getValue ())
         this .prepareUndo ();
      else
         this .finishUndo ()
   }

   prepareUndo ()
   {
      // Begin undo.

      const
         typeName = this .getTypeName (),
         name     = this .getDisplayName ();

      switch (this .tool .activeTool)
      {
         case "TRANSLATE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate %s"), typeName);
            break;
         }
         case "ROTATE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Rotate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Rotate %s"), typeName);
            break;
         }
         case "SCALE":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Scale %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Scale %s"), typeName);
            break;
         }
         case "CENTER":
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s"), typeName);
            break;
         }
      }

      // Prepare undo.

      if (this .beginUndo ())
         this .#groupedTools .add (this);

      if (this .tool .group === "NONE")
         return;

      // Prepare grouping.

      for (const other of X3DChildNodeTool .#tools)
      {
         if (other .tool .group === `${this .tool .activeTool}_TOOL`)
            other .tool .grouped = true;
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

   finishUndo ()
   {
      for (const other of X3DChildNodeTool .#tools)
      {
         if (other .tool .grouped)
            other .tool .grouped = false;
      }

      for (const other of this .#groupedTools)
         other .endUndo ();

      this .#groupedTools .clear ();

      UndoManager .shared .endUndo ();
   }

   beginUndo () { }

   endUndo () { }

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
