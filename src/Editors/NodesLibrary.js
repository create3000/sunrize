"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   LibraryPane = require ("./LibraryPane"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

module .exports = class NodesLibrary extends LibraryPane
{
   id          = "NODES";
   description = "Nodes";

   #list;

   open ()
   {
      // Set default config values.

      this .config .global .setDefaultValues ({
         recentNodes: [ ],
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

      // Get protos.

      const protos = Array .from (this .getProtos () .values ())
         .sort ((a, b) => a .name .localeCompare (b .name));

      // Get supported nodes.

      const nodes = [... this .browser .getConcreteNodes ()]
         .sort ((a, b) => a .typeName .localeCompare (b .typeName))
         .sort ((a, b) => a .componentInfo .name .localeCompare (b .componentInfo .name));

      // Get recently used elements.

      const recentNodes = this .config .global .recentNodes .map (typeName => $.try (() => this .browser .getConcreteNode (typeName))) .filter (node => node);

      // Create list for recently used elements.

      if (recentNodes .length)
      {
         $("<li></li>")
            .addClass ("component")
            .attr ("name", "recent")
            .text ("Recently Used Nodes")
            .appendTo (this .#list);

         for (const node of recentNodes)
         {
            $("<li></li>")
               .addClass ("node")
               .text (node .typeName)
               .attr ("componentName", node .componentInfo .name)
               .appendTo (this .#list)
               .on ("dblclick", () => this .createNode (node .typeName, node .componentInfo .name));
         }
      }

      // Create list for proto elements.

      if (protos .length)
      {
         $("<li></li>")
            .addClass ("component")
            .attr ("name", "prototypes")
            .text ("Prototypes")
            .appendTo (this .#list);

         for (const proto of protos)
         {
            $("<li></li>")
               .addClass ("node")
               .text (proto .name)
               .appendTo (this .#list)
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
               .appendTo (this .#list);
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .attr ("componentName", node .componentInfo .name)
            .appendTo (this .#list)
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
      const recentNodes = this .config .global .recentNodes .filter (name => name !== typeName);

      recentNodes .unshift (typeName);
      recentNodes .splice (10);

      this .config .global .recentNodes = recentNodes;

      UndoManager .shared .beginUndo (_("Create Node %s"), typeName);

      await Editor .addComponent (this .executionContext, componentName);

      const node = this .executionContext .createNode (typeName);

      this .addNode (node);

      UndoManager .shared .endUndo ();

      await this .expandToAndSelectNode (node .getValue ());
   }

   async createProto (proto)
   {
      UndoManager .shared .beginUndo (_("Create Proto Instance %s"), proto .name);

      const node = proto .createInstance (this .executionContext);

      this .addNode (node);

      UndoManager .shared .endUndo ();

      await this .expandToAndSelectNode (node .getValue ());
   }

   addNode (node)
   {
      const field = this .field
         ?? $.try (() => this .node ?.getField (node .getValue () .getContainerField ()));

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
   }
};
