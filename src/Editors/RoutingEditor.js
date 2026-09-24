
"use strict";

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class RoutingEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.RoutingEditor.${element .attr ("id")}.`);

      this .editor = element;
      this .top    = $("<div></div>") .addClass ("routing-editor-top") .appendTo (this .editor);
      this .left   = $("<div></div>") .addClass ("routing-editor-left") .appendTo (this .editor);

      this .top .on ("tabsactivate", () => this .activateSheet ());

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "routing-toolbar"])
         .appendTo (this .editor);

      this .addSheetButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Add new Logic Sheet."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .addSheet ());

      this .canvas = $("<canvas></canvas>")
         .addClass ("routes")
         .appendTo (this .left);

      this .resizer = new ResizeObserver (() => this .resizeCanvas ());
      this .resizer .observe (this .left [0]);

      this .nodes = $("<div></div>")
         .addClass ("nodes")
         .appendTo (this .left);

      this .title = $("<input>")
         .addClass ("title")
         .on ("input", () => this .updateTitle ())
         .appendTo (this .left);

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({
         sheets: [ ],
      });

      this .restoreSheets ();
   }

   colorScheme (/* shouldUseDarkColors */)
   {
      this .requestDrawRoutes ();
   }

   restoreSheets ()
   {
      // WIP
      // this .config .file .sheets = [ ];

      const sheets = this .config .file .sheets;

      if (!sheets .length)
      {
         sheets .push ({
            title: _("New Logic"),
            nodes: [ ],
         });

         this .config .file .sheets = sheets;
      }

      this .top .empty ();

      this .tabs = $("<ul></ul>") .appendTo (this .top);

      for (const [id, { title, nodes }] of sheets .entries ())
      {
         // Add tab.
         $("<li></li>")
            .append ($("<a></a>")
               .addClass ("text")
               .attr ("href", `#routing-sheet-${id}-tab`)
               .attr ("title", title)
               .text (title))
            .appendTo (this .tabs);

         // Add hidden empty panel.
         $("<div></div>")
            .attr ("id", `routing-sheet-${id}-tab`)
            .appendTo (this .top);
      }

      this .top .tabs ();
      this .top .tabs ("option", "classes.ui-tabs", "top");

      if (this .top .tabs ("option", "active") === this .config .file .activeSheet)
         this .activateSheet ();
      else
         this .top .tabs ("option", "active", this .config .file .active);
   }

   addSheet ()
   {

   }

   activateSheet ()
   {
      const active = this .top .tabs ("option", "active");

      this .config .file .activeSheet = active;

      this .title .val (this .config .file .sheets [active] .title);

      console .log (active);
   }

   updateTitle ()
   {
      const
         active = this .config .file .activeSheet,
         sheets = this .config .file .sheets;

      sheets [active] .title = this .title .val ();

      this .config .file .sheets = sheets;
   }

   resizeCanvas ()
   {
      const
         canvasWidth  = this .canvas .width (),
         canvasHeight = this .canvas .height ();

      this .canvas
         .prop ("width",  canvasWidth)
         .prop ("height", canvasHeight);

      this .drawRoutes ();
   }

   #updateCanvasId = undefined;

   requestDrawRoutes ()
   {
      clearTimeout (this .#updateCanvasId);

      this .#updateCanvasId = setTimeout (() => this .drawRoutes ());
   }

   #style = window .getComputedStyle ($("body") [0]);

   drawRoutes ()
   {
      const
         context      = this .canvas [0] .getContext ("2d"),
         canvasWidth  = this .canvas .width (),
         canvasHeight = this .canvas .height ();

      context .clearRect (0, 0, canvasWidth, canvasHeight);
   }
};
