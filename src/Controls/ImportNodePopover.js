"use strict";

const
   $      = require ("jquery"),
   Editor = require ("../Undo/Editor"),
   _      = require ("../Application/GetText");

require ("./Popover");

$.fn.importNodePopover = function (inlineNode, exportedName)
{
   // Create content.

   const executionContext = inlineNode .getExecutionContext ();

   const nameInput = $("<input></input>")
      .attr ("placeholder", _ ("Enter import name"))
      .val (executionContext .getUniqueImportName (exportedName));

   // Create tooltip.

   const tooltip = this .popover ({
      content: nameInput,
      events: {
         show: (event, api) =>
         {
            nameInput .on ("keydown.importNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               const importedName = nameInput .val ();

               if (!importedName)
                  return;

               Editor .updateImportedNode (executionContext, inlineNode, exportedName, importedName);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

