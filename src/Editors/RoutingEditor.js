
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D"),
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
         .on ("tabsactivate", () => this .activatePage ());

      this .topCanvas = $("<canvas></canvas>")
         .appendTo (this .top);

      this .tabs = $("<ul></ul>")
         .sortable ()
         .on ("sortupdate", (event, ui) => this .reorderPages (ui .item))
         .appendTo (this .top);

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "routing-toolbar"])
         .appendTo (this .editor);

      this .addPageButton = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Add new Logic."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .addPage ());

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

      electron .ipcRenderer .on ("close", () => this .savePages ());
      $(window)             .on ("close", () => this .savePages ());

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({
         pages: [ ],
         activatePage: 0,
      });

      // WIP
      // this .config .file .pages = [ ];

      this .updatePages ();
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

   updatePages ()
   {
      const
         pages = this .config .file .pages,
         active = this .config .file .activePage;

      if (!pages .length)
         return this .addPage ();

      this .top .find ("> div") .remove ();
      this .tabs .empty ();

      for (const [id, { title }] of pages .entries ())
      {
         // Add tab.
         $("<li></li>")
            .data ("id", id)
            .on ("click", () => this .top .tabs ("option", "active", id))
            .append ($("<a></a>")
               .addClass ("text")
               .attr ("href", `#routing-page-${id}-tab`)
               .attr ("title", title)
               .text (title))
            .append ($("<span></span>")
               .addClass (["material-icons", "button"])
               .text ("close")
               .on ("click", () => this .closePage (id)))
            .appendTo (this .tabs);

         // Add hidden empty panel.
         $("<div></div>")
            .attr ("id", `routing-page-${id}-tab`)
            .appendTo (this .top);
      }

      this .top .tabs ();
      this .top .tabs ("option", "classes.ui-tabs", "top");
      this .top .tabs ("refresh");

      if (this .top .tabs ("option", "active") === active)
         this .activatePage ();
      else
         this .top .tabs ("option", "active", active);
   }

   reorderPages (item)
   {
      const
         current = item .data ("id"),
         indices = Array .from (this .tabs .find ("> li"), li => $(li) .data ("id"));

      const
         pages          = this .config .file .pages,
         reorderedPages = indices .map (i => pages [i]);

      this .config .file .pages = reorderedPages;

      if (current < this .config .file .activePage)
      {
         if (indices .indexOf (current) >= this .config .file .activePage)
            -- this .config .file .activePage;

      }
      else if (current > this .config .file .activePage)
      {
         if (indices .indexOf (current) <= this .config .file .activePage)
            ++ this .config .file .activePage;
      }
      else
      {
         this .config .file .activePage = indices .indexOf (current);
      }

      this .updatePages ();
   }

   addPage ()
   {
      const
         pages = this .config .file .pages,
         next   = pages .reduce ((i, page) => Math .max (i, (page .title .match (/(\d+)\s*$/) ?.[1]|0) + 1), 1);

      pages .push ({
         title: `${_("New Logic")} ${next}`,
         nodes: [ ],
      });

      this .config .file .pages      = pages;
      this .config .file .activePage = pages .length - 1;

      this .updatePages ();
   }

   closePage (id)
   {
      const pages = this .config .file .pages;

      pages .splice (id, 1);

      this .config .file .pages = pages;

      this .updatePages ();
   }

   activatePage ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages = this .config .file .pages;

      this .config .file .activePage = active;

      this .title .val (pages [active] .title);

      this .updateTitle ();

      // WIP
      pages [active] .nodes = [ ];
      this .config .file .pages = pages;
   }

   updateTitle ()
   {
      const
         active = this .config .file .activePage,
         pages = this .config .file .pages,
         title  = this .title .val () || _("New Logic");

      $(`a[href="#routing-page-${active}-tab"]`)
         .attr ("title", title)
         .text (title);

      pages [active] .title = title;

      this .config .file .pages = pages;
   }

   getNode (id)
   {
      return this .outlineEditor .objects .get (id);
   }

   addNode (node, { x, y })
   {
      const
         id     = node .getId (),
         active = this .top .tabs ("option", "active"),
         pages = this .config .file .pages,
         page  = pages [active],
         nodes  = page .nodes;

      if (nodes .find (node => node .id === id))
         return;

      nodes .push ({ id, x, y });

      this .config .file .pages = pages;

      this .addNodeElement (node, { x, y });
   }

   addNodeElement (node, { x, y })
   {
      const element = $("<div></div>")
         .draggable ()
         .css ("position", "")
         .attr ("data-id", node .getId ())
         .css ({ left: x, top: y })
         .addClass ("node");

      const header = $("<div></div>")
         .addClass ("header")
         .appendTo (element);

      $("<img>")
         .addClass ("icon")
         .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg")
         .appendTo (header);

      const title = $("<div></div>")
         .addClass ("title")
         .appendTo (header);

      $("<span></span>")
         .addClass ("name")
         .text (node .getDisplayName () || _("<unnamed>"))
         .appendTo (title);

      $("<span></span>")
         .addClass ("type-name")
         .text (node .getTypeName ())
         .appendTo (title);

      $("<span></span>")
         .addClass (["material-icons", "button", "close"])
         .text ("close")
         .on ("click", () => false)
         .appendTo (header);

      const fields = $("<ul></ul>")
         .addClass ("fields")
         .appendTo (element);

      for (const field of node .getFields ())
      {
         if (field .getAccessType () === X3D .X3DConstants .initializeOnly)
            continue;

         const row = $("<li></li>")
            .addClass ("field")
            .appendTo (fields);

         if (field .isInput ())
         {
            $("<div></div>")
               .addClass ("input")
               .appendTo (row);
         }

         $("<img>")
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName ()}.svg`)
            .appendTo (row);

         $("<span></span>")
            .addClass ("name")
            .text (field .getName ())
            .appendTo (row);

         if (field .isOutput ())
         {
            $("<div></div>")
               .addClass ("output")
               .appendTo (row);
         }
      }

      $("<div></div>")
         .addClass ("footer")
         .appendTo (element);

      this .nodes .append (element);
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

         this .addNode (node, this .getRelativeCoords (event));
      }
   }

   getRelativeCoords (event)
   {
      const
         bounds = event .target .getBoundingClientRect (),
         x      = event .clientX - bounds .left,
         y      = event .clientY - bounds .top;

      return { x, y };
   }
};
