"use strict";

const
   $        = require ("jquery"),
   electron = require ("electron"),
   Editor   = require ("../Undo/Editor"),
   _        = require ("../Application/GetText");

require ("./Popover");
require ("../Bits/Validate");

$.fn.exportNodePopover = function (node, oldExportedName, oldDescription = "")
{
   // Create content.

   const scene = node .getExecutionContext ();

   const content = $("<div></div>");

   $("<span></span>")
      .text ("Exported Name")
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter exported name"))
      .val (oldExportedName ?? scene .getUniqueExportName (node .getName ()))
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
      style: {
         width: "300px",
      },
      events: {
         show: (event, api) =>
         {
            $(nameInput) .add (descriptionInput) .off ();

            nameInput .validate (Editor .Id, () =>
            {
               electron .shell .beep ();
               nameInput .highlight ();
            });

            $(nameInput) .add (descriptionInput) .on ("keydown.exportNodePopover", event =>
            {
               if (event .key !== "Enter")
                  return;

               event .preventDefault ();

               api .toggle (false);

               if (!nameInput .val ())
                  return;

               if (oldExportedName && oldExportedName === nameInput .val ())
                  return;

               const
                  exportedName = scene .getUniqueExportName (nameInput .val ()),
                  description  = descriptionInput .val ();

               Editor .updateExportedNode (scene, exportedName, oldExportedName, node, description);
            });

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   })

   return this;
};

