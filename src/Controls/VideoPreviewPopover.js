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

   const
      preview   = $("<div></div"),
      container = $("<div></div") .appendTo (preview);

   async function loadNow ()
   {
      container .empty ();

      const video = $("<video controls></video>")
         .css ("min-width", "300px")
         .css ("width", "30vh")
         .appendTo (container);

      for (const url of node ._url)
      {
         $("<source></source>")
            .attr ("src", new URL (url, node .getExecutionContext () .worldURL))
            .appendTo (video);
      }
   }

   // Sizes and special cases.

   const sizes = $("<p></p>") .appendTo (preview);

   function loadState (loadState)
   {
      switch (loadState)
      {
         case X3D .X3DConstants .NOT_STARTED_STATE:
         {
            sizes .text (_("Loading not started."))
            break;
         }
         case X3D .X3DConstants .IN_PROGRESS_STATE:
         {
            sizes .text (_("Loading in progress."))
            break;
         }
         case X3D .X3DConstants .FAILED_STATE:
         {
            sizes .text (_("Loading failed."))
            break;
         }
         case X3D .X3DConstants .COMPLETE_STATE:
         {
            sizes .text (`${node .getWidth ()} × ${node .getHeight ()}`);
            break;
         }
      }
   }

   // Reload handling.

   const
      _loadState = Symbol (),
      _url       = Symbol ();

   node ._loadState .addFieldCallback (_loadState, loadState);
   node ._url .addFieldCallback (_url, loadNow);

   loadState (node ._loadState .getValue ());
   loadNow ();

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
            node ._loadState .removeFieldCallback (_loadState);
            node ._url       .removeFieldCallback (_url);

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

