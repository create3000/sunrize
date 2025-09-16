"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("../Bits/Validate");

$.fn.renameNodeInput = function (node)
{
   this .data ("node") ?.name_changed .removeFieldCallback (this);
   this .data ("node", node);

   node ?.name_changed .addFieldCallback (this, () => this .val (node .getName ()));

   if (node)
      this .removeAttr ("disabled");
   else
      this .attr ("disabled", "");

   this
      .val (node ? node .getName () : "")
      .siblings () .addBack () .off ("keydown.renameNodeInput");

   this .validate (Editor .Id, () =>
   {
      electron .shell .beep ();
      this .highlight ();
   })
   .siblings () .addBack () .on ("keydown.renameNodeInput", (event) =>
   {
      if (!node)
         return;

      if (event .key !== "Enter")
         return;

      event .preventDefault ();

      let name = this .val ();

      const executionContext = node .getExecutionContext ();

      if (node instanceof X3D .X3DProtoDeclarationNode)
      {
         if (!name)
            return;

         if (node .isExternProto)
         {
            if (name === node .getName ())
               return;

            const externproto = node;

            UndoManager .shared .beginUndo (_("Update Extern Proto Declaration »%s«"), name);

            name = executionContext .getUniqueExternProtoName (name);

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
            const
               proto         = node,
               appInfo       = this .siblings (".appinfo") .val (),
               documentation = this .siblings (".documentation") .val ();

            UndoManager .shared .beginUndo (_("Update Proto Declaration »%s«"), name);

            if (name !== node .getName ())
            {
               name = executionContext .getUniqueProtoName (name);

               Editor .updateProtoDeclaration (executionContext, name, proto);
            }

            if (appInfo !== node .getAppInfo ())
               Editor .updateAppInfo (proto, appInfo);

            if (documentation !== node .getDocumentation ())
               Editor .updateDocumentation (proto, documentation);

            const available = Editor .getNextAvailableProtoNode (executionContext, proto);

            if (available)
               Editor .replaceProtoNodes (executionContext, available, proto);

            UndoManager .shared .endUndo ();
         }
      }
      else
      {
         if (name === node .getName ())
            return;

         if (name)
            Editor .updateNamedNode (executionContext, executionContext .getUniqueName (name), node);
         else
            Editor .removeNamedNode (executionContext, node);
      }
   })

   return this;
};
