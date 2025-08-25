"use strict";

const
   $        = require ("jquery"),
   electron = require ("electron"),
   Editor   = require ("../Undo/Editor"),
   _        = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.importNodePopover = function (inlineNode, exportedName, oldImportedName)
{
   // Create content.

   const executionContext = inlineNode .getExecutionContext ();

   const content = $("<div></div>");

   $("<span></span>")
      .text (_("Name"))
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter imported name"))
      .val (oldImportedName ?? executionContext .getUniqueImportName (exportedName))
      .appendTo (content);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      events: {
         show: (event, api) =>
         {
            nameInput .off () .validate (Editor .Id, () =>
            {
               electron .shell .beep ();
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

