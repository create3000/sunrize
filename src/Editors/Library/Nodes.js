"use strict";

const
   $                = require ("jquery"),
   X3D              = require ("../../X3D"),
   LibraryPanel     = require ("./LibraryPanel"),
   Editor           = require ("../../Undo/Editor"),
   UndoManager      = require ("../../Undo/UndoManager"),
   StringSimilarity = require ("string-similarity"),
   _                = require ("../../Application/GetText");

module .exports = class Nodes extends LibraryPanel
{
   id          = "NODES";
   description = "Nodes";

   update ()
   {
      const cmp = (a, b) => (a > b) - (a < b);

      // Clear list.

      this .list .empty ();

      const input = this .input .val () .toLowerCase () .trim ();

      // Get protos.

      const protoFilter = input
         ? proto => StringSimilarity .compareTwoStrings (proto .name .toLowerCase (), input) > 0.4
         : () => true;

      const protos = Array .from (this .getProtos () .values ())
         .filter (protoFilter)
         .sort ((a, b) => cmp (a .name, b .name));

      // Get supported nodes.

      const nodeFilter = input
         ? ConcreteNode => StringSimilarity .compareTwoStrings (ConcreteNode .typeName .toLowerCase (), input) > 0.4
         : () => true;

      const nodes = [... this .browser .getConcreteNodes ()]
         .filter (nodeFilter)
         .sort ((a, b) => cmp (a .typeName, b .typeName))
         .sort ((a, b) => cmp (a .componentInfo .name, b .componentInfo .name));

      // Create list for proto elements

      if (protos .length)
      {
         $("<li></li>")
            .addClass ("component")
            .attr ("name", "prototypes")
            .text ("Prototypes")
            .appendTo (this .list);

         for (const proto of protos)
         {
            $("<li></li>")
               .addClass ("node")
               .text (proto .name)
               .attr ("similarity", StringSimilarity .compareTwoStrings (proto .name .toLowerCase (), input))
               .appendTo (this .list)
               .on ("dblclick", () => this .createProto (proto));
         }
      }

      // Create list for nodes elements.

      let componentName = "";

      for (const node of nodes)
      {
         if (node .componentInfo .name !== componentName)
         {
            componentName = node .componentInfo .name;

            $("<li></li>")
               .addClass ("component")
               .attr ("name", node .componentInfo .name)
               .text (this .browser .getSupportedComponents () .get (node .componentInfo .name) .title)
               .appendTo (this .list);
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .attr ("componentName", node .componentInfo .name)
            .attr ("similarity", StringSimilarity .compareTwoStrings (node .typeName .toLowerCase (), input))
            .appendTo (this .list)
            .on ("dblclick", () => this .createNode (node .typeName, node .componentInfo .name));
      }
   }
   getProtos (executionContext = this .executionContext, protos = new Map (), outerNode)
   {
      if (!executionContext)
         return protos;

      for (const proto of executionContext .protos)
      {
         if (proto === outerNode)
            break;

         if (protos .has (proto .name))
            continue;

         protos .set (proto .name, proto);
      }

      for (const proto of executionContext .externprotos)
      {
         if (proto === outerNode)
            break;

         if (protos .has (proto .name))
            continue;

         protos .set (proto .name, proto);
      }

      if (!(executionContext instanceof X3D .X3DScene))
         this .getProtos (executionContext .getExecutionContext (), protos, executionContext .getOuterNode ());

      return protos;
   }

   async createNode (typeName, componentName)
   {
      UndoManager .shared .beginUndo (_("Create Node %s"), typeName);

      await Editor .addComponent (this .executionContext, componentName);

      const node = this .executionContext .createNode (typeName);

      this .addNode (node);

      UndoManager .shared .endUndo ();
   }

   async createProto (proto)
   {
      UndoManager .shared .beginUndo (_("Create Proto Instance %s"), proto .name);

      const node  = proto .createInstance (this .executionContext);

      this .addNode (node);

      UndoManager .shared .endUndo ();
   }

   addNode (node)
   {
      const field = this .field ?? $.try (() => this .node ?.getField (node .getValue () .getContainerField ()));

      switch (field ?.getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            Editor .setFieldValue (this .executionContext, this .node, field, node);
            break;
         }
         case X3D .X3DConstants .MFNode:
         {
            Editor .insertValueIntoArray (this .executionContext, this .node, field, field .length, node);
            break;
         }
         default:
         {
            Editor .insertValueIntoArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length, node);
            break;
         }
      }

      node = node .getValue ();

      requestAnimationFrame (() =>
      {
         const outlineEditor = require ("../../Application/Window") .sidebar .outlineEditor;

         outlineEditor .expandTo (node);
         outlineEditor .selectNodeElement ($(`.node[node-id=${node .getId ()}]`));
      });
   }
};
