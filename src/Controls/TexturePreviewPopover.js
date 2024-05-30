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

   const preview = $("<x3d-canvas></x3d-canvas>")
      .css ({ width: "30vh", height: "30vh" })
      .attr ("splashScreen", false)
      .attr ("contextMenu", false)
      .attr ("notifications", false);

   const browser = preview .prop ("browser");

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/TexturePreview.x3d")));

   // Create texture node.

   const
      appearanceNode = browser .currentScene .getExportedNode ("Appearance"),
      textureNode    = node .create (browser .currentScene),
      _url           = Symbol ();

   function set_url ()
   {
      textureNode ._url = node ._url .map (url => new URL (url, node .getExecutionContext () .worldURL));
   }

   node ._url .addFieldCallback (_url, set_url);

   set_url ();

   textureNode .setup ();

   // Assign texture node.

   appearanceNode .texture = textureNode;

   // Create tooltip.

   const tooltip = this .popover ({
      content: preview,
      events: {
         hide (event, api)
         {
            node ._url .removeFieldCallback (_url);

            browser .dispose ();

            api .destroy (true);
         },
      },
   });

   return this;
};

