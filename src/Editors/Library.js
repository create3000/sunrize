"use strict";

const
   $      = require ("jquery"),
   X3D    = require ("../X3D"),
   Dialog = require ("../Controls/Dialog"),
   _      = require ("../Application/GetText");

module .exports = new class Library extends Dialog
{
   constructor ()
   {
      super ("Sunrize.Library.");

      this .panes = [
         new (require ("./Library/Nodes")) (this),
         new (require ("./Library/Primitives")) (this),
         new (require ("./Library/Materials")) (this),
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
         .on ("keyup", () => this .update ());

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

      const nodes = Array .from (this .output .find (".node"), element => $(element));

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
      const pane = this .panes
         .find (pane => pane .id === this .config .file .type);

      pane .update ();
   }
}
