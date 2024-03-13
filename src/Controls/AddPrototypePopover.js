"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   DataStorage = require ("../Application/DataStorage"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

const types = {
   externproto: 0,
   proto: 1,
};

$.fn.addPrototypePopover = function (executionContext, type)
{
   // Create config.

   const config = new DataStorage (localStorage, "Sunrize.");

   config .setDefaultValues ({ selectedIndex: 1 });

   // Create content.

   const content = $("<div></div>");

   const protoMenu = $("<select></select>")
      .append ($("<option></option>") .text ("EXTERNPROTO"))
      .append ($("<option></option>") .text ("PROTO"))
      .prop ("selectedIndex", config .selectedIndex = type ? types [type] : config .selectedIndex)
      .on ("change", () => config .selectedIndex = protoMenu .prop ("selectedIndex"))
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter name"))
      .appendTo (content);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      events: {
         show (event, api)
         {
            nameInput .validate (Editor .Id, () =>
            {
               electron .shell .beep ();
               nameInput .highlight ();
            })
            .on ("keydown.addPrototypePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               api .toggle (false);
               event .preventDefault ();

               if (!nameInput .val () .length)
                  return;

               switch (protoMenu .prop ("selectedIndex"))
               {
                  case 0:
                  {
                     const name = executionContext .getUniqueExternProtoName (nameInput .val ());

                     UndoManager .shared .beginUndo (_("Add Extern Proto Declaration »%s«"), name);

                     const externproto = Editor .addExternProtoDeclaration (executionContext, name);

                     if (!executionContext .protos .get (name))
                     {
                        const available = Editor .getNextAvailableProtoNode (executionContext, externproto);

                        if (available)
                           Editor .replaceProtoNodes (executionContext, available, externproto);
                     }

                     UndoManager .shared .endUndo ();
                     break;
                  }
                  case 1:
                  {
                     const name = executionContext .getUniqueProtoName (nameInput .val ());

                     UndoManager .shared .beginUndo (_("Add Proto Declaration »%s«"), name);

                     const
                        proto     = Editor .addProtoDeclaration (executionContext, name),
                        available = Editor .getNextAvailableProtoNode (executionContext, proto);

                     if (available)
                        Editor .replaceProtoNodes (executionContext, available, proto);

                     UndoManager .shared .endUndo ();
                     break;
                  }
               }
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   });

   return this;
};

