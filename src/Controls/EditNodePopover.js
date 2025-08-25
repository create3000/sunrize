"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery"),
   _   = require ("../Application/GetText");

require ("./Popover");
require ("./RenameNodeInput");

$.fn.editNodePopover = function (node)
{
   // Create content.

   const content = $("<div></div>");

   $("<span></span>")
      .text (_("Name"))
      .appendTo (content);

   const nameInput = $("<input></input>")
      .attr ("placeholder", _("Enter name"))
      .appendTo (content);

   if (node instanceof X3D .X3DProtoDeclaration)
   {
      $("<span></span>")
         .text (_("Application Information"))
         .appendTo (content);

      $("<input></input>")
         .addClass ("appinfo")
         .attr ("placeholder", _("Enter application information"))
         .val (node .getAppInfo ())
         .appendTo (content);

      $("<span></span>")
         .text (_("Documentation"))
         .appendTo (content);

      $("<input></input>")
         .addClass ("documentation")
         .attr ("placeholder", _("Enter documentation"))
         .val (node .getDocumentation ())
         .appendTo (content);
   }

   // Setup input after appInfo and documentation.
   nameInput .renameNodeInput (node);

   // Create tooltip.

   const tooltip = this .popover ({
      content: content,
      extension:
      {
         wide: node instanceof X3D .X3DProtoDeclaration,
      },
      events: {
         show: (event, api) =>
         {
            content .children () .off (".editNodePopover") .on ("keydown.editNodePopover", (event) =>
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

