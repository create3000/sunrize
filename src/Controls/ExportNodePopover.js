"use strict";

const
   $           = require ("jquery"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.exportNodePopover = function (node, oldExportedName)
{
   // Create content.

   const scene = node .getExecutionContext ();

   const nameInput = $("<input></input>")
      .attr ("placeholder", _ ("Enter exported name"))
      .val (oldExportedName ?? scene .getUniqueExportName (node .getName ()));

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
            .on ("keydown.exportNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               if (!nameInput .val ())
                  return;

               if (oldExportedName && oldExportedName === nameInput .val ())
                  return;

               const exportedName = scene .getUniqueExportName (nameInput .val ());

               UndoManager .shared .beginUndo (_ ("Update Exported Node »%s«"), exportedName);

               Editor .updateExportedNode (scene, exportedName, node);

               if (oldExportedName && oldExportedName !== exportedName)
                  Editor .removeExportedNode (scene, oldExportedName);

               UndoManager .shared .endUndo ();
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

