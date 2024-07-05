"use strict";

const
   $           = require ("jquery"),
   LibraryPane = require ("./LibraryPane");

module .exports = class PrimitivesLibrary extends LibraryPane
{
   id          = "PRIMITIVES";
   description = "Primitives";

   #list;

   update ()
   {
      // Clear output.

      if (this .#list)
      {
         this .output .append (this .#list);
         return;
      }

      // Create list.

      this .#list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list");

      // Get primitives.

      const nodes = require ("./Primitives")
         .sort ((a, b) => a .typeName .localeCompare (b .typeName))
         .sort ((a, b) => a .componentInfo .name .localeCompare (b .componentInfo .name));

      // Create list elements.

      let componentName = "";

      for (const node of nodes)
      {
         if (node .componentInfo .name !== componentName)
         {
            componentName = node .componentInfo .name;

            $("<li></li>")
               .addClass ("component")
               .text (node .componentInfo .name)
               .appendTo (this .#list);
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .attr ("x3dSyntax", node .x3dSyntax)
            .appendTo (this .#list)
            .on ("dblclick", () => this .importX3D (node .typeName, node .x3dSyntax));
      }
   }
};
