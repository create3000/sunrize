"use strict";

const
   $    = require ("jquery"),
   path = require ("path"),
   X3D  = require ("../X3D"),
   _    = require ("../Application/GetText");

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

   const browser = canvas .prop ("browser");

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/TexturePreview.x3d")));

   // Create texture node.

   const
      appearanceNode = browser .currentScene .getExportedNode ("Appearance"),
      textureNode    = node .create (browser .currentScene);

   for (const type of node .getType () .toReversed ())
   {
      switch (type)
      {
         case X3D .X3DConstants .ComposedCubeMapTexture:
         case X3D .X3DConstants .GeneratedCubeMapTexture:
         case X3D .X3DConstants .ComposedTexture3D:
         {
            return;
         }
         case X3D .X3DConstants .PixelTexture:
         case X3D .X3DConstants .PixelTexture3D:
         {
            textureNode ._image = node ._image;
            break;
         }
         case X3D .X3DConstants .ImageTextureAtlas:
         {
            textureNode ._slicesOverX    = node ._slicesOverX;
            textureNode ._slicesOverY    = node ._slicesOverY;
            textureNode ._numberOfSlices = node ._numberOfSlices;
            continue;
         }
         case X3D .X3DConstants .X3DUrlObject:
         {
            textureNode ._url = node ._url .map (url => new URL (url, node .getExecutionContext () .worldURL));
            break;
         }
         default:
            continue;
      }

      break;
   }

   textureNode .setup ();

   // Assign texture node.

   appearanceNode .texture = textureNode;

   // Sizes

   for (const type of node .getType () .toReversed ())
   {
      switch (type)
      {
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

