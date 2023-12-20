"use strict";

const
   $      = require ("jquery"),
   Editor = require ("../Undo/Editor"),
   _      = require ("../Application/GetText");

require ("./Popover");

$.fn.exportNodePopover = function (node)
{
   // Create content.

   const scene = node .getExecutionContext ();

   const nameInput = $("<input></input>")
      .attr ("placeholder", _ ("Enter export name"))
      .val (scene .getUniqueExportName (node .getName ()));

   // Create tooltip.

   const tooltip = this .popover ({
      content: nameInput,
      events: {
         show: (event, api) =>
         {
            nameInput .on ("keydown.exportNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               const exportedName = nameInput .val ();

               if (!exportedName)
                  return;

               Editor .updateExportedNode (scene, scene .getUniqueExportName (exportedName), node);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

