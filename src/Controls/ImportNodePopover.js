"use strict";

const
   $        = require ("jquery"),
   electron = require ("electron"),
   Editor   = require ("../Undo/Editor"),
   _        = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.importNodePopover = function (inlineNode, exportedName, oldImportedName, oldDescription = "")
{
   // Create content.

   const executionContext = inlineNode .getExecutionContext ();

   const content = $("<div></div>");

   $("<span></span>")
      .text ("Imported Name")
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter imported name"))
      .val (oldImportedName ?? executionContext .getUniqueImportName (exportedName))
      .appendTo (content);

   $("<span></span>")
      .text ("Description")
      .appendTo (content);

   const descriptionInput = $("<input></input>")
      .attr ("placeholder", _("Enter description"))
      .val (oldDescription)
      .appendTo (content);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      extension:
      {
         wide: true,
      },
      events: {
         show: (event, api) =>
         {
            $(nameInput) .add (descriptionInput) .off ();

            nameInput .off () .validate (Editor .Id, () =>
            {
               electron .shell .beep ();
               nameInput .highlight ();
            });

            $(nameInput) .add (descriptionInput) .on ("keydown.importNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               if (!nameInput .val ())
                  return;

               const
                  importedName = nameInput .val () !== oldImportedName
                     ? executionContext .getUniqueImportName (nameInput .val ())
                     : oldImportedName,
                  description  = descriptionInput .val ();

               Editor .updateImportedNode (executionContext, inlineNode, exportedName, importedName, oldImportedName, description);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

