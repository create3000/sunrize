"use strict";

const
   $ = require ("jquery"),
   _ = require ("../Application/GetText");

require ("./Popover");
require ("./RenameNodeInput");

$.fn.renameNodePopover = function (node)
{
   // Create content.

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter name"))
      .renameNodeInput (node);

   // Create tooltip.

   const tooltip = this .popover ({
      content: nameInput,
      events: {
         show: (event, api) =>
         {
            nameInput .off (".renameNodePopover") .on ("keydown.renameNodePopover", (event) =>
            {
               if (event .key !== "Enter")
                  return;

               api .toggle (false);
            })

            setTimeout (() => nameInput .trigger ("select"), 1);
         },
      },
   });

   return this;
};

