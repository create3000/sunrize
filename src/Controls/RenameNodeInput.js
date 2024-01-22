"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("../Bits/Validate");

$.fn.renameNodeInput = function (node)
{
   this
      .off ("keydown.renameNodeInput")
      .val (node ? node .getName () : "");

   this .validate (Editor .Id, () =>
   {
      $ .beep ();
      this .highlight ();
   })
   .on ("keydown.renameNodeInput", (event) =>
   {
      if (!node)
         return;

      if (event .key !== "Enter")
         return;

      event .preventDefault ();

      let name = this .val ();

      if (name === node .getName ())
         return;

      const executionContext = node .getExecutionContext ();

      if (node instanceof X3D .X3DProtoDeclarationNode)
      {
         if (!name)
            return;

         if (node .isExternProto)
         {
            name = executionContext .getUniqueExternProtoName (name);

            const externproto = node;

            UndoManager .shared .beginUndo (_("Update Extern Proto Declaration »%s«"), name);

            Editor .updateExternProtoDeclaration (executionContext, name, externproto);

            if (!executionContext .protos .get (name))
            {
               const available = Editor .getNextAvailableProtoNode (executionContext, externproto);

               if (available)
                  Editor .replaceProtoNodes (executionContext, available, externproto);
            }

            UndoManager .shared .endUndo ();
         }
         else
         {
            name = executionContext .getUniqueProtoName (name);

            const proto = node;

            UndoManager .shared .beginUndo (_("Update Proto Declaration »%s«"), name);

            Editor .updateProtoDeclaration (executionContext, name, proto);

            const available = Editor .getNextAvailableProtoNode (executionContext, proto);

            if (available)
               Editor .replaceProtoNodes (executionContext, available, proto);

            UndoManager .shared .endUndo ();
         }
      }
      else
      {
         if (name)
            Editor .updateNamedNode (executionContext, executionContext .getUniqueName (name), node);
         else
            Editor .removeNamedNode (executionContext, node);
      }
   })

   return this;
};

