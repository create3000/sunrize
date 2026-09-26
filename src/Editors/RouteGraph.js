
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   X3D       = require ("../X3D"),
   _         = require ("../Application/GetText");

module .exports = class RouteGraph extends Interface
{
   constructor (element)
   {
      super (`Sunrize.RouteGraph.${element .attr ("id")}.`);

      this .editor = element
         .on ("dragenter dragover", event => this .dragEnter (event))
         .on ("drop", event => this .drop (event));

      this .top = $("<div></div>")
         .addClass ("route-graph-top")
         .on ("scroll", () => this .top .scrollTop (0))
         .on ("tabsactivate", () => this .activatePage ())
         .appendTo (this .editor);

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

      this .left = $("<div></div>")
         .addClass ("route-graph-left")
         .appendTo (this .editor);

      this .canvas = $("<canvas></canvas>")
         .addClass ("routes")
         .appendTo (this .left);

      electron .ipcRenderer .on ("route-graph", (event, key, ... args) => this [key] (... args));

      this .resizer = new ResizeObserver (() => this .resizeCanvas ());
      this .resizer .observe (this .left [0]);

      this .nodes = $("<div></div>")
         .addClass ("nodes")
         .on ("scroll", () => this .scrollNodes ())
         .on ("contextmenu", event => this .showContextMenu (event))
         .appendTo (this .left);

      this .title = $("<input>")
         .addClass ("title")
         .on ("input", () => this .updateTitle ());

      electron .ipcRenderer .on ("close",        () => this .savePages ());
      $(window)             .on ("beforeunload", () => this .savePages ());

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .global .setDefaultValues ({
         snapToGrid: false,
      });

      this .config .file .setDefaultValues ({
         pages: [ ],
         activatePage: 0,
      });

      // WIP
      // this .config .file .pages = [ ];

      this .restorePages ();
      this .updatePages ();
   }

   colorScheme (/* shouldUseDarkColors */)
   {
      this .requestUpdateCanvas ();
   }

   get outlineEditor ()
   {
      const document = require ("../Application/Window");

      return document .sidebar .outlineEditor;
   }

   showContextMenu (event, id)
   {
      event .preventDefault ();
      event .stopPropagation ();

      const element = this .nodes .find (`.node[data-id=${id}]`) .trigger ("focus");

      const menu = [
         {
            label: _("Snap to Grid"),
            type: "checkbox",
            checked: this .config .global .snapToGrid,
            args: ["setSnapToGrid", !this .config .global .snapToGrid],
         },
         { type: "separator" },
         {
            label: _("Select Node"),
            enabled: !! id,
            args: ["selectNode", id],
         },
         {
            label: _("Remove Node"),
            enabled: !! id,
            args: ["removeNode", id],
         },
      ];

      const menuId = Math .random ();

      electron .ipcRenderer .send ("context-menu", "route-graph", menu, menuId);
      electron .ipcRenderer .once ("context-menu-will-close", (event, id) =>
      {
         if (id === menuId)
            element .trigger ("blur");
      });
   }

   setSnapToGrid (snapToGrid)
   {
      this .config .global .snapToGrid = snapToGrid;
   }

   updatePages ()
   {
      const
         active = this .config .file .activePage,
         pages  = this .config .file .pages;

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

   savePages ()
   {
      const
         pages = this .config .file .pages,
         ids   = new Set ();

      for (const page of pages)
      {
         for (const node of page .nodes)
            ids .add (node .id);
      }

      const paths = this .getPathsFromNodes (this .browser .currentScene .rootNodes, ids);

      for (const page of pages)
      {
         for (const node of page .nodes)
         {
            if (node .id === undefined)
               continue;

            node .path = paths .get (node .id) ?? "";

            delete node .id;
         }
      }

      this .config .file .pages = pages;
   }

   getPathsFromNodes (nodes, ids, path = [ ], paths = new Map (), seen = new Set ())
   {
      for (const [i, node] of nodes .entries ())
      {
         path .push (i);

         this .getPathsFromNode (node ?.getValue (), ids, path, paths, seen);

         path .pop ();
      }

      return paths;
   }

   getPathsFromNode (node, ids, path, paths, seen)
   {
      if (!node)
         return;

      if (seen .has (node))
         return;

      if (ids .has (node .getId ()))
         paths .set (node .getId (), path .join (":"));

      for (const field of node .getFields ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               path .push (field .getName ());

               this .getPathsFromNode (field .getValue (), ids, path, paths, seen);

               path .pop ();
               break;
            }
            case X3D .X3DConstants .MFNode:
            {
               path .push (field .getName ());

               this .getPathsFromNodes (field, ids, path, paths, seen);

               path .pop ();
               break;
            }
         }
      }
   }

   restorePages ()
   {
      const
         pages = this .config .file .pages,
         paths = new Set ();

      for (const page of pages)
      {
         for (const node of page .nodes)
            paths .add (node .path);
      }

      const ids = this .getIdsFromNodes (this .browser .currentScene .rootNodes, paths);

      for (const page of pages)
      {
         for (const node of page .nodes)
            node .id = ids .get (node .path);

         page .nodes = page .nodes .filter (node => node .id !== undefined);
      }

      this .config .file .pages = pages;
   }

   getIdsFromNodes (nodes, paths, path = [ ], ids = new Map (), seen = new Set ())
   {
      for (const [i, node] of nodes .entries ())
      {
         path .push (i);

         this .getIdsFromNode (node ?.getValue (), paths, path, ids, seen);

         path .pop ();
      }

      return ids;
   }

   getIdsFromNode (node, paths, path, ids, seen)
   {
      if (!node)
         return;

      if (seen .has (node))
         return;

      if (paths .has (path .join (":")))
         ids .set (path .join (":"), node .getId ());

      this .setNode (node);

      for (const field of node .getFields ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               path .push (field .getName ());

               this .getIdsFromNode (field .getValue (), paths, path, ids, seen);

               path .pop ();
               break;
            }
            case X3D .X3DConstants .MFNode:
            {
               path .push (field .getName ());

               this .getIdsFromNodes (field, paths, path, ids, seen);

               path .pop ();
               break;
            }
         }
      }
   }

   restorePage ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .config .file .pages,
         page   = pages [active];

      this .nodes .empty ()
         .append (this .title);

      for (const node of page .nodes)
         this .addNodeElement (this .getNode (node .id), node);

      // Restore scroll position.

      const { scrollLeft = 0, scrollTop = 0 } = page;

      this .nodes .scrollLeft (scrollLeft);
      this .nodes .scrollTop  (scrollTop);

      // Wait until page is drawn and try again.

      setTimeout (() =>
      {
         this .nodes .scrollLeft (scrollLeft);
         this .nodes .scrollTop  (scrollTop);
      });
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
      this .restorePage ();
      this .requestUpdateCanvas ();
   }

   updateTitle ()
   {
      const
         active = this .config .file .activePage,
         pages  = this .config .file .pages,
         title  = this .title .val () || _("New Logic");

      $(`a[href="#routing-page-${active}-tab"]`)
         .attr ("title", title)
         .text (title);

      pages [active] .title = title;

      this .config .file .pages = pages;
   }

   scrollNodes ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .config .file .pages,
         page   = pages [active];

      page .scrollLeft = this .nodes .scrollLeft ();
      page .scrollTop  = this .nodes .scrollTop ();

      this .config .file .pages = pages;

      this .updateCanvas ();
   }

   getNode (id)
   {
      return this .outlineEditor .objects .get (id);
   }

   setNode (node)
   {
      return this .outlineEditor .objects .set (node .getId (), node .valueOf ());
   }

   addNode (node, { x, y })
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .config .file .pages,
         page   = pages [active],
         nodes  = page .nodes,
         id     = node .getId ();

      if (nodes .find (node => node .id === id))
         return;

      if (this .config .global .snapToGrid)
      {
         x = this .round (x, this .#gridSize);
         y = this .round (y, this .#gridSize);
      }

      nodes .push ({ id, x, y });

      this .config .file .pages = pages;

      this .addNodeElement (node, { x, y });
      this .requestUpdateCanvas ();
   }

   addNodeElement (node, { x, y })
   {
      node .name_changed     .addInterest ("updateNodeHeader", this, node .getId ());
      node .typeName_changed .addInterest ("updateNodeHeader", this, node .getId ());

      node .getUserDefinedFields () .addInterest ("updateNodeElement", this, node .getId ());

      const element = $("<div></div>")
         .draggable ()
         .attr ("data-id", node .getId ())
         .attr ("tabindex", 0)
         .css ("position", "")
         .css ({ left: x, top: y })
         .addClass ("node")
         .on ("mousedown", () => this .raiseNode (node .getId ()))
         .on ("drag", (event, ui) => this .moveNode (node .getId (), ui .position))
         .on ("contextmenu", event => this .showContextMenu (event, node .getId ()));

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
         .addClass (["material-symbols-outlined", "button", "arrow"])
         .text ("left_click")
         .attr ("title", _("Select Node"))
         .on ("mouseup", () => this .selectNode (node .getId ()))
         .appendTo (header);

      const fields = $("<ul></ul>")
         .addClass ("fields")
         .appendTo (element);

      for (const field of node .getFields ())
      {
         if (field .getAccessType () === X3D .X3DConstants .initializeOnly)
            continue;

         const row = $("<li></li>")
            .attr ("name", field .getName ())
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

   removeNode (id)
   {
      const
         active = this .config .file .activePage,
         pages  = this .config .file .pages,
         page   = pages [active],
         node   = this .getNode (id);

      page .nodes = page .nodes .filter (node => node .id !== id);

      this .config .file .pages = pages;

      this .removeNodeElement (node);
      this .requestUpdateCanvas ();
   }

   removeNodeElement (node)
   {
      node .name_changed     .removeInterest ("updateNodeHeader", this, node .getId ());
      node .typeName_changed .removeInterest ("updateNodeHeader", this, node .getId ());

      node .getUserDefinedFields () .removeInterest ("updateNodeElement", this);

      this .nodes .find (`.node[data-id=${node .getId ()}]`) .remove ();
   }

   updateNodeElement (id)
   {
      const node = this .getNode (id);

      if (!node)
         return;

      const
         element = this .nodes .find (`.node[data-id=${node .getId ()}]`),
         x       = parseFloat (element .css ("left")),
         y       = parseFloat (element .css ("top"));

      this .removeNodeElement (node);
      this .addNodeElement (node, { x, y });
      this .requestUpdateCanvas ();
   }

   updateNodeHeader (id)
   {
      const node = this .getNode (id);

      if (!node)
         return;

      const element = this .nodes .find (`.node[data-id=${node .getId ()}]`);

      element .find (".header .name")      .text (node .getName ());
      element .find (".header .type-name") .text (node .getTypeName ());
   }

   raiseNode (id)
   {
      this .nodes .find (`.node[data-id=${id}]`) .appendTo (this .nodes);
   }

   moveNode (id, position)
   {
      const
         active = this .config .file .activePage,
         pages  = this .config .file .pages,
         page   = pages [active],
         node   = page .nodes .find (node => node .id === id);

      position .left = Math .max (position .left, 0);
      position .top  = Math .max (position .top,  0);

      if (this .config .global .snapToGrid)
      {
         position .left = this .round (position .left, this .#gridSize);
         position .top  = this .round (position .top,  this .#gridSize);
      }

      node .x = position .left;
      node .y = position .top;

      this .config .file .pages = pages;

      this .requestUpdateCanvas ();
   }

   selectNode (id)
   {
      const
         node          = this .getNode (id),
         outlineEditor = this .outlineEditor;

      outlineEditor .expandTo (node, { expandObject: true, expandInlineNodes: true, expandAll: true });

      const elements = Array .from (outlineEditor .sceneGraph .find (`.node[node-id=${id}]`));

      if (!elements .length)
         return;

      for (const [i, element] of elements .entries ())
         outlineEditor .selectNodeElement ($(element), { add: i > 0, target: true });

      // Scroll element into view.
      // Hide scrollbars during scroll to prevent overlay issue.

      outlineEditor .treeView .css ("overflow", "hidden");

      elements [0] ?.scrollIntoView ({ block: "center", inline: "start", behavior: "smooth" });
      $(window) .scrollTop (0);

      setTimeout (() => outlineEditor .treeView .css ("overflow", ""), 1000);
   }

   resizeCanvas ()
   {
      this .topCanvas
         .prop ("width",  this .topCanvas .width ())
         .prop ("height", this .topCanvas .height ());

      this .canvas
         .prop ("width",  this .canvas .width ())
         .prop ("height", this .canvas .height ());

      this .updateCanvas ();
   }

   #updateCanvasId;

   requestUpdateCanvas ()
   {
      clearTimeout (this .#updateCanvasId);

      this .#updateCanvasId = setTimeout (() => this .updateCanvas ());
   }

   #style = window .getComputedStyle ($("body") [0]);

   updateCanvas ()
   {
      const
         context = this .canvas [0] .getContext ("2d"),
         width   = this .canvas .width (),
         height  = this .canvas .height (),
         offsetX = this .nodes .scrollLeft (),
         offsetY = this .nodes .scrollTop (),
         top     = this .topCanvas .height ();

      this .drawGrid (this .topCanvas [0] .getContext ("2d"), width, top, offsetX, offsetY - top);
      this .drawGrid (context, width, height, offsetX, offsetY);
      this .drawRoutes (context);
   }

   #gridSize = 20;

   drawGrid (context, width, height, offsetX, offsetY)
   {
      const
         size  = this .#gridSize,
         color = this .#style .getPropertyValue ("--system-gray5");

      context .clearRect (0, 0, width, height);

      context .strokeStyle = color;
      context .lineWidth   = 1;

      for (let x = -offsetX % size; x <= width; x += size)
      {
         context .beginPath ();
         context .moveTo (x, 0);
         context .lineTo (x, height);
         context .stroke ();
      }

      for (let y = -offsetY % size; y <= height; y += size)
      {
         context .beginPath ();
         context .moveTo (0, y);
         context .lineTo (width, y);
         context .stroke ();
      }
   }

   drawRoutes (context)
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .config .file .pages,
         page   = pages [active],
         nodes  = new Set (page .nodes .map (node => this .getNode (node .id))),
         offset = this .nodes .offset ();

      const color = this .#style .getPropertyValue ("--system-orange");

      context .fillStyle   = color;
      context .strokeStyle = color;
      context .lineWidth   = 3;

      for (const sourceNode of nodes)
      {
         const sourceNodeElement = this .nodes .find (`.node[data-id=${sourceNode .getId ()}]`);

         for (const sourceField of sourceNode .getFields ())
         {
            for (const route of sourceField .getOutputRoutes ())
            {
               const destinationNode = route .getDestinationNode ();

               if (!nodes .has (destinationNode))
                  continue;

               const
                  sourceElement          = sourceNodeElement .find (`.field[name="${sourceField .getName ()}"] .output`),
                  destinationField       = destinationNode .getField (route .getDestinationField ()),
                  destinationNodeElement = this .nodes .find (`.node[data-id=${destinationNode .getId ()}]`),
                  destinationElement     = destinationNodeElement .find (`.field[name="${destinationField .getName ()}"] .input`);

               const
                  sourceOffset      = sourceElement .offset (),
                  destinationOffset = destinationElement .offset (),
                  fromX             = sourceOffset .left - offset .left + sourceElement .width () / 2,
                  fromY             = sourceOffset .top - offset .top + sourceElement .height () / 2,
                  toX               = destinationOffset .left - offset .left + destinationElement .width () / 2,
                  toY               = destinationOffset .top - offset .top + destinationElement .height () / 2;

					// Draw sine curved route.

               const
					   wp = (toX - fromX) * 0.5,
					   x0 = fromX,
					   y0 = fromY,
					   x1 = fromX + wp,
					   y1 = fromY,
					   x2 = toX - wp,
					   y2 = toY,
					   x3 = toX,
					   y3 = toY;

               context .beginPath ();
					context .moveTo (x0, y0);
					context .bezierCurveTo (x1, y1, x2, y2, x3, y3);
					context .stroke ();

					// Draw arrow

					const arrow = this .getRouteArrow (new X3D .Vector2 (x0, y0), new X3D .Vector2 (x3, y3));

               context .beginPath ();
					context .moveTo (arrow [0] .x, arrow [0] .y);
					context .lineTo (arrow [1] .x, arrow [1] .y);
					context .lineTo (arrow [2] .x, arrow [2] .y);
					context .fill ();
            }
         }
      }
   }

   getRouteArrow (sourcePosition, destinationPosition)
   {
      // Intersect with arrow

      const
         p1 = new X3D .Vector2 (),
         p2 = new X3D .Vector2 (0, 14),
         p3 = new X3D .Vector2 (10 / 9 * 14, 7),
         c  = p1 .copy () .add (p2) .add (p3) .divide (3) .negate (),
         t  = sourcePosition .copy () .add (destinationPosition) .divide (2),
         d  = destinationPosition .copy () .subtract (sourcePosition),
         s  = Math .sin (1 / d .x * Math .PI ** 2 / 2) * d .y / 2,
         a  = d .x ? Math .atan2 (1, 1 / s) : Math .PI / 2,
         q  = d .x >= 0 ? 0.1 : -0.1, // Correction term for rotation.
         r  = d .y >= 0 ? a - q : a + Math .PI + q;

      const m = new X3D .Matrix3 ();

      m .translate (t);
      m .rotate (r);
      m .translate (c);

      return [m .multVecMatrix (p1), m .multVecMatrix (p2), m .multVecMatrix (p3)];
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

         this .addNode (node, this .getDropPosition (event));
      }
   }

   getDropPosition (event)
   {
      const
         bounds = event .target .getBoundingClientRect (),
         x      = event .clientX - bounds .left + this .nodes .scrollLeft (),
         y      = event .clientY - bounds .top  + this .nodes .scrollTop ();

      return { x, y };
   }

   round (value, steps)
   {
      return Math .round (value / steps) * steps;
   }
};
