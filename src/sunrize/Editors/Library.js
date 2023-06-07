"use strict"

const
   $                = require ("jquery"),
   X3D              = require ("../X3D"),
   Dialog           = require ("../Controls/Dialog"),
   Editor           = require ("../Undo/Editor"),
   UndoManager      = require ("../Undo/UndoManager"),
   Primitives       = require ("./Primitives"),
   StringSimilarity = require ("string-similarity"),
   _                = require ("../Application/GetText")

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

      this .config .file .addDefaultValues ({
         type: "NODES",
      })

      // Add class.

      this .element .addClass ("library")

      // Input

      this .input = $("<input></input>")
         .appendTo (this .element)
         .addClass ("library-input")
         .attr ("placeholder", _ ("Node type name"))
         .on ("keydown", (event) => this .enter (event))
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

      switch (this .config .file .type)
      {
         case "NODES":
            this .button (this .nodesButton)
            break
         case "PRIMITIVES":
            this .button (this .primitivesButton)
            break
      }
   }

   async open (executionContext)
   {
      await this .browser .loadComponents (this .browser .getProfile ("Full"))

      this .executionContext = executionContext

      super .open ()
      this .update ()
      this .input .trigger ("focus")
   }

   button (button)
   {
      this .config .file .type = button .data ("type")

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

      const
         HTMLSupport  = X3D .require ("x_ite/Parser/HTMLSupport"),
         input        = this .input .val () .toUpperCase () .trim (),
         ConcreteNode = this .browser .getConcreteNode (HTMLSupport .getNodeTypeName (input))

      if (ConcreteNode)
         this .createNode (ConcreteNode .typeName, ConcreteNode .componentName)
      else
         this .createNode (first .text (), component .attr ("name"))
   }

   update ()
   {
      switch (this .config .file .type)
      {
         case "NODES":
            this .updateNodes ()
            break
         case "PRIMITIVES":
            this .updatePrimitives ()
            break
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
         .sort ((a, b) => cmp (a .componentName, b .componentName))

      // Create list elements.

      let componentName = ""

      for (const node of nodes)
      {
         if (node .componentName !== componentName)
         {
            componentName = node .componentName

            $("<li></li>")
               .addClass ("component")
               .attr ("name", node .componentName)
               .text (this .browser .getSupportedComponents () .get (node .componentName) .title)
               .appendTo (this .list)
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .appendTo (this .list)
            .on ("dblclick", () => this .createNode (node .typeName, node .componentName))
      }
   }

   createNode (typeName, componentName)
   {
      UndoManager .shared .beginUndo (_ ("Create Node %s"), typeName)

      Editor .addComponent (this .executionContext, componentName)

      const node = this .executionContext .createNode (typeName)

      Editor .insertValueIntoArray (this .executionContext, this .executionContext, this .executionContext .rootNodes, this .executionContext .rootNodes .length, node)

      UndoManager .shared .endUndo ()
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
         .sort ((a, b) => cmp (a .componentName, b .componentName))

      // Create list elements.

      let componentName = ""

      for (const node of nodes)
      {
         if (node .componentName !== componentName)
         {
            componentName = node .componentName

            $("<li></li>")
               .addClass ("component")
               .text (node .componentName)
               .appendTo (this .list)
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .appendTo (this .list)
            .on ("dblclick", () => this .importX3D (node .typeName, node .x3dSyntax))
      }
   }

   importX3D (typeName, x3dSyntax)
   {
      UndoManager .shared .beginUndo (_ ("Import %s"), typeName)

      const nodes = Editor .importX3D (this .executionContext, x3dSyntax)

      for (const node of nodes)
      {
         if (!node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
            continue

         Editor .setFieldValue (this .executionContext, node, node ._set_bind, true)
      }

      UndoManager .shared .endUndo ()
   }
}
