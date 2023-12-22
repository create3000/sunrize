"use strict";

const
   $           = require ("jquery"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.importNodePopover = function (inlineNode, exportedName, oldImportedName)
{
   // Create content.

   const executionContext = inlineNode .getExecutionContext ();

   const nameInput = $("<input></input>")
      .attr ("placeholder", _ ("Enter imported name"))
      .val (oldImportedName ?? executionContext .getUniqueImportName (exportedName));

   // Create tooltip.

   const tooltip = this .popover ({
      content: nameInput,
      events: {
         show: (event, api) =>
         {
            nameInput .validate (Editor .Id, () =>
            {
               $ .beep ();
               nameInput .highlight ();
            })
            .on ("keydown.importNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               if (!nameInput .val ())
                  return;

               if (oldImportedName && oldImportedName === nameInput .val ())
                  return;

               const importedName = executionContext .getUniqueImportName (nameInput .val ());

               Editor .updateImportedNode (executionContext, inlineNode, exportedName, importedName, oldImportedName);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

