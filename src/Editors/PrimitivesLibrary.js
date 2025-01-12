"use strict";

const
   $           = require ("jquery"),
   LibraryPane = require ("./LibraryPane");

module .exports = class PrimitivesLibrary extends LibraryPane
{
   id          = "PRIMITIVES";
   description = "Primitives";

   #list;

   open ()
   {
      // Set default config values.

      this .config .global .setDefaultValues ({
         recentPrimitives: [ ],
      });

      // Clear output.

      this .#list ?.remove ();
      this .#list = undefined;
   }

   update ()
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

      // Get primitives.

      const nodes = require ("./Primitives")
         .sort ((a, b) => a .typeName .localeCompare (b .typeName))
         .sort ((a, b) => a .componentInfo .name .localeCompare (b .componentInfo .name));

      // Get recently used primitives.

      const recentPrimitives = this .config .global .recentPrimitives;

      // Create list for recently used elements.

      if (recentPrimitives .length)
      {
         $("<li></li>")
            .addClass ("component")
            .attr ("name", "recent")
            .text ("Recently Used Primitives")
            .appendTo (this .#list);

         for (const typeName of recentPrimitives)
         {
            $("<li></li>")
               .addClass ("node")
               .text (typeName)
               .appendTo (this .#list)
               .on ("dblclick", () => this .createRecentNode (nodes, typeName));
         }
      }

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
            .appendTo (this .#list)
            .on ("dblclick", () => this .createNode (node));
      }
   }

   createRecentNode (nodes, typeName)
   {
      const node = nodes .find (node => node .typeName === typeName);

      this .createNode (node);
   }

   createNode ({ typeName, x3dSyntax})
   {
      const recentPrimitives = this .config .global .recentPrimitives .filter (name => name !== typeName);

      recentPrimitives .unshift (typeName);
      recentPrimitives .splice (10);

      this .config .global .recentPrimitives = recentPrimitives;

      this .importX3D (typeName, x3dSyntax);
   }
};
