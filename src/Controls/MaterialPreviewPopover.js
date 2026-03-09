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

   const preview = $("<div></div") .css ("width", "30vh");

   const canvas = $("<x3d-canvas></x3d-canvas>")
      .css ({ width: "30vh", height: "30vh" })
      .attr ("cache", "false")
      .attr ("splashScreen", "false")
      .attr ("contextMenu", "false")
      .attr ("notifications", "false")
      .attr ("colorSpace", node .getBrowser () .getBrowserOption ("ColorSpace"))
      .attr ("xrSessionMode", "NONE")
      .appendTo (preview);

   const
      browser = canvas .prop ("browser"),
      scene   = await browser .createScene (browser .getProfile ("Core"));

   scene .setWorldURL (node .getExecutionContext () .worldURL);

   await browser .loadURL (new X3D .MFString (path .join (__dirname, "../assets/X3D/MaterialPreview.x3d")));

   // Create material node.

   const
      appearanceNode = browser .currentScene .getExportedNode ("Appearance"),
      nodesToExport = [node],
      x3dSyntax     = await Editor .exportX3D (browser .currentScene, nodesToExport),
      nodes         = await Editor .importX3D (scene, x3dSyntax),
      previewNode   = nodes [0];

   // Assign material node.

   for (const field of previewNode .getFields ())
      field .addReference (node .getField (field .getName ()));

   previewNode .setup ();

   appearanceNode .material = previewNode;

   // Handle TwoSidedMaterial;

   if (node .getType () .includes (X3D .X3DConstants .TwoSidedMaterial))
   {
      // Create material node.

      const appearanceNode = browser .currentScene .getExportedNode ("BackAppearance");

      var backPreviewNode = scene .createNode ("Material");

      // Assign material node.

      const names = [
         "ambientIntensity",
         "diffuseColor",
         "specularColor",
         "emissiveColor",
         "shininess",
         "transparency",
      ];

      for (const name of names)
      {
         const
            field = backPreviewNode .getField (name),
            back  = `back${name [0] .toUpperCase ()}${name .slice (1)}`;

         field .addReference (node .getField (back));
      }

      appearanceNode .material = backPreviewNode;
   }

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
            previewNode      .dispose ();
            backPreviewNode ?.dispose ();
            browser          .dispose ();

            $(".tree-view") .off (".preview");

            api .destroy (true);
         },
      },
   });

   $(".tree-view") .on ("scroll.preview", () => this .qtip ("reposition"));

   return this;
};

