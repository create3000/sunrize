"use strict";

const
   X3DNodeTool = require ("./X3DNodeTool"),
   X3D         = require ("../../X3D"),
   UndoManager = require ("../../Undo/UndoManager"),
   _           = require ("../../Application/GetText");

class X3DChildNodeTool extends X3DNodeTool
{
   static #tools = new Set ();

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

   prepareUndo (center = false)
   {
      // Begin undo.

      const
         tool     = center ? 3 : this .tool .activeTool,
         typeName = this .getTypeName (),
         name     = this .getDisplayName ();

      switch (tool)
      {
         case 0: // "TRANSLATE"
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate %s"), typeName);
            break;
         }
         case 1: // "ROTATE"
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Rotate %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Rotate %s"), typeName);
            break;
         }
         case 2: // "SCALE"
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Scale %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Scale %s"), typeName);
            break;
         }
         case 3: // "CENTER"
         {
            if (name)
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s »%s«"), typeName, name);
            else
               UndoManager .shared .beginUndo (_ ("Translate Center Of %s"), typeName);
            break;
         }
      }

      // Prepare grouping.

      for (const other of X3DChildNodeTool .#tools)
      {
         if (other !== this)
         {
            if (!other .tool .group)
               continue;
         }

         if (!center)
         {
            if (other .tool .group !== this .tool .group)
               continue;
         }

         if (other .beginUndo (this) === false)
            continue;

         other .tool .grouped = true;
      }
   }

   finishUndo ()
   {
      for (const other of X3DChildNodeTool .#tools)
      {
         if (!other .tool .grouped)
            continue;

         other .tool .grouped = false;

         other .endUndo ();
      }

      UndoManager .shared .endUndo ();
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
