"use strict";

const
   $           = require ("jquery"),
   path        = require ("path"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");

$.fn.videoPreviewPopover = async function (node)
{
   // Create content.

   const preview = $("<div></div");

   async function loadNow ()
   {
      preview .empty ();

      const video = $("<video controls></video>")
         .css ("min-width", "300px")
         .css ("width", "30vh")
         .appendTo (preview);

      for (const url of node ._url)
      {
         $("<source></source>")
            .attr ("src", new URL (url, node .getExecutionContext () .worldURL))
            .appendTo (video);
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
         classes: "qtip-tipsy qtip-preview qtip-video",
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

   setTimeout (() => this .qtip ("reposition"));

   return this;
};

