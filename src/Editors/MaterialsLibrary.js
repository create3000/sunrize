"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane");

module .exports = class Materials extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   #list;

   async update ()
   {
      // Fill output.

      if (this .#list)
      {
         this .output .append (this .#list);
         return;
      }

      // Create list.

      this .#list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list");

      const
         canvas  = $("<x3d-canvas preserveDrawingBuffer='true'></x3d-canvas>"),
         browser = canvas .prop ("browser"),
         scene   = await browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

      const
         materials = scene .getExportedNode ("Materials"),
         viewpoint = scene .getExportedNode ("Viewpoint"),
         nodes     = [ ];

      for (const [g, group] of materials .children .entries ())
      {
         $("<li></li>")
            .addClass ("component")
            .text (group .getNodeName ())
            .appendTo (this .#list);

         for (const [c, node] of group .children .entries ())
         {
            const material = node .children [0] .appearance .material;

            nodes .push ($("<li></li>")
               .addClass (["node", "icon"])
               .text (`${group .getNodeName ()} ${c + 1}`)
               .attr ("group", g)
               .attr ("child", c)
               .appendTo (this .#list)
               .on ("dblclick", () => this .importX3D (material .getNodeName (), material .toXMLString (), false)));
         }
      }

      // Create icons.

      canvas
         .css ({ "position": "absolute", "visibility": "hidden" })
         .prependTo ($("body"));

      await browser .resize (25, 25);
      await browser .replaceWorld (scene);

      for (const element of Array .from (this .output .find (".node"), e => $(e)))
      {
         const
            group   = element .attr ("group"),
            child   = element .attr ("child"),
            section = materials .children [group],
            node    = section .children [child];

         materials .whichChoice = group;
         section   .whichChoice = child;

         viewpoint .position .x = node .translation .x;
         viewpoint .position .y = node .translation .y;
         viewpoint .position .z = 2.65;

         await browser .nextFrame ();

         element .css ("background-image", `url(${canvas [0] .toDataURL ()})`);
      }

      browser .dispose ();
      canvas .remove ();
   }
};
