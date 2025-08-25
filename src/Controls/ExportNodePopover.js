"use strict";

const
   $        = require ("jquery"),
   electron = require ("electron"),
   Editor   = require ("../Undo/Editor"),
   _        = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.exportNodePopover = function (node, oldExportedName)
{
   // Create content.

   const scene = node .getExecutionContext ();

   const content = $("<div></div>");

   $("<span></span>")
      .text (_("Name"))
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter exported name"))
      .val (oldExportedName ?? scene .getUniqueExportName (node .getName ()))
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

               Editor .updateExportedNode (scene, exportedName, oldExportedName, node);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

