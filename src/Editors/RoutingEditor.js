
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

      this .editor = element
         .on ("dragenter dragover", event => this .dragEnter (event))
         .on ("drop", event => this .drop (event));

      this .left   = $("<div></div>") .addClass ("routing-editor-left") .appendTo (this .editor);
      this .top    = $("<div></div>") .appendTo (this .editor);

      this .top
         .addClass ("routing-editor-top")
         .on ("scroll", () => this .top .scrollTop (0))
         .on ("tabsactivate", () => this .activateSheet ());

      this .topCanvas = $("<canvas></canvas>")
         .appendTo (this .top);

      this .tabs = $("<ul></ul>")
         .sortable ()
         .on ("sortupdate", (event, ui) => this .reorderSheets (ui .item))
         .appendTo (this .top);

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

      this .elements = $("<div></div>")
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
         activateSheet: 0,
      });

      // WIP
      // this .config .file .sheets = [ ];

      this .updateSheets ();
   }

   colorScheme (/* shouldUseDarkColors */)
   {
      this .requestDrawRoutes ();
   }

   get outlineEditor ()
   {
      const document = require ("../Application/Window");

      return document .sidebar .outlineEditor;
   }

   updateSheets ()
   {
      const
         sheets = this .config .file .sheets,
         active = this .config .file .activeSheet;

      if (!sheets .length)
         return this .addSheet ();

      this .top .find ("> div") .remove ();
      this .tabs .empty ();

      for (const [id, { title }] of sheets .entries ())
      {
         // Add tab.
         $("<li></li>")
            .data ("id", id)
            .on ("click", () => this .top .tabs ("option", "active", id))
            .append ($("<a></a>")
               .addClass ("text")
               .attr ("href", `#routing-sheet-${id}-tab`)
               .attr ("title", title)
               .text (title))
            .append ($("<span></span>")
               .addClass (["material-icons", "button"])
               .text ("close")
               .on ("click", () => this .closeSheet (id)))
            .appendTo (this .tabs);

         // Add hidden empty panel.
         $("<div></div>")
            .attr ("id", `routing-sheet-${id}-tab`)
            .appendTo (this .top);
      }

      this .top .tabs ();
      this .top .tabs ("option", "classes.ui-tabs", "top");
      this .top .tabs ("refresh");

      if (this .top .tabs ("option", "active") === active)
         this .activateSheet ();
      else
         this .top .tabs ("option", "active", active);
   }

   reorderSheets (item)
   {
      const
         current = item .data ("id"),
         indices = Array .from (this .tabs .find ("> li"), li => $(li) .data ("id"));

      const
         sheets          = this .config .file .sheets,
         reorderedSheets = indices .map (i => sheets [i]);

      this .config .file .sheets = reorderedSheets;

      if (current < this .config .file .activeSheet)
      {
         if (indices .indexOf (current) >= this .config .file .activeSheet)
            -- this .config .file .activeSheet;

      }
      else if (current > this .config .file .activeSheet)
      {
         if (indices .indexOf (current) <= this .config .file .activeSheet)
            ++ this .config .file .activeSheet;
      }
      else
      {
         this .config .file .activeSheet = indices .indexOf (current);
      }

      this .updateSheets ();
   }

   addSheet ()
   {
      const
         sheets = this .config .file .sheets,
         next   = sheets .reduce ((i, sheet) => Math .max (i, (sheet .title .match (/(\d+)\s*$/) ?.[1]|0) + 1), 1);

      sheets .push ({
         title: `${_("New Logic")} ${next}`,
         nodes: [ ],
      });

      this .config .file .sheets      = sheets;
      this .config .file .activeSheet = sheets .length - 1;

      this .updateSheets ();
   }

   closeSheet (id)
   {
      const sheets = this .config .file .sheets;

      sheets .splice (id, 1);

      this .config .file .sheets = sheets;

      this .updateSheets ();
   }

   activateSheet ()
   {
      const active = this .top .tabs ("option", "active");

      this .config .file .activeSheet = active;

      this .title .val (this .config .file .sheets [active] .title);

      this .updateTitle ();
   }

   updateTitle ()
   {
      const
         active = this .config .file .activeSheet,
         sheets = this .config .file .sheets,
         title  = this .title .val () || _("New Logic");

      $(`a[href="#routing-sheet-${active}-tab"]`)
         .attr ("title", title)
         .text (title);

      sheets [active] .title = title;

      this .config .file .sheets = sheets;
   }

   nodes = new Set ();

   addNode (node)
   {
      if (this .nodes .has (node))
         return;

      this .nodes .add (node);

      console .log (node .getTypeName ());
   }

   resizeCanvas ()
   {
      this .topCanvas
         .prop ("width",  this .topCanvas .width ())
         .prop ("height", this .topCanvas .height ());

      this .canvas
         .prop ("width",  this .canvas .width ())
         .prop ("height", this .canvas .height ());

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
         context = this .canvas [0] .getContext ("2d"),
         width   = this .canvas .width (),
         height  = this .canvas .height (),
         top     = this .topCanvas .height ();

      this .drawGrid (this .topCanvas [0] .getContext ("2d"), width, top, -top);
      this .drawGrid (context, width, height, 0);
   }

   drawGrid (context, width, height, offset)
   {
      const
         size  = 20,
         color = this .#style .getPropertyValue ("--system-gray5");

      context .clearRect (0, 0, width, height);

      context .strokeStyle = color;
      context .lineWidth   = 1;

      for (let x = 0; x <= width; x += size)
      {
         context .beginPath ();
         context .moveTo (x, 0);
         context .lineTo (x, height);
         context .stroke ();
      }

      for (let y = Math .abs (offset % size); y <= height; y += size)
      {
         context .beginPath ();
         context .moveTo (0, y);
         context .lineTo (width, y);
         context .stroke ();
      }
   }

   dragEnter (event)
   {
      event .preventDefault ();
      event .stopPropagation ();

      if (event .originalEvent .dataTransfer .types .includes ("sunrize/nodes") ||
          event .originalEvent .dataTransfer .types .includes ("sunrize/imported-node"))
      {
         event .originalEvent .dataTransfer .dropEffect = "copy";
      }
      else
      {
         event .originalEvent .dataTransfer .dropEffect = "none";
      }
   }

   drop (event)
   {
      if (!event .originalEvent .dataTransfer .types .includes ("sunrize/nodes") &&
          !event .originalEvent .dataTransfer .types .includes ("sunrize/imported-node"))
      {
         return;
      }

      const ids = event .originalEvent .dataTransfer .types .includes ("sunrize/imported-node")
         ? event .originalEvent .dataTransfer .getData ("sunrize/imported-node") .split (",")
         : event .originalEvent .dataTransfer .getData ("sunrize/nodes") .split (",");

      for (const id of ids)
      {
         const
            element = $(`#${id}`),
            node    = this .outlineEditor .getNode (element);

         this .addNode (node);
      }
   }
};
