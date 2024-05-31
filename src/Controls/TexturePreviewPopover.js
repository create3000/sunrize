"use strict";

const
   $           = require ("jquery"),
   path        = require ("path"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");

$.fn.texturePreviewPopover = async function (node)
{
   // Create content.

   const preview = $("<div></div")

   const canvas = $("<x3d-canvas></x3d-canvas>")
      .css ({ width: "30vh", height: "30vh" })
      .attr ("splashScreen", false)
      .attr ("contextMenu", false)
      .attr ("notifications", false)
      .appendTo (preview);

   const
      browser = canvas .prop ("browser"),
      scene   = browser .createScene ();

   scene .setWorldURL (node .getExecutionContext () .worldURL);

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/TexturePreview.x3d")));

   // Create texture node.

   const
      x3dSyntax      = Editor .exportX3D (node .getExecutionContext (), [node]),
      nodes          = await Editor .importX3D (scene, x3dSyntax, new UndoManager ()),
      textureNode    = nodes [0],
      appearanceNode = browser .currentScene .getExportedNode ("Appearance");

   // Assign texture node.

   appearanceNode .texture = textureNode;

   // Sizes and special cases.

   for (const type of node .getType () .toReversed ())
   {
      switch (type)
      {
         case X3D .X3DConstants .GeneratedCubeMapTexture:
         {
            return;
         }
         case X3D .X3DConstants .X3DEnvironmentTextureNode:
         {
            $("<p></xp>")
               .text (`${node .getSize ()} × ${node .getSize ()}`)
               .appendTo (preview);
            break;
         }
         case X3D .X3DConstants .X3DTexture2DNode:
         {
            $("<p></xp>")
               .text (`${node .getWidth ()} × ${node .getHeight ()}`)
               .appendTo (preview);
            break;
         }
         case X3D .X3DConstants .X3DTexture3DNode:
         {
            $("<p></xp>")
               .text (`${node .getWidth ()} × ${node .getHeight ()} × ${node .getDepth ()}`)
               .appendTo (preview);
            break;
         }
         default:
            continue;
      }

      break;
   }

   // Create tooltip.

   const tooltip = this .popover ({
      content: preview,
      events: {
         hide (event, api)
         {
            textureNode .dispose ();
            browser     .dispose ();

            api .destroy (true);
         },
      },
   });

   return this;
};

