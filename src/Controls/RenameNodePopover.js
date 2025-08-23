"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery"),
   _   = require ("../Application/GetText");

require ("./Popover");
require ("./RenameNodeInput");

$.fn.renameNodePopover = function (node)
{
   // Create content.

   const content = $("<div></div>");

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter name"))
      .appendTo (content);

   if (node instanceof X3D .X3DProtoDeclarationNode)
   {
      $("<input></input>")
         .addClass ("appinfo")
         .attr ("placeholder", _("Application information"))
         .val (node .getAppInfo ())
         .appendTo (content);

      $("<input></input>")
         .addClass ("documentation")
         .attr ("placeholder", _("Documentation"))
         .val (node .getDocumentation ())
         .appendTo (content);
   }

   // Setup input after appInfo and documentation.
   nameInput .renameNodeInput (node);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      events: {
         show: (event, api) =>
         {
            content .children () .off (".renameNodePopover") .on ("keydown.renameNodePopover", (event) =>
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

