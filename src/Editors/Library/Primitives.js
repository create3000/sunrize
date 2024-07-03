"use strict";

const
   $                = require ("jquery"),
   X3D              = require ("../../X3D"),
   LibraryPanel     = require ("./LibraryPanel"),
   Editor           = require ("../../Undo/Editor"),
   UndoManager      = require ("../../Undo/UndoManager"),
   PrimitiveNodes   = require ("./PrimitiveNodes"),
   StringSimilarity = require ("string-similarity"),
   Traverse         = require ("../../Application/Traverse"),
   _                = require ("../../Application/GetText");

module .exports = class Primitives extends LibraryPanel
{
   id          = "PRIMITIVES";
   description = "Primitives";

   update ()
   {
      const cmp = (a, b) => (a > b) - (a < b);

      // Clear output.

      this .output .empty ();

      this .list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list");

      // Make filter.

      const input = this .input .val () .toLowerCase () .trim ();

      if (input)
         var filter = (object) => StringSimilarity .compareTwoStrings (object .typeName .toLowerCase (), input) > 0.4;
      else
         var filter = () => true;

      // Get primitives.

      const nodes = PrimitiveNodes
         .filter (filter)
         .sort ((a, b) => cmp (a .typeName,  b .typeName))
         .sort ((a, b) => cmp (a .componentInfo .name, b .componentInfo .name));

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
               .appendTo (this .list);
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .attr ("x3dSyntax", node .x3dSyntax)
            .attr ("similarity", StringSimilarity .compareTwoStrings (node .typeName .toLowerCase (), input))
            .appendTo (this .list)
            .on ("dblclick", () => this .importX3D (node .typeName, node .x3dSyntax));
      }
   }

   async importX3D (typeName, x3dSyntax)
   {
      UndoManager .shared .beginUndo (_("Import %s"), typeName);

      const
         node  = (await Editor .importX3D (this .executionContext, x3dSyntax)) .pop (),
         field = this .field ?? $.try (() => this .node ?.getField (node .getContainerField ()));

      if (this .browser .getBrowserOption ("ColorSpace") === "LINEAR")
      {
         Traverse .traverse (node, Traverse .ROOT_NODES, node =>
         {
            for (const field of node .getFields ())
            {
               switch (field .getType ())
               {
                  case X3D .X3DConstants .SFColor:
                  case X3D .X3DConstants .SFColorRGBA:
                     field .assign (field .sRGBToLinear ());
                     break;
                  case X3D .X3DConstants .MFColor:
                  case X3D .X3DConstants .MFColorRGBA:
                     field .assign (field .map (value => value .sRGBToLinear ()));
                     break;
               }
            }
         });
      }

      switch (field ?.getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            Editor .setFieldValue (this .executionContext, this .node, field, node);
            Editor .removeValueFromArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length - 1);
            break;
         }
         case X3D .X3DConstants .MFNode:
         {
            Editor .insertValueIntoArray (this .executionContext, this .node, field, field .length, node);
            Editor .removeValueFromArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length - 1);
            break;
         }
      }

      if (node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
         Editor .setFieldValue (this .executionContext, node, node ._set_bind, true);

      UndoManager .shared .endUndo ();

      requestAnimationFrame (() =>
      {
         const outlineEditor = require ("../../Application/Window") .sidebar .outlineEditor;

         outlineEditor .expandTo (node);
         outlineEditor .selectNodeElement ($(`.node[node-id=${node .getId ()}]`));
      });
   }
};
