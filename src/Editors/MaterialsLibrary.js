"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane"),
   Editor      = require("../Undo/Editor");

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
      // Clear output.

      this .output .empty ();

      if (this .#list)
      {
         this .output .append (this .#list);
         return;
      }

      // Create list.

      this .#list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list");

      this .#canvas  ??= $("<x3d-canvas preserveDrawingBuffer='true''></x3d-canvas>") .css ({ "width": "25px", "height": "25px" });
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

      this .#canvas .appendTo (this .output);

      await this .#browser .replaceWorld (this .#scene);

      for (const element of Array .from (this .output .find (".node"), e => $(e)))
      {
         const
            group = element .attr ("group"),
            child = element .attr ("child"),
            node  = materials .children [group] .children [child];

         materials .whichChoice = group;

         viewpoint .position .x = node .translation .x;
         viewpoint .position .y = node .translation .y;
         viewpoint .position .z = 2.6;

         await Editor .nextFrame (this .#browser);

         element .css ("background-image", `url(${this .#canvas [0] .toDataURL ()})`);
      }

      this .#browser .dispose ();
      this .#canvas .css ("display", "none");
   }
};
