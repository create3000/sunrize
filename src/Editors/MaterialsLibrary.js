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
   #scene;

   async update ()
   {
      this .#scene ??= await this .browser .createX3DFromURL (new X3D .MFString (`file://${__dirname}/Materials.x3d`));

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

      const materials = this .#scene .getExportedNode ("Materials");

      for (const group of materials .children)
      {
         $("<li></li>")
            .addClass ("component")
            .text (group .getNodeName ())
            .appendTo (this .#list);

         for (const [i, node] of group .children .entries ())
         {
            const material = node .children [0] .appearance .material;

            $("<li></li>")
               .addClass ("node")
               .text (`${group .getNodeName ()} ${i + 1}`)
               .appendTo (this .#list)
               .on ("dblclick", () => this .importX3D (material .getNodeName (), material .toXMLString ()));
         }
      }
   }
};
