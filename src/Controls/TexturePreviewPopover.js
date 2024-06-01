"use strict";

const
   $           = require ("jquery"),
   path        = require ("path"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");

function formatTime (time)
{
   const s = time % 60;

   let string = s .toFixed (2) .padStart (5, "0");

   time /= 60;
   time  = Math .floor (time);

   const m = time % 60;

   string = String (m) .padStart (2, "0") + ":" + string;

   time /= 60;
   time  = Math .floor (time);

   const h = time % 60;

   string = String (h) .padStart (2, "0") + ":" + string;

   return string;
}

$.fn.texturePreviewPopover = async function (node)
{
   // Create content.

   const preview = $("<div></div")

   const canvas = $("<x3d-canvas></x3d-canvas>")
      .css ({ width: "30vh", height: "30vh" })
      .attr ("cache", false)
      .attr ("splashScreen", false)
      .attr ("contextMenu", false)
      .attr ("notifications", false)
      .appendTo (preview);

   const
      browser = canvas .prop ("browser"),
      scene   = browser .createScene (browser .getProfile ("Core"));

   scene .setWorldURL (node .getExecutionContext () .worldURL);

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/TexturePreview.x3d")));

   // Create texture node.

   const
      x3dSyntax      = Editor .exportX3D (node .getExecutionContext (), [node]),
      nodes          = await Editor .importX3D (scene, x3dSyntax, new UndoManager ()),
      previewNode    = nodes [0],
      appearanceNode = browser .currentScene .getExportedNode ("Appearance");

   // Assign texture node.

   for (const field of previewNode .getFields ())
   {
      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
         case X3D .X3DConstants .MFNode:
            break;
         default:
            field .addReference (node .getField (field .getName ()));
            field .removeFieldInterest (node .getField (field .getName ()));
            break;
      }
   }

   appearanceNode .texture = previewNode;

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
            sizesText ();
            break;
         }
      }
   }

   function sizesText ()
   {
      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .MovieTexture:
            {
               sizes .text (`${node .getWidth ()} × ${node .getHeight ()}, ${formatTime (node ._duration_changed .getValue ())}`);
               break;
            }
            case X3D .X3DConstants .X3DEnvironmentTextureNode:
            {
               sizes .text (`${node .getSize ()} × ${node .getSize ()}`);
               break;
            }
            case X3D .X3DConstants .X3DTexture2DNode:
            {
               sizes .text (`${node .getWidth ()} × ${node .getHeight ()}`);
               break;
            }
            case X3D .X3DConstants .X3DTexture3DNode:
            {
               sizes .text (`${node .getWidth ()} × ${node .getHeight ()} × ${node .getDepth ()}`);
               break;
            }
            default:
               continue;
         }

         break;
      }
   }

   const _loadState = Symbol ();

   node ._loadState .addFieldCallback (_loadState, loadState);

   loadState (node ._loadState .getValue ());

   // Reload handling.

   this .data ("preview", previewNode);

   // Create tooltip.

   const tooltip = this .popover ({
      preview: true,
      content: preview,
      show: {
         modal: false,
      },
      style: {
         classes: "qtip-tipsy qtip-preview",
      },
      events: {
         hide: (event, api) =>
         {
            node ._loadState .removeFieldCallback (_loadState);

            this .removeData ("preview");

            previewNode .dispose ();
            browser     .dispose ();

            $(".tree-view") .off (".preview");

            api .destroy (true);
         },
      },
   });

   $(".tree-view") .on ("scroll.preview", () => this .qtip ("reposition"));

   return this;
};

