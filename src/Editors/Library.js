"use strict";

const
   $                = require ("jquery"),
   StringSimilarity = require ("string-similarity"),
   X3D              = require ("../X3D"),
   Dialog           = require ("../Controls/Dialog"),
   Editor           = require ("../Undo/Editor"),
   UndoManager      = require ("../Undo/UndoManager"),
   Traverse         = require ("../Application/Traverse"),
   _                = require ("../Application/GetText");

module .exports = new class Library extends Dialog
{
   constructor ()
   {
      super ("Sunrize.Library.");

      this .panes = [
         new (require ("./NodesLibrary")) (this),
         new (require ("./PrimitivesLibrary")) (this),
         new (require ("./MaterialsLibrary")) (this),
      ];

      this .setup ();
   }

   configure ()
   {
      super .configure ({ size: [600, 400] });

      // Set default config values.

      this .config .file .setDefaultValues ({
         type: this .panes [0] .id,
      });

      // Add class.

      this .element .addClass ("library");

      // Input

      this .input = $("<input></input>")
         .appendTo (this .element)
         .addClass ("library-input")
         .attr ("placeholder", _("Search a node"))
         .on ("keydown", event => this .enter (event))
         .on ("keyup", () => this .filter ());

      // Buttons

      this .buttons = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-buttons");

      for (const pane of this .panes)
      {
         const button = $("<span></span>")
            .appendTo (this .buttons)
            .addClass ("library-button")
            .data ("type", pane .id)
            .text (_(pane .description))
            .on ("click", () => this .button (button));
      }

      // Output

      this .output = $("<div></div>")
         .appendTo (this .element)
         .addClass ("library-output");

      // Configure list type.

      const button = [... this .buttons .children ()]
         .find (button => $(button) .data ("type") === this .config .file .type);

      if (button)
         this .button ($(button));
   }

   async open (executionContext, node, field)
   {
      await this .browser .loadComponents (this .browser .getProfile ("Full"),
                                           this .browser .getComponent ("X_ITE"));

      this .executionContext = executionContext;
      this .node             = node;
      this .field            = field;

      super .open ();
      this .panes .forEach (pane => pane .open ());
      this .update ();
      this .input .trigger ("focus");
   }

   button (button)
   {
      this .config .file .type = button .data ("type");

      this .buttons .find (".library-button") .removeClass ("active");

      button .addClass ("active");

      this .update ();
      this .filter ();
   }

   filter ()
   {
      const input = this .input .val () .toLowerCase () .trim ();

      if (input)
      {
         const elements = Array .from (this .output .find (".node, .component"), e => $(e));

         // Hide nodes.

         for (const node of elements)
         {
            if (!node .hasClass ("node"))
               continue;

            const similarity = StringSimilarity .compareTwoStrings (node .text () .toLowerCase (), input);

            node .data ("similarity", similarity);

            if (similarity > 0.4)
               node .removeClass ("hidden");
            else
               node .addClass ("hidden");
         }

         // Hide components with only hidden nodes.

         let
            nodes  = 0,
            hidden = 0;

         for (const element of elements .reverse ())
         {
            if (element .hasClass ("component"))
            {
               if (hidden === nodes)
                  element .addClass ("hidden")
               else
                  element .removeClass ("hidden");

               nodes  = 0,
               hidden = 0;
            }
            else if (element .hasClass ("node"))
            {
               nodes  += 1;
               hidden += element .hasClass ("hidden");
            }
         }
      }
      else
      {
         this .output .find (".node, .component") .removeClass ("hidden");
      }
   }

   enter (event)
   {
      if (event .key !== "Enter")
         return;

      const input = this .input .val () .trim () .toLowerCase ();

      if (!input)
         return;

      const nodes = Array .from (this .output .find (".node:not(.hidden)"), element => $(element));

      if (!nodes .length)
         return;

      const node = nodes .find (node => node .text () .toLowerCase () === input)
         ?? nodes .sort ((a, b) => a .data ("similarity") - b .data ("similarity")) .at (-1);

      node .trigger ("dblclick");
   }

   update ()
   {
      const pane = this .panes
         .find (pane => pane .id === this .config .file .type);

      pane .update ();
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
}
