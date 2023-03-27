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

   open (executionContext)
   {
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

      const first = this .list .find (".node") .first ()

      if (!first .length)
         return

      const
         SupportedNodes = X3D .require ("x_ite/Configuration/SupportedNodes"),
         HTMLSupport    = X3D .require ("x_ite/Parser/HTMLSupport"),
         input          = this .input .val () .toUpperCase () .trim (),
         Type           = SupportedNodes .getType (HTMLSupport .getNodeTypeName (input))

      if (Type)
         this .createNode (Type .prototype .getTypeName ())
      else
         this .createNode (first .text ())
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

      if (input)
         var filter = (Type) => StringSimilarity .compareTwoStrings (Type .prototype .getTypeName () .toLowerCase (), input) > 0.4
      else
         var filter = () => true

      // Get supported nodes.

      const nodes = this .browser .getSupportedNodes ()
         .filter (filter)
         .map ((Type) => ({ component: Type .prototype .getComponentName (), typeName: Type .prototype .getTypeName () }))
         .sort ((a, b) => cmp (a .typeName,  b .typeName))
         .sort ((a, b) => cmp (a .component, b .component))

      // Create list elements.

      let component = ""

      for (const node of nodes)
      {
         if (node .component !== component)
         {
            component = node .component

            $("<li></li>")
               .addClass ("component")
               .text (this .browser .getSupportedComponents () .get (node .component) .title)
               .appendTo (this .list)
         }

         $("<li></li>")
            .addClass ("node")
            .text (node .typeName)
            .appendTo (this .list)
            .on ("dblclick", () => this .createNode (node .typeName))
      }
   }

   createNode (typeName)
   {
      const node = this .executionContext .createNode (typeName)

      UndoManager .shared .beginUndo (_ ("Create Node %s"), typeName)

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
         .sort ((a, b) => cmp (a .component, b .component))

      // Create list elements.

      let component = ""

      for (const node of nodes)
      {
         if (node .component !== component)
         {
            component = node .component

            $("<li></li>")
               .addClass ("component")
               .text (node .component)
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
         if (node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
         {
            Editor .setFieldValue (this .executionContext, node, node ._set_bind, true)
         }
      }

      UndoManager .shared .endUndo ()
   }
}
