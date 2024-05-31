"use strict";

const
   $           = require ("jquery"),
   path        = require ("path"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

require ("./Popover");

$.fn.materialPreviewPopover = async function (node)
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
      scene   = browser .currentScene;

   scene .setWorldURL (node .getExecutionContext () .worldURL);

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/MaterialPreview.x3d")));

   // Create texture node.

   const
      appearanceNode = browser .currentScene .getExportedNode ("Appearance"),
      x3dSyntax      = Editor .exportX3D (node .getExecutionContext (), [node]),
      nodes          = await Editor .importX3D (scene, x3dSyntax, new UndoManager ()),
      materialNode   = nodes [0];

   // Assign texture node.

   appearanceNode .material = materialNode;

   // Create tooltip.

   const tooltip = this .popover ({
      content: preview,
      events: {
         hide (event, api)
         {
            browser .dispose ();

            api .destroy (true);
         },
      },
   });

   return this;
};

