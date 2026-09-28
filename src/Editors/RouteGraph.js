"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   Interface   = require ("../Application/Interface"),
   X3D         = require ("../X3D"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

module .exports = class RouteGraph extends Interface
{
   #style = window .getComputedStyle ($("#route-graph") [0]);

   constructor (element)
   {
      super (`Sunrize.RouteGraph.${element .attr ("id")}.`);

      this .config .global .setDefaultValues ({
         snapToGrid: false,
         addConnectedNodes: true,
      });

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

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .snapToGridButton = $("<span></span>")
         .addClass ("material-symbols-outlined")
         .attr ("title", _("Snap to grid."))
         .css ({ transform: "scale(0.9)" })
         .text ("grid_4x4")
         .appendTo (this .toolbar)
         .on ("click", () => this .setSnapToGrid (!this .config .global .snapToGrid));

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .addConnectedNodesButton = $("<span></span>")
         .addClass ("material-symbols-outlined")
         .attr ("title", _("Add connected nodes."))
         .css ({ transform: "scale(0.8)" })
         .text ("hub")
         .appendTo (this .toolbar)
         .on ("click", () => this .setAddConnectedNodes (!this .config .global .addConnectedNodes));

      this .left = $("<div></div>")
         .addClass ("pages")
         .appendTo (this .editor);

      this .canvas = $("<canvas></canvas>")
         .addClass ("routes")
         .appendTo (this .left);

      this .resizer = new ResizeObserver (() => this .resizeCanvas ());
      this .resizer .observe (this .left [0]);

      this .nodes = $("<div></div>")
         .addClass ("nodes")
         .on ("mouseup", () => this .clearInputOutput ())
         .on ("mouseup", event => this .selectRoute (event, false))
         .on ("dblclick", event => this .deleteRoute (event))
         .on ("scroll", () => this .scrollNodes ())
         .on ("scrollend", () => this .scrollNodesEnd ())
         .on ("contextmenu", event => this .showContextMenu (event))
         .on ("mousemove", event => this .mouseMove (event))
         .on ("mousedown", event => this .drawLassoStart (event))
         .appendTo (this .left);

      this .title = $("<input>")
         .addClass ("title")
         .on ("input", () => this .updateTitle ())
         .on ("mousedown contextmenu", event => event .stopPropagation ())
         .appendTo (this .nodes);

      this .placeholder = $("<div></div>")
         .addClass ("placeholder")
         .text (_("Drag and drop nodes here."))
         .appendTo (this .nodes);

      this .overlay = $("<canvas></canvas>")
         .addClass ("overlay")
         .appendTo (this .left);

      electron .ipcRenderer .on ("activate", (event, value) => this .activate (value));
      electron .ipcRenderer .on ("route-graph", (event, key, ... args) => this [key] (... args));
      electron .ipcRenderer .on ("context-menu-will-close", (event, id) => this .closeContextMenu (id));

      this .setup ();
   }

   configure ()
   {
      super .configure ();

      this .config .file .setDefaultValues ({
         activePage: 0,
      });

      this .browser .currentScene .sceneGraph_changed .addInterest ("requestSavePages", this);

      this .activate (true);
      this .restorePages ();
      this .updatePages ();
   }

   activate (active)
   {
      if (active)
      {
         this .setSnapToGrid (this .config .global .snapToGrid);
         this .setAddConnectedNodes (this .config .global .addConnectedNodes);
      }
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

   #menu;
   #menuId;

   showContextMenu (event, id)
   {
      event .preventDefault ();
      event .stopPropagation ();

      const element = this .nodes .find (`.node[node-id=${id}]`);

      if (element .length && !element .is (".selected"))
         this .setNodeSelection (this .getNode (element .data ("id")));

      const menu = [
         {
            label: _("New Page"),
            args: ["addPage"],
         },
         { type: "separator" },
         {
            label: _("Snap to Grid"),
            type: "checkbox",
            checked: this .config .global .snapToGrid,
            args: ["setSnapToGrid", !this .config .global .snapToGrid],
         },
         { type: "separator" },
         {
            label: _("Add Connected Nodes"),
            type: "checkbox",
            checked: this .config .global .addConnectedNodes,
            args: ["setAddConnectedNodes", !this .config .global .addConnectedNodes],
         },
         {
            label: _("Find Node"),
            enabled: !! id,
            args: ["findNode", id, false],
         },
         {
            label: _("Select All Nodes"),
            args: ["selectAllNodes"],
         },
         {
            label: _("Deselect All Nodes"),
            args: ["clearNodeSelection"],
         },
         {
            label: _("Remove Selected Nodes"),
            enabled: !! this .#selectedNodes .size,
            args: ["removeSelectedNodes"],
         },
         { type: "separator" },
         {
            label: _("Select All Routes"),
            args: ["selectAllRoutes"],
         },
         {
            label: _("Deselect All Routes"),
            args: ["clearRouteSelection"],
         },
         {
            label: _("Delete Selected Routes"),
            enabled: !! this .#selectedRoutes .size,
            args: ["deleteSelectedRoutes"],
         },
      ];

      this .#menu   = true;
      this .#menuId = Math .random ();

      electron .ipcRenderer .send ("context-menu", "route-graph", menu, this .#menuId);
   }

   closeContextMenu (id)
   {
      if (id === this .#menuId)
         this .#menu = false;
   }

   setSnapToGrid (snapToGrid)
   {
      this .config .global .snapToGrid = snapToGrid;

      if (snapToGrid)
         this .snapToGridButton .addClass ("active");
      else
         this .snapToGridButton .removeClass ("active");
   }

   setAddConnectedNodes (addConnectedNodes)
   {
      this .config .global .addConnectedNodes = addConnectedNodes;

      if (addConnectedNodes)
         this .addConnectedNodesButton .addClass ("active");
      else
         this .addConnectedNodesButton .removeClass ("active");
   }

   updatePages ()
   {
      const
         active = this .config .file .activePage,
         pages  = this .pages;

      if (!pages .length)
         return this .addPage ();

      this .top .find ("> div") .remove ();
      this .tabs .empty ();

      for (const [index, { title }] of pages .entries ())
      {
         // Add tab.
         $("<li></li>")
            .data ("index", index)
            .on ("click", () => this .top .tabs ("option", "active", index))
            .append ($("<a></a>")
               .addClass ("text")
               .attr ("href", `#routing-page-${index}-tab`)
               .attr ("title", title)
               .text (title))
            .append ($("<span></span>")
               .addClass (["material-icons", "button"])
               .text ("close")
               .on ("click", () => this .closePage (index)))
            .appendTo (this .tabs);

         // Add hidden empty panel.
         $("<div></div>")
            .attr ("id", `routing-page-${index}-tab`)
            .appendTo (this .top);
      }

      this .top .tabs ();
      this .top .tabs ("option", "classes.ui-tabs", "top");
      this .top .tabs ("refresh");

      if (this .top .tabs ("option", "active") === active)
         this .activatePage ();
      else
         this .top .tabs ("option", "active", active);

      this .requestSavePages ();
   }

   reorderPages (item)
   {
      const
         current = item .data ("index"),
         indices = Array .from (this .tabs .find ("> li"), li => $(li) .data ("index"));

      const
         pages          = this .pages,
         reorderedPages = indices .map (i => pages [i]);

      this .pages = reorderedPages;

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

   #savePagesId;

   requestSavePages ()
   {
      clearTimeout (this .#savePagesId);

      this .#savePagesId = setTimeout (() => this .savePages ());
   }

   savePages ()
   {
      const
         pages = structuredClone (this .pages),
         ids   = new Set ();

      for (const page of pages)
      {
         for (const node of page .nodes)
            ids .add (node .id);
      }

      const paths = this .getPathsFromScene (this .browser .currentScene, ids);

      for (const page of pages)
      {
         delete page .selectedNodes;
         delete page .selectedRoutes;

         for (const node of page .nodes)
         {
            node .path = paths .get (node .id) ?? "";

            delete node .id;
         }
      }

      if (!ids .size)
         return;

      const configNode = Editor .getConfigNode (this .browser .currentScene, true);

      configNode .setMetaData ("Sunrize/RouteGraph/pages", new X3D .SFString (JSON .stringify (pages)));

      UndoManager .shared .saveNeeded = true;
   }

   getPathsFromScene (scene, ids, path = [ ], paths = new Map (), seen = new Set ())
   {
      // protos

      path .push ("protos");

      for (const proto of scene .protos)
      {
         path .push (proto .name);

         // fields

         path .push ("fields");

         this .getPathsFromNode (proto, true, ids, path, paths, seen);

         path .pop ();

         // body

         this .getPathsFromScene (proto .getBody (), ids, path, paths, seen);

         path .pop ();
      }

      path .pop ();

      // rootNodes

      path .push ("rootNodes");

      this .getPathsFromNodes (scene .rootNodes, ids, path, paths, seen);

      path .pop ();

      // importedNodes

      path .push ("importedNodes");

      for (const [i, importedNode] of scene .importedNodes .entries ())
      {
         path .push (i);

         this .getPathsFromNode (importedNode .getExportedNode (), false, ids, path, paths, seen);

         path .pop ();
      }

      path .pop ();

      return paths;
   }

   getPathsFromNodes (nodes, ids, path, paths, seen)
   {
      for (const [i, node] of nodes .entries ())
      {
         path .push (i);

         this .getPathsFromNode (node ?.getValue (), true, ids, path, paths, seen);

         path .pop ();
      }
   }

   getPathsFromNode (node, fields, ids, path, paths, seen)
   {
      if (!node)
         return;

      if (seen .has (node))
         return;

      if (ids .has (node .getId ()))
         paths .set (node .getId (), path .join (":"));

      if (!fields)
         return;

      for (const field of node .getFields ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               path .push (field .getName ());

               this .getPathsFromNode (field .getValue (), true, ids, path, paths, seen);

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
         configNode = Editor .getConfigNode (this .browser .currentScene),
         pages      = $.try (() => JSON .parse (configNode ?.getMetaData ("Sunrize/RouteGraph/pages"))) ?? [ ],
         paths      = new Set ();

      for (const page of pages)
      {
         for (const node of page .nodes)
            paths .add (node .path);
      }

      const ids = this .getIdsFromScene (this .browser .currentScene, paths);

      for (const page of pages)
      {
         for (const node of page .nodes)
            node .id = ids .get (node .path);

         page .nodes = page .nodes .filter (node => node .id !== undefined);
      }

      this .pages = pages;
   }

   getIdsFromScene (scene, paths, path = [ ], ids = new Map (), seen = new Set ())
   {
      // protos

      path .push ("protos");

      for (const proto of scene .protos)
      {
         path .push (proto .name);

         // fields

         path .push ("fields");

         this .getIdsFromNode (proto, true, paths, path, ids, seen);

         path .pop ();

         // body

         this .getIdsFromScene (proto .getBody (), paths, path, ids, seen);

         path .pop ();
      }

      path .pop ();

      // rootNodes

      path .push ("rootNodes");

      this .getIdsFromNodes (scene .rootNodes, paths, path, ids, seen);

      path .pop ();

      // importedNodes

      path .push ("importedNodes");

      for (const [i, importedNode] of scene .importedNodes .entries ())
      {
         path .push (i);

         this .getIdsFromNode (importedNode .getExportedNode (), false, paths, path, ids, seen);

         path .pop ();
      }

      path .pop ();

      return ids;
   }

   getIdsFromNodes (nodes, paths, path, ids, seen)
   {
      for (const [i, node] of nodes .entries ())
      {
         path .push (i);

         this .getIdsFromNode (node ?.getValue (), true, paths, path, ids, seen);

         path .pop ();
      }
   }

   getIdsFromNode (node, fields, paths, path, ids, seen)
   {
      if (!node)
         return;

      if (seen .has (node))
         return;

      if (paths .has (path .join (":")))
         ids .set (path .join (":"), node .getId ());

      this .setNode (node);

      if (!fields)
         return;

      for (const field of node .getFields ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               path .push (field .getName ());

               this .getIdsFromNode (field .getValue (), true, paths, path, ids, seen);

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

   savePage (page)
   {
      page .selectedNodes  = Array .from (this .#selectedNodes);
      page .selectedRoutes = Array .from (this .#selectedRoutes);
   }

   restorePage ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .pages,
         page   = pages [active];

      this .clearNodeSelection ();
      this .clearRouteSelection ();
      this .clearInputOutput ();

      const currentNodes = Array .from (this .nodes .find (".node"), element => this .getNode ($(element) .data ("id")));

      for (const node of currentNodes)
         this .removeNodeElement (node);

      for (const node of page .nodes)
         this .addNodeElement (this .getNode (node .id), node);

      // Restore selections.

      const ids = page .nodes .map (node => node .id);

      for (const node of page .selectedNodes ?? [ ])
      {
         if (ids .includes (node .getId ()))
            this .addNodeSelection (node);
      }

      for (const route of page .selectedRoutes ?? [ ])
      {
         if (route .getExecutionContext () .routes .includes (route))
            this .addRouteSelection (route);
      }

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
         pages = this .pages,
         next  = pages .reduce ((i, page) => Math .max (i, (page .title .match (/(\d+)\s*$/) ?.[1]|0) + 1), 1);

      pages .push ({
         title: `${_("New Logic")} ${next}`,
         nodes: [ ],
      });

      this .updatePages ();

      this .top .tabs ("option", "active", pages .length - 1);
   }

   closePage (index)
   {
      const active = this .top .tabs ("option", "active");

      if (active === this .config .file .activePage)
         this .config .file .activePage = -1;

      this .pages .splice (index, 1);

      this .updatePages ();
   }

   activatePage ()
   {
      const
         active  = this .top .tabs ("option", "active"),
         pages   = this .pages,
         page    = pages [active],
         current = pages [this .config .file .activePage];

      if (current)
         this .savePage (current);

      this .config .file .activePage = active;

      this .title .val (page .title);

      this .updateTitle ();
      this .restorePage ();
      this .requestUpdateCanvas ();
   }

   updateTitle ()
   {
      const
         active = this .config .file .activePage,
         pages  = this .pages,
         title  = this .title .val () || _("New Logic");

      $(`a[href="#routing-page-${active}-tab"]`)
         .attr ("title", title)
         .text (title);

      pages [active] .title = title;

      this .requestSavePages ();
   }

   scrollNodes ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .pages,
         page   = pages [active];

      page .scrollLeft = this .nodes .scrollLeft ();
      page .scrollTop  = this .nodes .scrollTop ();

      this .updateCanvas ();
   }

   scrollNodesEnd ()
   {
      this .requestSavePages ();
   }

   getNode (id)
   {
      return this .outlineEditor .objects .get (id);
   }

   setNode (node)
   {
      this .outlineEditor .objects .set (node .getId (), node .valueOf ());
   }

   addNode (node, { x, y })
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .pages,
         page   = pages [active],
         nodes  = page .nodes,
         id     = node .getId ();

      this .setNode (node);

      if (nodes .find (node => node .id === id))
         return;

      if (this .config .global .snapToGrid)
      {
         x = this .round (x, this .#gridSize);
         y = this .round (y, this .#gridSize);
      }

      nodes .push ({ id, x, y });

      this .addNodeElement (node, { x, y });
      this .requestSavePages ();
      this .requestUpdateCanvas ();
   }

   #gaps = new X3D .Vector2 (5, 2); // In grid units.

   addConnectedNodes (node, { x, y })
   {
      const columns = this .getConnectedNodes (node .getExecutionContext (), node, 0);

      for (const index of Array .from (columns .keys ()) .sort ((a, b) => a - b))
      {
         const column = columns .get (index);

         let
            offsetX = 0,
            offsetY = y;

         for (const node of column)
         {
            this .addNode (node, { x, y: offsetY });

            const element = this .nodes .find (`.node[node-id=${node .getId ()}]`);

            x        = parseFloat (element .css ("left"));
            offsetX  = Math .max (offsetX, element .width ());
            offsetY += element .height () + this .#gridSize * this .#gaps .y;
         }

         x += offsetX + this .#gridSize * this .#gaps .x;
      }
   }

   getConnectedNodes (executionContext, node, index, columns = new Map (), nodes = new Set ())
   {
      if (nodes .has (node))
         return;

      if (node .getExecutionContext () !== executionContext)
         return;

      this .setNode (node);

      nodes .add (node);
      columns .getOrInsert (index, [ ]) .push (node);

      for (const field of node .getFields ())
      {
         for (const route of field .getInputRoutes ())
            this .getConnectedNodes (executionContext, route .getSourceNode (), index - 1, columns, nodes);

         for (const route of field .getOutputRoutes ())
            this .getConnectedNodes (executionContext, route .getDestinationNode (), index + 1, columns, nodes);
      }

      return columns;
   }

   addNodeElement (node, { x, y }, selected)
   {
      const id = node .getId ();

      node .getLive () .addInterest ("nodeLive", this, id);

      node .name_changed     .addInterest ("updateNodeHeader", this, id);
      node .typeName_changed .addInterest ("updateNodeHeader", this, id);

      node .getPredefinedFields ()  .addInterest ("updateNodeElement", this, id);
      node .getUserDefinedFields () .addInterest ("updateNodeElement", this, id);

      if (node instanceof X3D .X3DImportedNodeProxy)
      {
         // These events are connected and must never be removed.
         node .getImportedNode () .getInlineNode () .getLoadState () .addInterest ("updateNodeElement", this, id);
         node .getExecutionContext () .importedNodes .addInterest ("updateImportedNodes", this);
      }

      const element = $("<div></div>")
         .draggable ()
         .data ("id", id)
         .attr ("node-id", id)
         .attr ("execution-context-id", node .getExecutionContext () .getId ())
         .css ("position", "")
         .css ({ left: x, top: y })
         .addClass ("node")
         .on ("mousedown", () => this .raiseNode (id))
         .on ("mouseup", event => this .selectNode (event, id))
         .on ("dragstart", () => this .moveNodeStart (id))
         .on ("drag", (event, ui) => this .moveNode (id, ui .position))
         .on ("contextmenu", event => this .showContextMenu (event, id));

      if (selected)
         element .addClass ("selected");

      if (node instanceof X3D .X3DImportedNodeProxy)
         element .addClass ("imported-node");

      const header = $("<div></div>")
         .addClass ("header")
         .appendTo (element);

      const icon = $("<img>")
         .addClass ("icon")
         .appendTo (header);

      if (node instanceof X3D .X3DImportedNodeProxy)
         icon .attr ("src", "../images/OutlineEditor/Node/ImportedNode.svg");
      else
         icon .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg");

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
         .attr ("title", _("Find node."))
         .on ("mouseup", event =>
         {
            if (event .button !== 0)
               return;

            this .findNode (id, event .shiftKey);
         })
         .appendTo (header);

      const fieldsElement = $("<ul></ul>")
         .addClass ("fields")
         .appendTo (element);

      for (const [i, fields] of [node .getPredefinedFields (), node .getUserDefinedFields () .toReversed ()] .entries ())
      {
         const first = fieldsElement .find ("> :first-child");

         for (const field of fields)
         {
            if (field .getAccessType () === X3D .X3DConstants .initializeOnly)
               continue;

            field .addRouteCallback (this, () => this .requestUpdateCanvas ());

            const fieldElement = $("<li></li>")
               .attr ("name", field .getName ())
               .attr ("type-name", field .getTypeName ())
               .addClass ("field");

            if (i)
               first .after (fieldElement .addClass ("user-defined"));
            else
               fieldElement .appendTo (fieldsElement);

            if (field .isInput ())
            {
               $("<div></div>")
                  .addClass ("input")
                  .on ("mousedown", false)
                  .on ("mouseup", event => this .selectInput (event, id, field .getName ()))
                  .appendTo (fieldElement);
            }

            $("<img>")
               .addClass ("icon")
               .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName ()}.svg`)
               .appendTo (fieldElement);

            $("<span></span>")
               .addClass ("name")
               .text (field .getName ())
               .appendTo (fieldElement);

            if (field .isOutput ())
            {
               $("<div></div>")
                  .addClass ("output")
                  .on ("mousedown", false)
                  .on ("mouseup", event => this .selectOutput (event, id, field .getName ()))
                  .appendTo (fieldElement);
            }
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
         pages  = this .pages,
         page   = pages [active],
         node   = this .getNode (id);

      page .nodes = page .nodes .filter (node => node .id !== id);

      this .removeNodeElement (node);
      this .requestSavePages ();
      this .requestUpdateCanvas ();
   }

   removeNodeElement (node)
   {
      const id = node .getId ();

      node .getLive () .removeInterest ("nodeLive", this);

      node .name_changed     .removeInterest ("updateNodeHeader", this);
      node .typeName_changed .removeInterest ("updateNodeHeader", this);

      node .getPredefinedFields ()  .removeInterest ("updateNodeElement", this);
      node .getUserDefinedFields () .removeInterest ("updateNodeElement", this);

      this .nodes .find (`.node[node-id=${id}]`) .remove ();

      for (const field of node .getFields ())
         field .removeRouteCallback (this);

      // Clear selections.

      this .removeNodeSelection (node);

      for (const field of node .getFields ())
      {
         for (const route of field .getInputRoutes ())
            this .clearRouteSelection (route);

         for (const route of field .getOutputRoutes ())
            this .clearRouteSelection (route);
      }
   }

   updateNodeElement (id)
   {
      const element = this .nodes .find (`.node[node-id=${id}]`);

      if (!element .length)
         return;

      const
         node     = this .getNode (id),
         selected = this .isNodeSelected (node);

      const
         x = parseFloat (element .css ("left")),
         y = parseFloat (element .css ("top"));

      this .removeNodeElement (node);
      this .addNodeElement (node, { x, y }, selected);
      this .requestUpdateCanvas ();
   }

   updateNodeHeader (id)
   {
      const element = this .nodes .find (`.node[node-id=${id}]`);

      if (!element .length)
         return;

      const node = this .getNode (id);

      element .find (".header .name")      .text (node .getDisplayName () || _("<unnamed>"));
      element .find (".header .type-name") .text (node .getTypeName ());
   }

   raiseNode (id)
   {
      this .nodes .find (`.node[node-id=${id}]`) .appendTo (this .nodes);
   }

   #movingNode = false;

   moveNodeStart (id)
   {
      const node = this .getNode (id);

      this .#movingNode = true;

      $(document) .on ("mouseup.move-node", () => this .moveNodeEnd ());

      if (!this .isNodeSelected (node))
         this .setNodeSelection (node);

      this .clearInputOutput ();
   }

   moveNode (id, position)
   {
      const
         active = this .config .file .activePage,
         pages  = this .pages,
         page   = pages [active],
         node   = page .nodes .find (node => node .id === id);

      // Constrain position.

      position .left = Math .max (position .left, 0);
      position .top  = Math .max (position .top,  0);

      if (this .config .global .snapToGrid)
      {
         position .left = this .round (position .left, this .#gridSize);
         position .top  = this .round (position .top,  this .#gridSize);
      }

      node .x = position .left;
      node .y = position .top;

      // Move selected nodes.

      const
         element = this .nodes .find (`.node[node-id=${id}]`),
         others  = this .nodes .find (`.node.selected:not([node-id=${id}])`);

      const
         deltaX = position .left - parseInt (element .css ("left")),
         deltaY = position .top  - parseInt (element .css ("top"));

      for (const other of others)
      {
         const
            element = $(other),
            id      = element .data ("id"),
            left    = parseInt (element .css ("left")) + deltaX,
            top     = parseInt (element .css ("top"))  + deltaY;

         element .css ("left", left);
         element .css ("top",  top);

         const node = page .nodes .find (node => node .id === id);

         node .x = left;
         node .y = top;
      }

      this .requestUpdateCanvas ();
   }

   moveNodeEnd ()
   {
      this .#movingNode = false;

      $(document) .off (".move-node");

      this .requestSavePages ();
   }

   findNode (id, add)
   {
      const
         node          = this .getNode (id),
         outlineEditor = this .outlineEditor;

      outlineEditor .expandTo (node, { expandObject: true, expandInlineNodes: true, expandAll: true });

      const elements = Array .from (outlineEditor .sceneGraph .find (`.node[node-id=${id}], .imported-node[node-id=${id}]`));

      if (!elements .length)
         return;

      for (const [i, element] of elements .entries ())
      {
         if ($(element) .is (".node"))
            outlineEditor .selectNodeElement ($(element), { add: add || i > 0, target: true });

         else if ($(element) .is (".imported-node"))
            outlineEditor .selectPrimaryElement ($(element), { add: add || i > 0, target: true });
      }

      // Scroll element into view.
      // Hide scrollbars during scroll to prevent overlay issue.

      outlineEditor .treeView .css ("overflow", "hidden");

      elements [0] ?.scrollIntoView ({ block: "center", inline: "start", behavior: "smooth" });
      $(window) .scrollTop (0);

      setTimeout (() => outlineEditor .treeView .css ("overflow", ""), 1000);
   }

   selectNode (event, id)
   {
      if (event .button !== 0)
         return;

      if (this .#lasso || this .#movingNode)
         return;

      const node = this .getNode (id);

      if (event .shiftKey)
      {
         if (this .isNodeSelected (node))
            this .removeNodeSelection (node);
         else
            this .addNodeSelection (node);
      }
      else
      {
         this .setNodeSelection (node);
      }
   }

   selectAllNodes ()
   {
      this .clearNodeSelection ();

      for (const element of this .nodes .find (".node"))
         this .addNodeSelection (this .getNode ($(element) .data ("id")));
   }

   removeSelectedNodes ()
   {
      for (const node of Array .from (this .#selectedNodes))
         this .removeNode (node .getId ());
   }

   #selectedNodes = new Set ();

   addNodeSelection (node)
   {
      this .#selectedNodes .add (node);

      this .nodes .find (`.node[node-id=${node .getId ()}]`) .addClass ("selected");
   }

   removeNodeSelection (node)
   {
      this .#selectedNodes .delete (node);

      this .nodes .find (`.node[node-id=${node .getId ()}]`) .removeClass ("selected");
   }

   setNodeSelection (node)
   {
      this .clearNodeSelection ();
      this .addNodeSelection (node);
   }

   clearNodeSelection ()
   {
      this .#selectedNodes .clear ();

      this .nodes .find (`.node`) .removeClass ("selected");
   }

   isNodeSelected (node)
   {
      return this .#selectedNodes .has (node);
   }

   nodeLive (id)
   {
      const node = this .getNode (id);

      if (node .isLive ())
         return;

      this .removeNode (id);
   }

   updateImportedNodes ()
   {
      const
         active = this .config .file .activePage,
         pages  = this .pages,
         page   = pages [active];

      for (const { id } of page .nodes)
      {
         const element = this .nodes .find (`.imported-node[node-id=${id}]`);

         if (!element .length)
            continue;

         const
            node             = this .getNode (id),
            executionContext = node .getExecutionContext ();

         if (executionContext .importedNodes .find (importedNode => importedNode .getExportedNode () === node))
            continue;

         this .removeNode (id);
      }

      this .requestUpdateCanvas ();
   }

   #lasso;
   #lassoStart;
   #lassoScroll;
   #lassoNodes;

   drawLassoStart (event)
   {
      if (event .button !== 0)
         return;

      if (this .#menu || this .#input || this .#output)
         return;

      this .#lassoStart  = this .#pointer .copy ();
      this .#lassoScroll = new X3D .Vector2 (this .nodes .scrollLeft (), this .nodes .scrollTop ());
      this .#lassoNodes  = new Set (this .#selectedNodes);

      this .nodes .on ("scroll.lasso", event => this .drawLasso (event));
      $(document) .on ("mousemove.lasso", event => this .drawLasso (event));
      $(document) .on ("mouseup.lasso", event => this .drawLassoEnd (event));
   }

   drawLasso (event)
   {
      if (event .button !== 0)
         return;

      if (this .#movingNode)
         return this .drawLassoEnd (event);

      // Draw Lasso

      const
         context      = this .overlay [0] .getContext ("2d"),
         width        = this .overlay .width (),
         height       = this .overlay .height (),
         contentScale = window .devicePixelRatio,
         pointer      = this .getRelativePosition (event, false),
         scroll       = new X3D .Vector2 (this .nodes .scrollLeft (), this .nodes .scrollTop ()),
         deltaScroll  = this .#lassoScroll .copy () .subtract (scroll),
         start        = this .#lassoStart .copy () .add (deltaScroll),
         size         = pointer .copy () .subtract (start);

      const
         fillStyle   = this .#style .getPropertyValue ("--lasso-fill"),
         strokeStyle = this .#style .getPropertyValue ("--lasso-stroke");

      context .fillStyle   = fillStyle;
      context .strokeStyle = strokeStyle;
      context .lineWidth   = 2;

      context .save ();
      context .scale (contentScale, contentScale);
      context .clearRect (0, 0, width, height);

      context .beginPath ();
      context .rect (... start, ... size);
      context .fill ();

      context .beginPath ();
      context .rect (... start, ... size);
      context .stroke ();

      context .restore ();

      // Intersection Test

      if (Math .max (... size .copy () .abs ()) < 10)
         return;

      this .#lasso = true;

      this .nodes .addClass ("lasso");

      const
         active = this .top .tabs ("option", "active"),
         pages  = this .pages,
         page   = pages [active],
         end    = start .copy () .add (size);

      const lasso = {
         left:   Math .min (start .x, end .x) + scroll .x,
         top:    Math .min (start .y, end .y) + scroll .y,
         right:  Math .max (start .x, end .x) + scroll .x,
         bottom: Math .max (start .y, end .y) + scroll .y,
      };

      if (!event .shiftKey)
         this .clearNodeSelection ();

      for (const { id } of page .nodes)
      {
         const
            node      = this .getNode (id),
            element   = this .nodes .find (`.node[node-id=${id}]`),
            left      = parseInt (element .css ("left")),
            top       = parseInt (element .css ("top")),
            width     = element .width (),
            height    = element .height (),
            rectangle = { left, top, right: left + width, bottom: top + height };

         if (this .rectanglesIntersect (lasso, rectangle))
         {
            if (event .shiftKey)
            {
               if (this .#lassoNodes .has (node))
                  this .removeNodeSelection (node);
               else
                  this .addNodeSelection (node);
            }
            else
            {
               this .addNodeSelection (node);
            }
         }
         else
         {
            if (event .shiftKey)
            {
               if (this .#lassoNodes .has (node))
                  this .addNodeSelection (node);
               else
                  this .removeNodeSelection (node);
            }
         }
      }

      const
         overscrollX = end .x - this .nodes .width (),
         overscrollY = end .y - this .nodes .height ();

      if (end .x < 10)
         this .nodes .scrollLeft (this .nodes .scrollLeft () - 10);
      else if (overscrollX > -10)
         this .nodes .scrollLeft (this .nodes .scrollLeft () + 10);

      if (end .y < 10)
         this .nodes .scrollTop (this .nodes .scrollTop () - 10);
      else if (overscrollY > -10)
         this .nodes .scrollTop (this .nodes .scrollTop () + 10);
   }

   drawLassoEnd (event)
   {
      if (event .button !== 0)
         return;

      this .#lasso = false;

      this .nodes .removeClass ("lasso") .off (".lasso");
      $(document) .off (".lasso");

      const
         context      = this .overlay [0] .getContext ("2d"),
         width        = this .overlay .width (),
         height       = this .overlay .height (),
         contentScale = window .devicePixelRatio;

      context .save ();
      context .scale (contentScale, contentScale);
      context .clearRect (0, 0, width, height);
      context .restore ();
   }

   rectanglesIntersect (a, b)
   {
      return Math .max (a .left, b .left) < Math .min (a .right, b .right) &&
          Math .max (a .top, b .top) < Math .min (a .bottom, b .bottom);
   }

   #input  = null;
   #output = null;

   selectInput (event, id, fieldName)
   {
      if (event .button !== 0)
         return;

      if (this .#lasso)
         return;

      event .preventDefault ();
      event .stopPropagation ();

      if (this .#output)
      {
         const
            executionContext = this .#output .node .getExecutionContext (),
            node             = this .getNode (id);

         // Add route.

         Editor .addRoute (executionContext, this .#output .node, this .#output .field .getName (), node, fieldName);

         this .clearInputOutput ();
      }
      else
      {
         const
            node             = this .getNode (id),
            field            = node .getField (fieldName),
            executionContext = node .getExecutionContext ();

         const
            offset                 = this .nodes .offset (),
            destinationNodeElement = this .nodes .find (`.node[node-id=${node .getId ()}]`),
            destinationElement     = destinationNodeElement .find (`.field[name="${field .getName ()}"] .input`),
            [toX, toY]             = this .getDestinationPosition (offset, destinationElement),
            scrollLeft             = this .nodes .scrollLeft (),
            scrollTop              = this .nodes .scrollTop ();

         this .#input = { node, field, toX: toX + scrollLeft, toY: toY + scrollTop };

         this .nodes .find (`.input, .field:not([type-name="${field .getTypeName ()}"]) .output`)
            .css ("visibility", "hidden");

         this .nodes .find (`.node:not([execution-context-id=${executionContext .getId ()}]) .output`)
            .css ("visibility", "hidden");
      }
   }

   selectOutput (event, id, fieldName)
   {
      if (event .button !== 0)
         return;

      if (this .#lasso)
         return;

      event .preventDefault ();
      event .stopPropagation ();

      if (this .#input)
      {
         const
            executionContext = this .#input .node .getExecutionContext (),
            node             = this .getNode (id);

         // Add route.

         Editor .addRoute (executionContext, node, fieldName, this .#input .node, this .#input .field .getName ());

         this .clearInputOutput ();
      }
      else
      {
         const
            node             = this .getNode (id),
            field            = node .getField (fieldName),
            executionContext = node .getExecutionContext ();

         const
            offset            = this .nodes .offset (),
            sourceNodeElement = this .nodes .find (`.node[node-id=${node .getId ()}]`),
            sourceElement     = sourceNodeElement .find (`.field[name="${field .getName ()}"] .output`),
            [fromX, fromY]    = this .getSourcePosition (offset, sourceElement),
            scrollLeft        = this .nodes .scrollLeft (),
            scrollTop         = this .nodes .scrollTop ();

         this .#output = { node, field, fromX: fromX + scrollLeft, fromY: fromY + scrollTop };

         this .nodes .find (`.field:not([type-name="${field .getTypeName ()}"]) .input, .output`)
            .css ("visibility", "hidden");

         this .nodes .find (`.node:not([execution-context-id=${executionContext .getId ()}]) .input`)
            .css ("visibility", "hidden");
      }
   }

   clearInputOutput ()
   {
      this .#input  = null;
      this .#output = null;

      this .nodes .find (`.input, .output`) .css ("visibility", "");

      this .requestUpdateCanvas ();
   }

   #pointer = new X3D .Vector2 ();

   mouseMove (event)
   {
      this .#pointer = this .getRelativePosition (event, false);

      this .requestUpdateCanvas ();
   }

   selectRoute (event, deleteRoute)
   {
      if (event .button !== 0)
         return;

      const
         active  = this .top .tabs ("option", "active"),
         pages   = this .pages,
         page    = pages [active],
         nodes   = new Set (page .nodes .map (node => this .getNode (node .id))),
         offset  = this .nodes .offset (),
         pointer = this .getRelativePosition (event, false);

      for (const sourceNode of nodes)
      {
         const sourceNodeElement = this .nodes .find (`.node[node-id=${sourceNode .getId ()}]`);

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
                  destinationNodeElement = this .nodes .find (`.node[node-id=${destinationNode .getId ()}]`),
                  destinationElement     = destinationNodeElement .find (`.field[name="${destinationField .getName ()}"] .input`);

               const
                  [fromX, fromY] = this .getSourcePosition (offset, sourceElement),
                  [toX, toY]     = this .getDestinationPosition (offset, destinationElement);

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

               const
                  arrowRotation = this .getBezierTangentAngle (x0, y0, x1, y1, x2, y2, x3, y3, 0.5),
                  arrow         = this .getRouteArrow (new X3D .Vector2 (x0, y0), new X3D .Vector2 (x3, y3), arrowRotation);

               if (X3D .Triangle2 .isPointInTriangle (pointer, ... arrow))
               {
                  if (deleteRoute)
                  {
                     Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);

                     this .removeRouteSelection (route);
                  }
                  else
                  {
                     if (event .shiftKey)
                     {
                        if (this .isRouteSelected (route))
                           this .removeRouteSelection (route);
                        else
                           this .addRouteSelection (route);
                     }
                     else
                     {
                        this .setRouteSelection (route);
                     }
                  }

                  // Only select or delete one route.
                  return;
               }
            }
         }
      }
   }

   deleteRoute (event)
   {
      this .selectRoute (event, true);
   }

   selectAllRoutes ()
   {
      const
         active = this .top .tabs ("option", "active"),
         pages  = this .pages,
         page   = pages [active],
         nodes  = new Set (page .nodes .map (node => this .getNode (node .id)));

      this .clearRouteSelection ();

      for (const sourceNode of nodes)
      {
         for (const sourceField of sourceNode .getFields ())
         {
            for (const route of sourceField .getOutputRoutes ())
            {
               const destinationNode = route .getDestinationNode ();

               if (!nodes .has (destinationNode))
                  continue;

               this .addRouteSelection (route);
            }
         }
      }
   }

   deleteSelectedRoutes ()
   {
      UndoManager .shared .beginUndo (_("Delete Selected Routes"));

      for (const route of this .#selectedRoutes)
      {
         Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);
      }

      UndoManager .shared .endUndo ();

      this .clearRouteSelection ();
   }

   #selectedRoutes = new Set ();

   addRouteSelection (route)
   {
      this .#selectedRoutes .add (route);

      this .requestUpdateCanvas ();
   }

   removeRouteSelection (route)
   {
      this .#selectedRoutes .delete (route);

      this .requestUpdateCanvas ();
   }

   setRouteSelection (route)
   {
      this .clearRouteSelection ();
      this .addRouteSelection (route);
   }

   clearRouteSelection ()
   {
      this .#selectedRoutes .clear ();

      this .requestUpdateCanvas ();
   }

   isRouteSelected (route)
   {
      return this .#selectedRoutes .has (route);
   }

   resizeCanvas ()
   {
      const contentScale = window .devicePixelRatio;

      this .topCanvas
         .prop ("width",  this .topCanvas .width  () * contentScale)
         .prop ("height", this .topCanvas .height () * contentScale);

      this .canvas
         .prop ("width",  this .canvas .width  () * contentScale)
         .prop ("height", this .canvas .height () * contentScale);

      this .overlay
         .prop ("width",  this .overlay .width  () * contentScale)
         .prop ("height", this .overlay .height () * contentScale);

      this .updateCanvas ();
   }

   #updateCanvasId;

   requestUpdateCanvas ()
   {
      clearTimeout (this .#updateCanvasId);

      this .#updateCanvasId = setTimeout (() => this .updateCanvas ());
   }

   updateCanvas ()
   {
      const
         context      = this .canvas [0] .getContext ("2d"),
         topContext   = this .topCanvas [0] .getContext ("2d"),
         width        = this .canvas .width (),
         height       = this .canvas .height (),
         offsetX      = this .nodes .scrollLeft (),
         offsetY      = this .nodes .scrollTop (),
         top          = this .topCanvas .height (),
         contentScale = window .devicePixelRatio;

      // Tabs

      topContext .save ();
      topContext .scale (contentScale, contentScale);

      this .drawGrid (topContext, width, top, offsetX, offsetY - top);

      topContext .restore ();

      // Routes

      context .save ();
      context .scale (contentScale, contentScale);

      this .drawGrid (context, width, height, offsetX, offsetY);
      this .drawRoutes (context);

      context .restore ();
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
         active     = this .top .tabs ("option", "active"),
         pages      = this .pages,
         page       = pages [active],
         nodes      = new Set (page .nodes .map (node => this .getNode (node .id))),
         offset     = this .nodes .offset (),
         scrollLeft = this .nodes .scrollLeft (),
         scrollTop  = this .nodes .scrollTop ();

      // DEBUG
      nodes .delete (undefined);

      const
         color         = this .#style .getPropertyValue ("--route-color"),
         selectedColor = this .#style .getPropertyValue ("--route-selected-color");

      context .lineWidth = 3;

      for (const sourceNode of nodes)
      {
         const sourceNodeElement = this .nodes .find (`.node[node-id=${sourceNode .getId ()}]`);

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
                  destinationNodeElement = this .nodes .find (`.node[node-id=${destinationNode .getId ()}]`),
                  destinationElement     = destinationNodeElement .find (`.field[name="${destinationField .getName ()}"] .input`);

               const
                  [fromX, fromY] = this .getSourcePosition (offset, sourceElement),
                  [toX, toY]     = this .getDestinationPosition (offset, destinationElement);

               if (this .isRouteSelected (route))
               {
                  context .fillStyle   = selectedColor;
                  context .strokeStyle = selectedColor;
               }
               else
               {
                  context .fillStyle   = color;
                  context .strokeStyle = color;
               }

					this .drawRoute (context, fromX, fromY, toX, toY, selectedColor);
            }
         }
      }

      context .fillStyle   = color;
      context .strokeStyle = color;

      if (this .#input)
         this .drawRoute (context, ... this .#pointer, this .#input .toX - scrollLeft, this .#input .toY - scrollTop);

      if (this .#output)
         this .drawRoute (context, this .#output .fromX - scrollLeft, this .#output .fromY - scrollTop, ... this .#pointer);
   }

   drawRoute (context, fromX, fromY, toX, toY, selectedColor)
   {
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

      const
         arrowRotation = this .getBezierTangentAngle (x0, y0, x1, y1, x2, y2, x3, y3, 0.5),
         arrow         = this .getRouteArrow (new X3D .Vector2 (x0, y0), new X3D .Vector2 (x3, y3), arrowRotation);

      if (selectedColor && X3D .Triangle2 .isPointInTriangle (this .#pointer, ... arrow))
         context .fillStyle = selectedColor;

      context .beginPath ();
      context .moveTo (arrow [0] .x, arrow [0] .y);
      context .lineTo (arrow [1] .x, arrow [1] .y);
      context .lineTo (arrow [2] .x, arrow [2] .y);
      context .fill ();
   }

   getRouteArrow (sourcePosition, destinationPosition, rotation)
   {
      // Intersect with arrow

      const
         p1 = new X3D .Vector2 (),
         p2 = new X3D .Vector2 (0, 14),
         p3 = new X3D .Vector2 (10 / 9 * 14, 7),
         c  = p1 .copy () .add (p2) .add (p3) .divide (3) .negate (),
         t  = sourcePosition .copy () .add (destinationPosition) .divide (2),
         m  = new X3D .Matrix3 ();

      m .translate (t);
      m .rotate (rotation);
      m .translate (c);

      return [m .multVecMatrix (p1), m .multVecMatrix (p2), m .multVecMatrix (p3)];
   }

   getBezierTangentAngle (x0, y0, x1, y1, x2, y2, x3, y3, t)
   {
      const mt = 1 - t;

      // Get coefficients for the first derivative of a cubic Bézier curve.
      const a = 3 * mt * mt;
      const b = 6 * mt * t;
      const c = 3 * t * t;

      // Calculate the tangent vector (dx, dy).
      const dx = a * (x1 - x0) + b * (x2 - x1) + c * (x3 - x2);
      const dy = a * (y1 - y0) + b * (y2 - y1) + c * (y3 - y2);

      // Return the angle in radians (-PI to PI).
      return Math .atan2 (dy, dx);
   }

   getSourcePosition (offset, sourceElement)
   {
      const
         sourceOffset = sourceElement .offset (),
         fromX        = sourceOffset .left - offset .left + sourceElement .width ()  / 2,
         fromY        = sourceOffset .top  - offset .top  + sourceElement .height () / 2;

      return [fromX, fromY];
   }

   getDestinationPosition (offset, destinationElement)
   {
      const
         destinationOffset = destinationElement .offset (),
         toX               = destinationOffset .left - offset .left + destinationElement .width ()  / 2,
         toY               = destinationOffset .top  - offset .top  + destinationElement .height () / 2;

      return [toX, toY];
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
            element  = $(`#${id}`),
            node     = this .outlineEditor .getNode (element),
            position = this .getRelativePosition (event, true);

         if (this .config .global .addConnectedNodes)
            this .addConnectedNodes (node, position);
         else
            this .addNode (node, position);
      }
   }

   getRelativePosition (event, scroll)
   {
      const
         bounds = this .nodes .offset (),
         x      = event .clientX - bounds .left + (scroll ? this .nodes .scrollLeft () : 0),
         y      = event .clientY - bounds .top  + (scroll ? this .nodes .scrollTop ()  : 0);

      return new X3D .Vector2 (x, y);
   }

   round (value, steps)
   {
      return Math .round (value / steps) * steps;
   }
};
