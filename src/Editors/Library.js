"use strict";

const
   $                = require ("jquery"),
   X3D              = require ("../X3D"),
   Dialog           = require ("../Controls/Dialog"),
   Editor           = require ("../Undo/Editor"),
   UndoManager      = require ("../Undo/UndoManager"),
   Primitives       = require ("./Primitives"),
   StringSimilarity = require ("string-similarity"),
   Traverse         = require("../Application/Traverse"),
   _                = require ("../Application/GetText");

module .exports = new class Library extends Dialog
{
   constructor ()
   {
      super ("Sunrize.Library.");

      this .setup ();
   }

   configure ()
   {
      super .configure ({ size: [600, 400] });

      // Set default config values.

      this .config .file .setDefaultValues ({
         type: "NODES",
      });

      // Add class.

      this .element .addClass ("library");

      // Input

      this .input = $("<input></input>")
         .appendTo (this .element)
         .addClass ("library-input")
         .attr ("placeholder", _("Search a node"))
         .on ("keydown", event => this .enter (event))
         .on ("keyup", () => this .update ());

      // Buttons

      this .buttons = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-buttons");

      this .nodesButton = $("<span></span>")
         .appendTo (this .buttons)
         .addClass ("library-button")
         .data ("type", "NODES")
         .text (_("Nodes"))
         .on ("click", () => this .button (this .nodesButton));

      this .primitivesButton = $("<span></span>")
         .appendTo (this .buttons)
         .addClass ("library-button")
         .data ("type", "PRIMITIVES")
         .text (_("Primitives"))
         .on ("click", () => this .button (this .primitivesButton));

      this .materialsButton = $("<span></span>")
         .appendTo (this .buttons)
         .addClass ("library-button")
         .data ("type", "MATERIALS")
         .text (_("Materials"))
         .on ("click", () => this .button (this .materialsButton));

      // Output

      this .output = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-output");

      this .list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list");

      // Configure list type.

      switch (this .config .file .type)
      {
         case "NODES":
            this .button (this .nodesButton);
            break;
         case "PRIMITIVES":
            this .button (this .primitivesButton);
            break;
         case "MATERIALS":
            this .button (this .materialsButton);
            break;
      }
   }

   async open (executionContext, node, field)
   {
      await this .browser .loadComponents (this .browser .getProfile ("Full"),
                                           this .browser .getComponent ("X_ITE"));

      this .executionContext = executionContext;
      this .node             = node;
      this .field            = field;

      super .open ();
      this .update ();
      this .input .trigger ("focus");
   }

   button (button)
   {
      this .config .file .type = button .data ("type");

      this .buttons .find (".library-button") .removeClass ("active");

      button .addClass ("active");

      this .update ();
   }

   enter (event)
   {
      if (event .key !== "Enter")
         return;

      const nodes = Array .from (this .list .find (".node"), element => $(element));

      if (!nodes .length)
         return;

      try
      {
         const
            input        = this .config .file .type === "NODES" ? this .input .val () .toUpperCase () .trim () : "",
            ConcreteNode = this .browser .getConcreteNode (X3D .HTMLSupport .getNodeTypeName (input));

         this .createNode (ConcreteNode .typeName, ConcreteNode .componentInfo .name);
      }
      catch
      {
         nodes .sort ((a, b) => a .attr ("similarity") - b .attr ("similarity"))
            .pop ()
            .trigger ("dblclick");
      }
   }

   update ()
   {
      switch (this .config .file .type)
      {
         case "NODES":
            this .updateNodes ();
            break;
         case "PRIMITIVES":
            this .updatePrimitives ();
            break;
         case "MATERIALS":
            this .updateMaterials ();
            break;
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

   updateNodes ()
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
         const outlineEditor = require ("../Application/Window") .sidebar .outlineEditor;

         outlineEditor .expandTo (node);
         outlineEditor .selectNodeElement ($(`.node[node-id=${node .getId ()}]`));
      });
   }

   updatePrimitives ()
   {
      const cmp = (a, b) => (a > b) - (a < b);

      // Clear list.

      this .list .empty ();

      // Make filter.

      const input = this .input .val () .toLowerCase () .trim ();

      if (input)
         var filter = (object) => StringSimilarity .compareTwoStrings (object .typeName .toLowerCase (), input) > 0.4;
      else
         var filter = () => true;

      // Get primitives.

      const nodes = Primitives
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
         const outlineEditor = require ("../Application/Window") .sidebar .outlineEditor;

         outlineEditor .expandTo (node);
         outlineEditor .selectNodeElement ($(`.node[node-id=${node .getId ()}]`));
      });
   }

   updateMaterials ()
   {
      this .list .empty ();
   }
}
