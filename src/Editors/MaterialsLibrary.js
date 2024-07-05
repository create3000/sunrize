"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane");

module .exports = class Materials extends LibraryPane
{
   id          = "MATERIALS";
   description = "Materials";

   #canvas;
   #browser;
   #scene;
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

      this .#canvas  ??= $("<x3d-canvas preserveDrawingBuffer='true''></x3d-canvas>");
      this .#browser ??= this .#canvas .prop ("browser");
      this .#scene   ??= await this .#browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

      const
         materials = this .#scene .getExportedNode ("Materials"),
         viewpoint = this .#scene .getExportedNode ("Viewpoint"),
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
               .on ("dblclick", () => this .importX3D (material .getNodeName (), material .toXMLString ())));
         }
      }

      // Create icons.

      this .#canvas
         .css ({ "position": "absolute", "visibility": "hidden" })
         .prependTo (this .element);

      await this .#browser .resize (25, 25);
      await this .#browser .replaceWorld (this .#scene);

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

         await this .#browser .nextFrame ();

         element .css ("background-image", `url(${this .#canvas [0] .toDataURL ()})`);
      }

      this .#browser .dispose ();
      this .#canvas .remove ();
   }
};
