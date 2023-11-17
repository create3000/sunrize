"use strict"

const
   $                = require ("jquery"),
   X3D              = require ("../X3D"),
   Dialog           = require ("../Controls/Dialog"),
   Editor           = require ("../Undo/Editor"),
   UndoManager      = require ("../Undo/UndoManager"),
   Primitives       = require ("./Primitives"),
   StringSimilarity = require ("string-similarity"),
   _                = require ("../Application/GetText");

module .exports = new class Library extends Dialog
{
   constructor ()
   {
      super ("Sunrize.Library.")

      this .setup ()
   }

   configure ()
   {
      super .configure ({ size: [600, 400] })

      // Set default config values.

      this .fileConfig .setDefaultValues ({
         type: "NODES",
      })

      // Add class.

      this .element .addClass ("library")

      // Input

      this .input = $("<input></input>")
         .appendTo (this .element)
         .addClass ("library-input")
         .attr ("placeholder", _ ("Search a node"))
         .on ("keydown", event => this .enter (event))
         .on ("keyup", () => this .update ())

      // Buttons

      this .buttons = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-buttons")

      this .nodesButton = $("<span></span>")
         .appendTo (this .buttons)
         .addClass ("library-button")
         .data ("type", "NODES")
         .text (_ ("Nodes"))
         .on ("click", () => this .button (this .nodesButton))

      this .primitivesButton = $("<span></span>")
         .appendTo (this .buttons)
         .addClass ("library-button")
         .data ("type", "PRIMITIVES")
         .text (_ ("Primitives"))
         .on ("click", () => this .button (this .primitivesButton))

      // Output

      this .output = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-output")

      this .list = $("<ul></ul>")
         .appendTo (this .output)
         .addClass ("library-list")

      // Configure list type.

      switch (this .fileConfig .type)
      {
         case "NODES":
            this .button (this .nodesButton)
            break
         case "PRIMITIVES":
            this .button (this .primitivesButton)
            break
      }
   }

   async open (executionContext, node, field)
   {
      await this .browser .loadComponents (this .browser .getProfile ("Full"));

      this .executionContext = executionContext;
      this .node             = node;
      this .field            = field;

      super .open ();
      this .update ();
      this .input .trigger ("focus");
   }

   button (button)
   {
      this .fileConfig .type = button .data ("type")

      this .buttons .find (".library-button") .removeClass ("active")

      button .addClass ("active")

      this .update ()
   }

   enter (event)
   {
      if (event .key !== "Enter")
         return

      const
         first     = this .list .find (".node") .first (),
         component = this .list .find (".component") .first ()

      if (!first .length)
         return

      const input = this .input .val () .toUpperCase () .trim ();

      try
      {
         const ConcreteNode = this .browser .getConcreteNode (X3D .HTMLSupport .getNodeTypeName (input))

         this .createNode (ConcreteNode .typeName, ConcreteNode .componentInfo .name)
      }
      catch
      {
         this .createNode (first .text (), component .attr ("name"))
      }
   }

   update ()
   {
      switch (this .fileConfig .type)
      {
         case "NODES":
            this .updateNodes ();
            break;
         case "PRIMITIVES":
            this .updatePrimitives ();
            break;
      }
   }

   updateNodes ()
   {
      const cmp = (a, b) => (a > b) - (a < b)

      // Clear list.

      this .list .empty ()

      // Make filter.

      const input = this .input .val () .toLowerCase () .trim ()

      const filter = input
         ? ConcreteNode => StringSimilarity .compareTwoStrings (ConcreteNode .typeName .toLowerCase (), input) > 0.4
         : () => true

      // Get supported nodes.

      const nodes = [... this .browser .getConcreteNodes ()]
         .filter (filter)
         .sort ((a, b) => cmp (a .typeName, b .typeName))
         .sort ((a, b) => cmp (a .componentInfo .name, b .componentInfo .name))

      // Create list elements.

      let componentName = ""

      for (const node of nodes)
      {
         if (node .componentInfo .name !== componentName)
         {
            componentName = node .componentInfo .name

            $("<li></li>")
               .addClass ("component")
               .attr ("name", node .componentInfo .name)
               .text (this .browser .getSupportedComponents () .get (node .componentInfo .name) .title)
               .appendTo (this .list)
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .appendTo (this .list)
            .on ("dblclick", () => this .createNode (node .typeName, node .componentInfo .name))
      }
   }

   createNode (typeName, componentName)
   {
      UndoManager .shared .beginUndo (_ ("Create Node %s"), typeName)

      Editor .addComponent (this .executionContext, componentName)

      const
         node  = this .executionContext .createNode (typeName),
         field = this .field ?? $.try (() => this .node ?.getField (node .getValue () .getContainerField ()));

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
            Editor .insertValueIntoArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length, node)
            break;
         }
      }

      UndoManager .shared .endUndo ();

      require ("../Application/Window") .sidebar .outlineEditor .expandTo (node .getValue ());
   }

   updatePrimitives ()
   {
      const cmp = (a, b) => (a > b) - (a < b)

      // Clear list.

      this .list .empty ()

      // Make filter.

      const input = this .input .val () .toLowerCase () .trim ()

      if (input)
         var filter = (object) => StringSimilarity .compareTwoStrings (object .typeName .toLowerCase (), input) > 0.4
      else
         var filter = () => true

      // Get primitives.

      const nodes = Primitives
         .filter (filter)
         .sort ((a, b) => cmp (a .typeName,  b .typeName))
         .sort ((a, b) => cmp (a .componentInfo .name, b .componentInfo .name))

      // Create list elements.

      let componentName = ""

      for (const node of nodes)
      {
         if (node .componentInfo .name !== componentName)
         {
            componentName = node .componentInfo .name

            $("<li></li>")
               .addClass ("component")
               .text (node .componentInfo .name)
               .appendTo (this .list)
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .appendTo (this .list)
            .on ("dblclick", () => this .importX3D (node .typeName, node .x3dSyntax))
      }
   }

   async importX3D (typeName, x3dSyntax)
   {
      UndoManager .shared .beginUndo (_ ("Import %s"), typeName);

      const
         nodes = await Editor .importX3D (this .executionContext, x3dSyntax),
         field = this .field ?? $.try (() => this .node ?.getField (nodes [0] .getContainerField ()));

      switch (field ?.getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            Editor .setFieldValue (this .executionContext, this .node, field, nodes [0]);
            Editor .removeValueFromArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length - 1);
            break;
         }
         case X3D .X3DConstants .MFNode:
         {
            Editor .insertValueIntoArray (this .executionContext, this .node, field, field .length, nodes [0]);
            Editor .removeValueFromArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length - 1);
            break;
         }
      }

      for (const node of nodes)
      {
         if (!node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
            continue;

         Editor .setFieldValue (this .executionContext, node, node ._set_bind, true);
      }

      UndoManager .shared .endUndo ();

      require ("../Application/Window") .sidebar .outlineEditor .expandTo (nodes [0]);
   }
}
