"use strict";

const
   $           = require ("jquery"),
   path        = require ("path"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");

$.fn.audioPreviewPopover = async function (node)
{
   // Create content.

   const preview = $("<div></div");

   async function loadNow ()
   {
      preview .empty ();

      const audio = $("<audio controls></audio>")
         .appendTo (preview);

      for (const url of node ._url)
      {
         $("<source></source>")
            .attr ("src", new URL (url, node .getExecutionContext () .worldURL))
            .appendTo (audio);
      }
   }

   loadNow ();

   // Reload handling.

   const _url = Symbol ();

   node ._url .addFieldCallback (_url, loadNow);

   this .data ("preview", { loadNow });

   // Create tooltip.

   const tooltip = this .popover ({
      preview: true,
      content: preview,
      show: {
         modal: false,
      },
      style: {
         classes: "qtip-tipsy qtip-preview qtip-audio",
      },
      events: {
         hide: (event, api) =>
         {
            node ._url .removeFieldCallback (_url);

            this .removeData ("preview");

            $(".tree-view") .off (".preview");

            api .destroy (true);
         },
      },
   });

   $(".tree-view") .on ("scroll.preview", () => this .qtip ("reposition"));

   this .qtip ("reposition");

   return this;
};

