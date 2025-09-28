"use strict";

const
   $          = require ("jquery"),
   electron   = require ("electron"),
   util       = require ("util"),
   jstree     = require ("jstree"),
   X3D        = require ("../X3D"),
   Interface  = require ("../Application/Interface"),
   ActionKeys = require ("../Application/ActionKeys"),
   Traverse   = require ("x3d-traverse") (X3D),
   X3DUOM     = require ("../Bits/X3DUOM"),
   _          = require ("../Application/GetText");

const
   _expanded     = Symbol (),
   _fullExpanded = Symbol (),
   _changing     = Symbol ();

module .exports = class OutlineView extends Interface
{
   naturalCompare = new Intl .Collator (undefined, { numeric: true, sensitivity: "base" }) .compare;

   constructor (element)
   {
      super (`Sunrize.OutlineEditor.${element .attr ("id")}.`);

      this .outlineEditor     = element;
      this .objects           = new Map (); // <id, node>
      this .onDemandToolNodes = new Set ();

      this .config .global .setDefaultValues ({
         expandExternProtoDeclarations: true,
         expandPrototypeInstances: true,
         expandInlineNodes: true,
      });

      this .treeView = $("<div><div/>")
         .attr ("tabindex", "0")
         .addClass ("tree-view")
         .appendTo (this .outlineEditor);

      this .resizeObserver = new ResizeObserver (this .onresize .bind (this));

      this .resizeObserver .observe (this .treeView [0]);

      this .sceneGraph = $("<div><div/>")
         .addClass (["tree", "scene-graph", "scene"])
         .on ("dragenter dragover", this .onDragEnter .bind (this))
         .on ("dragleave dragend drop", this .onDragLeave .bind (this))
         .on ("drop", this .onDrop .bind (this))
         .on ("dragend", this .onDragEnd .bind (this))
      .appendTo (this .treeView);

      this .browser .getBrowserOptions () ._ColorSpace .addInterest ("updateSceneGraph", this);
      this .browser ._activeLayer .addInterest ("updateActiveLayer", this);

      electron .ipcRenderer .on ("deselect-all",            () => this .deselectAll ());
      electron .ipcRenderer .on ("hide-unselected-objects", () => this .hideUnselectedObjects ());
      electron .ipcRenderer .on ("show-selected-objects",   () => this .showSelectedObjects ());
      electron .ipcRenderer .on ("show-all-objects",        () => this .showAllObjects ());

      electron .ipcRenderer .on ("expand-extern-proto-declarations", (event, value) => this .expandExternProtoDeclarations = value);
      electron .ipcRenderer .on ("expand-prototype-instances",       (event, value) => this .expandPrototypeInstances      = value);
      electron .ipcRenderer .on ("expand-inline-nodes",              (event, value) => this .expandInlineNodes             = value);

      electron .ipcRenderer .on ("close", () => this .saveExpanded (this .config .file));
      $(window)             .on ("close", () => this .saveExpanded (this .config .file));
   }

   get expandExternProtoDeclarations ()
   {
      return this .config .global .expandExternProtoDeclarations;
   }

   set expandExternProtoDeclarations (value)
   {
      this .config .global .expandExternProtoDeclarations = value;
      this .updateSceneGraph ();
   }

   get expandPrototypeInstances ()
   {
      return this .config .global .expandPrototypeInstances;
   }

   set expandPrototypeInstances (value)
   {
      this .config .global .expandPrototypeInstances = value;
      this .updateSceneGraph ();
   }

   get expandInlineNodes ()
   {
      return this .config .global .expandInlineNodes;
   }

   set expandInlineNodes (value)
   {
      this .config .global .expandInlineNodes = value;
      this .updateSceneGraph ();
   }

   get autoExpandMaxChildren ()
   {
      return 30;
   }

   accessTypes = {
      [X3D .X3DConstants .initializeOnly]: "initializeOnly",
      [X3D .X3DConstants .inputOnly]:      "inputOnly",
      [X3D .X3DConstants .outputOnly]:     "outputOnly",
      [X3D .X3DConstants .inputOutput]:    "inputOutput",
   };

   configure ()
   {
      if (this .executionContext)
      {
         this .saveExpanded (this .config .last);
         this .removeSubtree (this .sceneGraph);

         this .executionContext .profile_changed .removeInterest ("updateComponents", this);
         this .executionContext .components      .removeInterest ("updateComponents", this);
      }

      this .executionContext = this .browser .currentScene;

      this .executionContext .profile_changed .addInterest ("updateComponents", this);
      this .executionContext .components      .addInterest ("updateComponents", this);

      this .updateComponents ();

      // Clear tree.

      this .objects .clear ();
      this .objects .set (this .executionContext .getId (), this .executionContext);
      this .sceneGraph .empty ();
      this .sceneGraph .attr ("node-id", this .executionContext .getId ());

      // Expand scene.

      this .expandScene (this .sceneGraph, this .executionContext);
      this .restoreExpanded ();
   }

   updateComponents ()
   {
      this .onDemandToolNodes = new Set ([
         X3D .X3DConstants .DirectionalLight,
         X3D .X3DConstants .ListenerPointSource,
         X3D .X3DConstants .PointLight,
         X3D .X3DConstants .SpotLight,
         X3D .X3DConstants .Sound,
         X3D .X3DConstants .SpatialSound,
         X3D .X3DConstants .ViewpointGroup,
         X3D .X3DConstants .X3DEnvironmentalSensorNode,
         X3D .X3DConstants .X3DTextureProjectorNode,
         X3D .X3DConstants .X3DViewpointNode,
      ]);
   }

   updateSceneGraph ()
   {
      this .updateScene (this .sceneGraph, this .executionContext);
   }

   updateScene (parent, scene)
   {
      if (!parent .prop ("isConnected"))
         return;

      this .saveScrollPositions ();
      this .saveExpanded (this .config .file);
      this .removeSubtree (parent);
      this .expandScene (parent, scene);
      this .restoreExpanded ();
      this .restoreScrollPositions ();
   }

   expandScene (parent, scene)
   {
      parent
         .data ("expanded",      true)
         .data ("full-expanded", false);

      if (scene instanceof X3D .X3DScene)
         scene .units .addInterest ("updateScene", this, parent, scene);

      // Generate subtrees.

      const
         externprotos  = this .expandSceneExternProtoDeclarations (parent, scene),
         protos        = this .expandSceneProtoDeclarations       (parent, scene),
         rootNodes     = this .expandSceneRootNodes               (parent, scene),
         importedNodes = this .expandSceneImportedNodes           (parent, scene),
         exportedNodes = this .expandSceneExportedNodes           (parent, scene);

      if (!externprotos .is (":empty") || !protos .is (":empty") || !rootNodes .is (":empty") || !importedNodes .is (":empty") || !exportedNodes .is (":empty"))
      {
         return;
      }

      // Add empty scene.

      const child = $("<div></div>")
         .addClass (["empty-scene", "subtree"]);

      const ul = $("<ul></ul>")
         .appendTo (child);

      $("<li></li>")
         .addClass (["empty-scene", "description", "no-select"])
         .text ("Empty Scene")
         .appendTo (ul);

      this .connectSceneSubtree (parent, child);
   }

   connectSceneSubtree (parent, child)
   {
      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .appendTo (parent)
         .hide ();

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")
            .on ("click", this .selectNone .bind (this));

      child .find (".externproto, .proto, .node, .imported-node, .exported-node")
         .on ("dblclick", this .activateNode .bind (this));

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this));

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>");

      // Connect actions.

      this .connectNodeActions (parent, child);

      // Expand children.

      const
         specialElements = child .find (".externproto, .proto, .imported-node, .exported-node"),
         elements        = child .find (".node");

      child .show ();
      this .expandSceneSubtreeComplete (specialElements, elements);
   }

   connectNodeActions (parent, child)
   {
      if (this .isEditable (parent))
      {
         child .find (".externproto > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartExternProto .bind (this));

         child .find (".proto > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartProto .bind (this));

         if (this .getField (parent) ?.getAccessType () !== X3D .X3DConstants .outputOnly)
         {
            child .find (".node  > .item")
               .attr ("draggable", "true")
               .on ("dragstart", this .onDragStartNode .bind (this));
         }
      }

      child .find (".externproto .name, .externproto .icon, .proto .name, .proto .icon, .node .name, .node .icon")
         .on ("click", this .selectNode .bind (this))
         .on ("mouseenter", this .updateNodeTitle .bind (this));

      child .find ("[action]")
         .on ("click", this .nodeAction .bind (this));
   }

   nodeAction (event)
   {
      const button = $(event .target);

      switch (button .attr ("action"))
      {
         case "toggle-visibility":
            this .toggleVisibility (event);
            break;

         case "toggle-tool":
            this .toggleTool (event);
            break;

         case "proxy-display":
            this .proxyDisplay (event);
            break;

         case "activate-layer":
            this .activateLayer (event);
            break;

         case "bind-node":
            this .bindNode (event);
            break;

         case "play-node":
            this .playNode (event);
            break;

         case "stop-node":
            this .stopNode (event);
            break;

         case "loop-node":
            this .loopNode (event);
            break;

         case "reload-node":
            this .reloadNode (event);
            break;

         case "show-preview":
            this .showPreview (event);
            break;

         case "show-branch":
            this .showBranch (event);
            break;
      }
   }

   connectFieldActions (child)
   {
      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "input"))
         .on ("click", this .selectSingleConnector .bind (this, "input"));

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "output"))
         .on ("click", this .selectSingleConnector .bind (this, "output"));

      child .find ("area.input-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "input"));

      child .find ("area.output-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "output"));
   }

   expandSceneSubtreeComplete (specialElements, elements)
   {
      this .requestUpdateRouteGraph ();

      // Reopen externprotos, protos, imported, exported nodes.

      for (const e of specialElements)
      {
         const
            element = $(e),
            node    = this .getNode (element);

         if (node ?.getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .jstree ("open_node", element);
         }
      }

      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element);

         if (node ?.getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .data ("auto-expand", true);
            element .jstree ("open_node", element);
         }
      }
   }

   updateSceneSubtree (parent, scene, type, func)
   {
      if (scene .externprotos .length || scene .protos .length || scene .rootNodes .length)
      {
         this .saveScrollPositions ();

         const oldSubtree = parent .find (`> .${type}.subtree`);

         this .disconnectSubtree (oldSubtree);

         const newSubtree = this [func] (parent, scene);

         oldSubtree .replaceWith (newSubtree .detach ());

         parent .find ("> .empty-scene.subtree") .detach ();

         this .restoreScrollPositions ();
      }
      else
      {
         this .updateScene (parent, scene);
      }
   }

   expandSceneExternProtoDeclarations (parent, scene)
   {
      scene .externprotos .addInterest ("updateSceneSubtree", this, parent, scene, "externprotos", "expandSceneExternProtoDeclarations");

      const child = $("<div></div>")
         .addClass (["externprotos", "subtree"]);

      if (!scene .externprotos .length)
         return child .appendTo (parent);

      const ul = $("<ul></ul>")
         .appendTo (child);

      $("<li></li>")
         .addClass (["externprotos", "description", "no-select"])
         .text ("Extern Prototypes")
         .appendTo (ul);

      let index = 0;

      for (const externproto of scene .externprotos)
         ul .append (this .createNodeElement ("externproto", parent, externproto, index ++));

      this .connectSceneSubtree (parent, child);

      return child;
   }

   expandSceneProtoDeclarations (parent, scene)
   {
      scene .protos .addInterest ("updateSceneSubtree", this, parent, scene, "protos", "expandSceneProtoDeclarations");

      const child = $("<div></div>")
         .addClass (["protos", "subtree"]);

      if (!scene .protos .length)
         return child .appendTo (parent);

      const ul = $("<ul></ul>")
         .appendTo (child);

      $("<li></li>")
         .addClass (["protos", "description", "no-select"])
         .text ("Prototypes")
         .appendTo (ul);

      let index = 0;

      for (const proto of scene .protos)
         ul .append (this .createNodeElement ("proto", parent, proto, index ++));

      this .connectSceneSubtree (parent, child);

      return child;
   }

   #updateSceneRootNodesSymbol = Symbol ();

   expandSceneRootNodes (parent, scene)
   {
      scene .rootNodes .addFieldCallback (this .#updateSceneRootNodesSymbol, this .updateSceneRootNodes .bind (this, parent, scene, "root-nodes", "expandSceneRootNodes"));

      parent .attr ("index", scene .rootNodes .length);

      const child = $("<div></div>")
         .addClass (["root-nodes", "subtree"]);

      if (!scene .rootNodes .length)
         return child .appendTo (parent);

      const ul = $("<ul></ul>")
         .appendTo (child);

      $("<li></li>")
         .addClass (["root-nodes", "description", "no-select"])
         .text ("Root Nodes")
         .appendTo (ul);

      let index = 0;

      for (const rootNode of scene .rootNodes)
         ul .append (this .createNodeElement ("node", parent, rootNode ? rootNode .getValue () : null, index ++));

      // Added to prevent bug, that last route is not drawn right.
      $("<li></li>")
         .addClass (["last", "no-select"])
         .appendTo (ul);

      this .connectSceneSubtree (parent, child);

      return child;
   }

   updateSceneRootNodes (parent, scene, type, func)
   {
      for (const node of scene .rootNodes)
      {
         if (!node ?.getNodeUserData (_changing))
            continue;

         const nodes = Array .from (scene .rootNodes);

         this .browser .nextFrame ()
            .then (() => nodes .forEach (node => node ?.setNodeUserData (_changing, false)));

         return;
      }

      this .updateSceneSubtree (parent, scene, type, func);
   }

   expandSceneImportedNodes (parent, scene)
   {
      scene .importedNodes .addInterest ("updateSceneSubtree", this, parent, scene, "imported-nodes", "expandSceneImportedNodes");

      const child = $("<div></div>")
         .addClass (["imported-nodes", "subtree"]);

      if (!scene .importedNodes .length)
         return child .appendTo (parent);

      const importedNodes = Array .from (scene .importedNodes) .sort ((a, b) =>
      {
         return this .naturalCompare (a .getImportedName (), b .getImportedName ());
      });

      const ul = $("<ul></ul>")
         .appendTo (child);

      $("<li></li>")
         .addClass (["imported-nodes", "description", "no-select"])
         .text ("Imported Nodes")
         .appendTo (ul);

      for (const importedNode of importedNodes)
         ul .append (this .createImportedNodeElement ("imported-node", parent, scene, importedNode));

      // Added to prevent bug, that last route is not drawn right.
      $("<li></li>")
         .addClass (["last", "no-select"])
         .appendTo (ul);

      this .connectSceneSubtree (parent, child);

      return child;
   }

   expandSceneExportedNodes (parent, scene)
   {
      if (!(scene instanceof X3D .X3DScene))
         return $("<div></div>")

      const child = $("<div></div>")
         .addClass (["exported-nodes", "subtree"])

      scene .exportedNodes .addInterest ("updateSceneSubtree", this, parent, scene, "exported-nodes", "expandSceneExportedNodes")

      if (!scene .exportedNodes .length)
         return child .appendTo (parent)

      const exportedNodes = Array .from (scene .exportedNodes) .sort ((a, b) =>
      {
         return this .naturalCompare (a .getExportedName (), b .getExportedName ())
      })
      .sort ((a, b) =>
      {
         return this .naturalCompare (a .getLocalNode () .getTypeName (), b .getLocalNode () .getTypeName ())
      })

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["exported-nodes", "description", "no-select"])
         .text ("Exported Nodes")
         .appendTo (ul)

      for (const exportedNode of exportedNodes)
      {
         ul .append (this .createExportedNodeElement ("exported-node", parent, exportedNode) .prop ("outerHTML"))
      }

      // Added to prevent bug, that last route is not drawn right.
      $("<li></li>")
         .addClass (["last", "no-select"])
         .appendTo (ul)

      this .connectSceneSubtree (parent, child)

      return child
   }

   createSceneElement (scene, typeName, classes)
   {
      this .objects .set (scene .getId (), scene)

      // Scene

      const child = $("<li></li>")
         .addClass ("scene")
         .addClass (classes)
         .attr ("node-id", scene .getId ())

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("src", "../images/OutlineEditor/Node/X3DExecutionContext.svg")
         .appendTo (child)

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child)

      $("<span></span>")
         .addClass ("field-name")
         .text (typeName)
         .appendTo (name)

      // Append empty tree to enable expander.

      $("<ul><li></li></ul>") .appendTo (child)

      return child
   }

   updateNode (parent, node, full)
   {
      if (!parent .prop ("isConnected"))
         return;

      this .saveScrollPositions ();

      this .removeSubtree (parent);
      this .expandNode (parent, node, full);

      this .restoreScrollPositions ();
   }

   #updateNodeSymbol = Symbol ();

   expandNode (parent, node, full)
   {
      parent
         .data ("expanded",      true)
         .data ("full-expanded", full);

      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree");

      const ul = $("<ul></ul>")
         .appendTo (child);

      // Fields

      let fields = full ? node .getFields () : node .getChangedFields (true);

      if (!fields .length)
         fields = node .getFields ();

      if (node .canUserDefinedFields ())
      {
         // Move user-defined fields on top.

         const userDefinedFields = node .getUserDefinedFields ();

         fields .sort ((a, b) =>
         {
            const
               ua = userDefinedFields .get (a .getName ()) === a,
               ub = userDefinedFields .get (b .getName ()) === b;

            return ub - ua;
         });

         // Move metadata field on top.

         fields .sort ((a, b) =>
         {
            const
               ma = a === node ._metadata,
               mb = b === node ._metadata;

            return mb - ma;
         });

         // Proto fields, user-defined fields.
         // Instances are updated, because they completely change.

         node .getPredefinedFields ()  .addInterest ("updateNode", this, parent, node, full);
         node .getUserDefinedFields () .addInterest ("updateNode", this, parent, node, full);
      }

      for (const field of fields)
         ul .append (this .createFieldElement (parent, node, field));

      // Extern proto

      if (parent .hasClass ("externproto"))
      {
         // URL

         ul .append (this .createFieldElement (parent, node, node ._url, "special"));

         // Proto

         node .getLoadState () .addFieldCallback (this .#updateNodeSymbol, this .updateNode .bind (this, parent, node, full));

         if (this .expandExternProtoDeclarations && node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE)
            ul .append (this .createNodeElement ("proto", parent, node .getProtoDeclaration ()));
         else
            ul .append (this .createLoadStateElement (node .checkLoadState (), "Extern Prototype"));
      }

      // Proto Body or Instance Body

      if (node instanceof X3D .X3DProtoDeclaration)
      {
         ul .append (this .createSceneElement (node .getBody (), "Body", "proto-scene"));
      }
      else if (this .expandPrototypeInstances && node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
      {
         if (node .getBody ())
            ul .append (this .createSceneElement (node .getBody (), "Body", "instance-scene"));
         else if (node .getProtoNode () .isExternProto)
            ul .append (this .createLoadStateElement (node .getProtoNode () .checkLoadState (), node .getTypeName ()));
      }

      // X3DUrlObject scene or load state

      if (parent .is (".node, .imported-node, .exported-node") && node .getType () .includes (X3D .X3DConstants .X3DUrlObject))
      {
         // X3DUrlObject

         if (node .getType () .includes (X3D .X3DConstants .Inline))
         {
            node .getLoadState () .addFieldCallback (this .#updateNodeSymbol, this .updateNode .bind (this, parent, node, full));
         }
         else
         {
            node .getLoadState () .addFieldCallback (this .#updateNodeSymbol, this .updateFieldLoadState .bind (this, node));
         }

         if (node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE && this .expandInlineNodes && node .getType () .includes (X3D .X3DConstants .Inline))
         {
            ul .append (this .createSceneElement (node .getInternalScene (), "Scene", "internal-scene"))
         }
         else
         {
            ul .append (this .createLoadStateElement (node .checkLoadState (), node .getTypeName ()) .addClass (`load-state-${node .getId ()}`));
         }
      }

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .fieldBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .fieldCloseNode .bind (this))
         .appendTo (parent)
         .hide ();

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")
            .on ("click", this .selectNone .bind (this));

      child .find ("li")
         .on ("dblclick", this .activateField .bind (this));

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this));

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>");

      child .find (".field .name, .field .icon, .special .name, .special .icon")
         .on ("click", this .selectField .bind (this))

      child .find (".field .name, .special .name")
         .on ("mouseenter", this .updateFieldTitle .bind (this));

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutConnector .bind (this, "input"))
         .on ("click", this .selectConnector .bind (this, "input"));

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutConnector .bind (this, "output"))
         .on ("click", this .selectConnector .bind (this, "output"));

      child .find ("area.input-routes-selector")
         .on ("click", this .selectRoutes .bind (this, "input"));

      child .find ("area.output-routes-selector")
         .on ("click", this .selectRoutes .bind (this, "output"));

      if (this .isEditable (parent))
      {
         child .find (".field > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartField .bind (this));
      }

      // Add special field buttons.

      this .addFieldButtons (parent, child, node);

      // Expand children.

      const
         protos   = child .find (".proto"),
         scenes   = child .find (".scene"),
         elements = child .find (".field, .special");

      child .show ();
      this .expandNodeComplete (protos, scenes, elements);
   }

   expandNodeComplete (protos, scenes, elements)
   {
      this .requestUpdateRouteGraph ()

      // Auto expand SFNodes

      for (const e of elements .filter ("li[type-name=SFNode]"))
      {
         const
            element = $(e),
            field   = this .getField (element)

         if (field .getValue ())
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }

      // Auto expand MFNodes

      for (const e of elements .filter ("li[type-name=MFNode]"))
      {
         const
            element = $(e),
            field   = this .getField (element)

         if (field .length && field .length <= this .autoExpandMaxChildren)
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }

      // Reopen protos.

      for (const e of protos)
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (node .getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .jstree ("open_node", element)
         }
      }

      // Reopen scenes.

      for (const e of scenes)
      {
         const
            element = $(e),
            scene   = this .getNode (element)

         if (scene .getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }

      // Reopen fields.

      for (const e of elements)
      {
         const
            element = $(e),
            field   = this .getField (element)

         if (field .getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }
   }

   updateFieldLoadState (node)
   {
      const [className, description] = this .getLoadState (node .checkLoadState (), node .getTypeName ());

      this .sceneGraph .find (`.load-state-${node .getId ()}`)
         .removeClass (["not-started-state", "in-progress-state", "complete-state", "failed-state"])
         .addClass (className)
         .find (".load-state-text")
         .text (description);
   }

   createLoadStateElement (loadState, typeName)
   {
      const [className, description] = this .getLoadState (loadState, typeName);

      return $("<li></li>")
         .addClass (["description", "load-state", className, "no-select"])
         .append ($("<span></span>") .addClass ("load-state-text") .text (description));
   }

   getLoadState (loadState, typeName)
   {
      switch (loadState)
      {
         case X3D .X3DConstants .NOT_STARTED_STATE:
            return ["not-started-state", util .format (_("Loading %s not started."), typeName)];
         case X3D .X3DConstants .IN_PROGRESS_STATE:
            return ["in-progress-state", util .format (_("Loading %s in progress."), typeName)];
         case X3D .X3DConstants .COMPLETE_STATE:
            return ["complete-state", util .format (_("Loading %s completed."), typeName)];
         case X3D .X3DConstants .FAILED_STATE:
            return ["failed-state", util .format (_("Loading %s failed."), typeName)];
      }
   }

   #nodeSymbol                = Symbol ();
   #updateNodeBoundSymbol     = Symbol ();
   #updateNodeLoadStateSymbol = Symbol ();
   #updateNodePlaySymbol      = Symbol ();

   createNodeElement (type, parent, node, index)
   {
      if (node)
      {
         if (!node .isInitialized ())
         {
            // Setup nodes in protos, disable some init functions.

            for (const type of node .getType ())
            {
               switch (type)
               {
                  case X3D .X3DConstants .Script:
                     node .initialize__ = Function .prototype;
                     break;
                  case X3D .X3DConstants .X3DTimeDependentNode:
                     node .set_start = Function .prototype;
                     break;
               }
            }

            node .setup ();
         }

         this .objects .set (node .getId (), node .valueOf ());

         node .setUserData (_changing, false);

         // These fields are observed and must never be disconnected, because clones would also lose connection.

         node .typeName_changed .addFieldCallback (this .#nodeSymbol, this .updateNodeTypeName .bind (this, node));
         node .name_changed     .addFieldCallback (this .#nodeSymbol, this .updateNodeName     .bind (this, node));
         node .parents_changed  .addFieldCallback (this .#nodeSymbol, this .updateCloneCount   .bind (this, node));
      }

      // Classes

      const classes = [type];

      if (node)
      {
         const selection = require ("../Application/Selection");

         if (selection .has (node))
            classes .push ("selected");

         if (this .isInParents (parent, node))
            classes .push ("circular-reference", "no-expand");
      }
      else
      {
         classes .push ("no-expand");
      }

      // Node

      const child = $("<li></li>")
         .addClass (classes)
         .attr ("node-id", node ? node .getId () : "NULL")
         .attr ("index", index);

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons .get (type)}.svg`)
         .appendTo (child);

      if (node)
      {
         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child);

         $("<span></span>")
            .addClass ("node-type-name")
            .text (this .typeNames .get (node .getTypeName ()) ?? node .getTypeName ())
            .appendTo (name);

         name .append (document .createTextNode (" "));

         $("<span></span>")
            .addClass ("node-name")
            .text (node .getDisplayName ())
            .appendTo (name);

         name .append (document .createTextNode (" "));

         const cloneCount = node .getCloneCount ?.() ?? 0

         $("<span></span>")
            .addClass ("clone-count")
            .text (cloneCount > 1 ? `[${cloneCount}]` : "")
            .appendTo (name);

         // Add buttons to name.

         this .addNodeButtons (this .getNode (parent), node, name);

         // Append empty tree to enable expander.

         if (!this .isInParents (parent, node))
            $("<ul><li></li></ul>") .appendTo (child);
      }
      else
      {
         $("<div></div>")
            .addClass ("name")
            .append ($("<span></span>") .addClass ("node-type-name") .text ("NULL"))
            .appendTo (child);
      }

      return child;
   }

   addNodeButtons (parent, node, name)
   {
      // Add buttons to name.

      const buttons = [ ];

      if (!(node .getExecutionContext () .getOuterNode () instanceof X3D .X3DProtoDeclaration))
      {
         if (node .setHidden)
         {
            buttons .push ($("<span></span>")
               .attr ("order", "0")
               .attr ("title", "Toggle visibility.")
               .attr ("action", "toggle-visibility")
               .addClass (["button", "material-symbols-outlined"])
               .addClass (node .isHidden () ? "off" : "on")
               .text (node .isHidden () ? "visibility_off" : "visibility"));
         }

         if (node .getType () .some (type => this .onDemandToolNodes .has (type)))
         {
            buttons .push ($("<span></span>")
               .attr ("order", "1")
               .attr ("title", _("Toggle display tool."))
               .attr ("action", "toggle-tool")
               .addClass (["button", "material-symbols-outlined"])
               .addClass (node .valueOf () === node ? "off" : "on")
               .text ("build_circle"));
         }
      }

      for (const type of node .getType ())
      {
         switch (type)
         {
            case X3D .X3DConstants .Collision:
            {
               buttons .push ($("<span></span>")
                  .attr ("order", "2")
                  .attr ("title", _("Display proxy node."))
                  .attr ("action", "proxy-display")
                  .addClass (["button", "material-symbols-outlined"])
                  .addClass (node .getProxyDisplay () ? "on" : "off")
                  .text ("highlight_mouse_cursor"));

               break;
            }
            case X3D .X3DConstants .X3DLayerNode:
            {
               if (node .getExecutionContext () !== this .executionContext)
                  continue;

               buttons .push ($("<span></span>")
                  .attr ("order", "3")
                  .attr ("title", _("Activate layer."))
                  .attr ("action", "activate-layer")
                  .addClass (["button", "material-symbols-outlined"])
                  .addClass (this .browser .getActiveLayer () === node ? "on" : "off")
                  .text ("check_circle"));

               continue;
            }
            case X3D .X3DConstants .X3DBindableNode:
            {
               if (node .getExecutionContext () .getOuterNode () instanceof X3D .X3DProtoDeclaration)
                  continue;

               node ._isBound .addFieldCallback (this .#updateNodeBoundSymbol, this .updateNodeBound .bind (this, node));

               buttons .push ($("<span></span>")
                  .attr ("order", "4")
                  .attr ("title", _("Bind node."))
                  .attr ("action", "bind-node")
                  .addClass (["button", "material-symbols-outlined"])
                  .addClass (node ._isBound .getValue () ? "on" : "off")
                  .text (node ._isBound .getValue () ? "radio_button_checked" : "radio_button_unchecked"));

               continue;
            }
            case X3D .X3DConstants .X3DTimeDependentNode:
            {
               if (node .getExecutionContext () !== this .executionContext)
                  continue;

               node ._enabled  .addFieldCallback (this .#updateNodePlaySymbol, this .updateNodePlay .bind (this, node));
               node ._isActive .addFieldCallback (this .#updateNodePlaySymbol, this .updateNodePlay .bind (this, node));
               node ._isPaused .addFieldCallback (this .#updateNodePlaySymbol, this .updateNodePlay .bind (this, node));
               node ._loop     .addFieldCallback (this .#updateNodePlaySymbol, this .updateNodePlay .bind (this, node));

               buttons .push ($("<span></span>")
                  .attr ("order", "5")
                  .attr ("title", node ._isActive .getValue () && !node ._isPaused .getValue () ? _("Pause timer.") : _("Start timer."))
                  .attr ("action", "play-node")
                  .addClass (["button", "material-icons"])
                  .addClass (node ._isPaused .getValue () ? "on" : "off")
                  .text (node ._isActive .getValue () ? "pause" : "play_arrow"));

               buttons .push ($("<span></span>")
                  .attr ("order", "6")
                  .attr ("title", _("Stop timer."))
                  .attr ("action", "stop-node")
                  .addClass (["button", "material-icons"])
                  .addClass (node ._isActive .getValue () ? "on" : "off")
                  .text ("stop"));

               buttons .push ($("<span></span>")
                  .attr ("order", "7")
                  .attr ("title", _("Toggle loop."))
                  .attr ("action", "loop-node")
                  .addClass (["button", "material-icons"])
                  .addClass (node ._loop .getValue () ? "on" : "off")
                  .text ("repeat"));

               if (!node ._enabled .getValue ())
                  buttons .slice (-3) .forEach (button => button .hide ());

               continue;
            }
            case X3D .X3DConstants .X3DUrlObject:
            {
               if (node .getExecutionContext () .getOuterNode () instanceof X3D .X3DProtoDeclaration)
               {
                  if (!node .getType () .includes (X3D .X3DConstants .Inline))
                     continue;
               }

               const [className] = this .getLoadState (node .checkLoadState (), node .getTypeName ());

               node .getLoadState () .addFieldCallback (this .#updateNodeLoadStateSymbol, this .updateNodeLoadState .bind (this, node));

               buttons .push ($("<span></span>")
                  .attr ("order", "8")
                  .attr ("title", "Load now.")
                  .attr ("action", "reload-node")
                  .addClass (["button", "material-symbols-outlined", className])
                  .text ("autorenew"));

               continue;
            }
            case X3D .X3DConstants .AudioClip:
            case X3D .X3DConstants .BufferAudioSource:
            case X3D .X3DConstants .X3DMaterialNode:
            case X3D .X3DConstants .X3DSingleTextureNode:
            {
               buttons .push ($("<span></span>")
                  .attr ("order", "9")
                  .attr ("title", _("Show preview."))
                  .attr ("action", "show-preview")
                  .addClass (["button", "material-symbols-outlined", "off"])
                  .css ("top", "2px")
                  .text ("preview"));

               continue;
            }
         }
      }

      for (const type of parent .getType ())
      {
         switch (type)
         {
            case X3D .X3DConstants .LOD:
            case X3D .X3DConstants .Switch:
            {
               buttons .push ($("<span></span>")
                  .attr ("order", "10")
                  .attr ("title", _("Show branch."))
                  .attr ("action", "show-branch")
                  .addClass (["button", "material-symbols-outlined"])
                  .addClass (parent .getEditChild () === node ? "on" : "off")
                  .text ("highlight_mouse_cursor"));

               break;
            }
         }
      }

      buttons .sort ((a, b) => a .attr ("order") - b .attr ("order"))

      for (const button of buttons)
      {
         name .append (document .createTextNode (" "));
         name .append (button);
      }
   }

   updateNodeTypeName (node)
   {
      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}], .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item .node-type-name")
         .text (node .getTypeName ())
   }

   updateNodeName (node)
   {
      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}], .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item .node-name")
         .text (node .getDisplayName ())
   }

   updateExportedNodeName (exportedNode)
   {
      const
         node = exportedNode .getLocalNode (),
         name = this .sceneGraph .find (`.exported-node[node-id=${node .getId ()}]`) .find ("> .item .name");

      name .find (".node-name") .text (node .getName ());
      name .find (".as-name") .text (exportedNode .getExportedName ());

      if (exportedNode .getExportedName () === node .getName ())
         name .find (".node-name") .nextAll () .hide ();
      else
         name .find (".node-name") .nextAll () .show ();
   }

   updateCloneCount (node)
   {
      const cloneCount = node .getCloneCount ?.() ?? 0

      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}]`)
         .find ("> .item .clone-count")
         .text (cloneCount > 1 ? `[${cloneCount}]` : "")
   }

   updateActiveLayer ()
   {
      const node = this .browser .getActiveLayer ();

      this .sceneGraph .find ("[action=activate-layer]") .addClass ("off");

      if (!node)
         return;

      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=activate-layer]")
         .removeClass ("off")
         .addClass ("on");
   }

   updateNodeBound (node)
   {
      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=bind-node]")
         .removeClass (["on", "off"])
         .addClass (node ._isBound .getValue () ? "on" : "off")
         .text (node ._isBound .getValue () ? "radio_button_checked" : "radio_button_unchecked");
   }

   updateNodeLoadState (node)
   {
      const [className] = this .getLoadState (node .checkLoadState (), node .getTypeName ());

      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}],
         .externproto[node-id=${node .getId ()}]`)
         .find ("> .item .reload-node")
         .removeClass (["not-started-state", "in-progress-state", "complete-state", "failed-state"])
         .addClass (className);
   }

   updateNodePlay (node)
   {
      const buttons = [ ];

      buttons .push (this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=play-node]")
         .removeClass (["on", "off"])
         .addClass (node ._isPaused .getValue () ? "on" : "off")
         .attr ("title", node ._isActive .getValue () && !node ._isPaused .getValue () ? _("Pause timer.") : _("Start timer."))
         .text (node ._isActive .getValue () ? "pause" : "play_arrow"));

      buttons .push (this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=stop-node]")
         .removeClass (["on", "off"])
         .addClass (node ._isActive .getValue () ? "on" : "off"));

      buttons .push (this .sceneGraph
         .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=loop-node]")
         .removeClass (["on", "off"])
         .addClass (node ._loop .getValue () ? "on" : "off"));

      if (node ._enabled .getValue ())
         buttons .slice (-3) .forEach (button => button .show ());
      else
         buttons .slice (-3) .forEach (button => button .hide ());

      if (!node ._isActive .getValue ())
         node ._evenLive = false;
   }

   isInParents (parent, node)
   {
      return parent .closest (`.node[node-id=${node .getId ()}]`, this .sceneGraph) .length;
   }

   #importedNodeSymbol = Symbol ();

   createImportedNodeElement (type, parent, scene, importedNode)
   {
      importedNode .getInlineNode () .getLoadState () .addFieldCallback (this .#importedNodeSymbol, this .updateScene .bind (this, parent, scene));

      try
      {
         this .objects .set (importedNode .getId (), importedNode);
         this .objects .set (importedNode .getExportedNode () .getId (), importedNode .getExportedNode ());

         // Node

         const child = $("<li></li>")
            .addClass (type)
            .attr ("imported-node-id", importedNode .getId ())
            .attr ("node-id", importedNode .getExportedNode () .getId ());

         // Icon

         const icon = $("<img></img>")
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons .get (type)}.svg`)
            .appendTo (child);

         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child);

         $("<span></span>")
            .addClass ("node-type-name")
            .text (importedNode .getExportedNode () .getTypeName ())
            .appendTo (name);

         name .append (document .createTextNode (" "));

         $("<span></span>")
            .addClass ("node-name")
            .text (importedNode .getExportedName ())
            .appendTo (name);

         if (importedNode .getExportedName () !== importedNode .getImportedName ())
         {
            name
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as") .text ("AS"))
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as-name") .text (importedNode .getImportedName ()));
         }

         // Add buttons to name.

         this .addNodeButtons (this .getNode (parent), importedNode .getExportedNode (), name);

         // Append empty tree to enable expander.

         $("<ul><li></li></ul>") .appendTo (child);

         return child;
      }
      catch
      {
         this .objects .set (importedNode .getId (), importedNode);

         // Node

         const child = $("<li></li>")
            .addClass ([type, "no-expand"])
            .attr ("imported-node-id", importedNode .getId ());

         // Icon

         const icon = $("<img></img>")
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons .get (type)}.svg`)
            .appendTo (child);

         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child);

         $("<span></span>")
            .addClass ("node-name")
            .text (importedNode .getExportedName ())
            .appendTo (name);

         if (importedNode .getExportedName () !== importedNode .getImportedName ())
         {
            name
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as") .text ("AS"))
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as-name") .text (importedNode .getImportedName ()));
         }

         return child;
      }
   }

   #exportedNodeSymbol = Symbol ();

   createExportedNodeElement (type, parent, exportedNode)
   {
      const node = exportedNode .getLocalNode ();

      this .objects .set (exportedNode .getId (), exportedNode);
      this .objects .set (node .getId (), node .valueOf ());

      node .typeName_changed .addFieldCallback (this .#exportedNodeSymbol, this .updateNodeTypeName     .bind (this, node));
      node .name_changed     .addFieldCallback (this .#exportedNodeSymbol, this .updateExportedNodeName .bind (this, exportedNode));

      // Node

      const child = $("<li></li>")
         .addClass (type)
         .attr ("exported-node-id", exportedNode .getId ())
         .attr ("node-id", node .getId ());

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons .get (type)}.svg`)
         .appendTo (child);

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child);

      $("<span></span>")
         .addClass ("node-type-name")
         .text (node .getTypeName ())
         .appendTo (name);

      name .append (document .createTextNode (" "));

      $("<span></span>")
         .addClass ("node-name")
         .text (node .getName ())
         .appendTo (name);

      name
         .append (document .createTextNode (" "))
         .append ($("<span></span>") .addClass ("as") .text ("AS"))
         .append (document .createTextNode (" "))
         .append ($("<span></span>") .addClass ("as-name") .text (exportedNode .getExportedName ()));

      if (exportedNode .getExportedName () === node .getName ())
         name .find (".node-name") .nextAll () .hide ();

      // Add buttons to name.

      this .addNodeButtons (this .getNode (parent), node, name);

      // Append empty tree to enable expander.

      $("<ul><li></li></ul>") .appendTo (child);

      return child;
   }

   static connectorId = 0;
   static urlFields   = new Set (["url", "frontUrl", "backUrl", "leftUrl", "rightUrl", "topUrl", "bottomUrl", "family"]);

   #fieldSymbol       = Symbol ();
   #fieldButtonSymbol = Symbol ();

   createFieldElement (parent, node, field, type = "field")
   {
      this .objects .set (field .getId (), field);

      // Classes

      const classes = [type];

      if (field .getReferences () .size)
         classes .push ("references");

      if (node .getUserDefinedFields () .get (field .getName ()) === field)
         classes .push ("user-defined");

      // Node

      const child = $("<li></li>")
         .addClass (classes)
         .attr ("node-id", node .getId ())
         .attr ("field-id", field .getId ())
         .attr ("type-name", field .getTypeName ());

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("title", field .getTypeName ())
         .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName ()}.svg`)
         .appendTo (child);

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child);

      $("<span></span>")
         .addClass ("field-name")
         .text (field .getName ())
         .appendTo (name);

      field .addReferencesCallback (this .#fieldSymbol, this .updateReferences .bind (this, parent, node, field));

      // Color

      if (field .isInitializable ())
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFBool:
            {
               $("<img></img>")
                  .addClass (["boolean-button", "field-button", "button",])
                  .attr ("src", `../images/OutlineEditor/Values/${field .getValue () ? "TRUE" : "FALSE"}.svg`)
                  .attr ("title", _("Toggle value."))
                  .appendTo (child);

               field .addFieldCallback (this .#fieldButtonSymbol, this .updateBoolean .bind (this, parent, node, field));
               break;
            }
            case X3D .X3DConstants .SFColor:
            case X3D .X3DConstants .SFColorRGBA:
            {
               $("<div></div>")
                  .addClass (["color-button", "field-button", "button",])
                  .attr ("title", _("Open color picker."))
                  .css ("background-color", this .getColorFromField (node, field))
                  .appendTo (child);

               field .addFieldCallback (this .#fieldButtonSymbol, this .updateColor .bind (this, parent, node, field));
               break;
            }
            case X3D .X3DConstants .SFTime:
            {
               $("<img></img>")
                  .addClass (["time-button", "field-button", "button",])
                  .attr ("src", `../images/OutlineEditor/Values/Bell.svg`)
                  .attr ("title", _("Set current time."))
                  .appendTo (child);

               break;
            }
            case X3D .X3DConstants .MFString:
            {
               if (OutlineView .urlFields .has (field .getName ()) && field .isInitializable ())
               {
                  $("<span></span>")
                     .addClass (["url-button", "field-button", "button", "material-symbols-outlined"])
                     .attr ("title", _("Add URLs."))
                     .text ("add_circle")
                     .appendTo (child);
               }

               break;
            }
            default:
               break;
         }
      }


      // Access type

      const accessType = $("<div></div>")
         .addClass (["access-type", this .accessTypes [field .getAccessType ()]])
         .appendTo (child);

      const mapId = ++ OutlineView .connectorId;

      $("<img/>")
         .addClass ("image")
         .attr ("src", this .getAccessTypeImage (field))
         .attr ("usemap", "#connector-id-" + mapId)
         .appendTo (accessType);

      if (parent .is (".node, .imported-node, .exported-node"))
      {
         if (type !== "special")
            $("<canvas></canvas>") .addClass ("field-routes") .appendTo (accessType);

         const map = $("<map></map>")
            .attr ("id", "connector-id-" + mapId)
            .attr ("name", "connector-id-" + mapId)
            .appendTo (accessType);

         switch (field .getAccessType ())
         {
            case X3D .X3DConstants .initializeOnly:
            {
               break;
            }
            case X3D .X3DConstants .inputOnly:
            {
               $("<area></area>")
                  .attr ("title", _("Select input."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,13,12")
                  .addClass ("input-selector") .appendTo (map);

               const inputRoutesSelector = $("<area></area>")
                  .attr ("title", _("Select route(s)."))
                  .attr ("shape", "rect")
                  .attr ("coords", "20,0,28,7")
                  .addClass ("input-routes-selector") .appendTo (map);

               if (field .getInputRoutes () .size)
                  inputRoutesSelector .attr ("href", "#");

               break;
            }
            case X3D .X3DConstants .outputOnly:
            {
               $("<area></area>")
                  .attr ("title", _("Select output."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,14,12")
                  .addClass ("output-selector") .appendTo (map);

               const outputRoutesSelector = $("<area></area>")
                  .attr ("title", _("Select route(s)."))
                  .attr ("shape", "rect")
                  .attr ("coords", "20,5,28,12")
                  .addClass ("output-routes-selector")
                  .appendTo (map);

               if (field .getOutputRoutes () .size)
                  outputRoutesSelector .attr ("href", "#");

               break;
            }
            case X3D .X3DConstants .inputOutput:
            {
               $("<area></area>")
                  .attr ("title", _("Select input."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,13,12")
                  .addClass ("input-selector") .appendTo (map);

               $("<area></area>")
                  .attr ("title", _("Select output."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "14,0,28,12")
                  .addClass ("output-selector")
                  .appendTo (map);

               const inputRoutesSelector = $("<area></area>")
                  .attr ("title", _("Select route(s)."))
                  .attr ("shape", "rect")
                  .attr ("coords", "34,0,42,7")
                  .addClass ("input-routes-selector")
                  .appendTo (map);

               if (field .getInputRoutes () .size)
                  inputRoutesSelector .attr ("href", "#");

               const outputRoutesSelector = $("<area></area>")
                  .attr ("title", _("Select route(s)."))
                  .attr ("shape", "rect")
                  .addClass ("output-routes-selector")
                  .appendTo (map);

               if (field .getInputRoutes () .size)
                  outputRoutesSelector .attr ("coords", "48,5,56,12");
               else
                  outputRoutesSelector .attr ("coords", "34,5,42,12");

               if (field .getOutputRoutes () .size)
                  outputRoutesSelector .attr ("href", "#");

               break;
            }
         }

         if (this .connector && this .connector .type === "input" && this .connector .field === field)
            var inputActivated = "activated";
         else
            var inputActivated = "";

         if (this .connector && this .connector .type === "output" && this .connector .field === field)
            var outputActivated = "activated";
         else
            var outputActivated = "";

         switch (field .getAccessType ())
         {
            case X3D .X3DConstants .initializeOnly:
            {
               break;
            }
            case X3D .X3DConstants .inputOnly:
            {
               $("<img/>")
                  .addClass (["active", "input", inputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "input"))
                  .appendTo (accessType);

               break;
            }
            case X3D .X3DConstants .outputOnly:
            {
               $("<img/>")
                  .addClass (["active", "output", outputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "output"))
                  .appendTo (accessType);

               break;
            }
            case X3D .X3DConstants .inputOutput:
            {
               $("<img/>")
                  .addClass (["active", "input", inputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "input"))
                  .appendTo (accessType);

               $("<img/>")
                  .addClass (["active", "output", outputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "output"))
                  .appendTo (accessType);

               break;
            }
         }

         // Route callback.

         field .addRouteCallback (this .#fieldSymbol, this .updateFieldAccessType .bind (this, node, field));
      }

      // Append empty tree to enable expander.

      $("<ul><li></li></ul>") .appendTo (child);

      return child;
   }

   updateNodeTitle (event)
   {
      const
         name    = $(event .currentTarget),
         element = $(event .currentTarget) .closest (".externproto, .proto, .node, .special", this .sceneGraph),
         node    = this .objects .get (parseInt (element .attr ("node-id")));

      // Handle NULL node element.
      if (!node)
         return;

      const nodeElement = X3DUOM .find (`ConcreteNode[name="${node .getTypeName ()}"] InterfaceDefinition`);

      name .attr ("title", this .getNodeTitle (node, nodeElement));
   }

   updateFieldTitle (event)
   {
      const
         name         = $(event .currentTarget),
         element      = $(event .currentTarget) .closest (".field, .special", this .sceneGraph),
         node         = this .objects .get (parseInt (element .attr ("node-id"))),
         field        = this .objects .get (parseInt (element .attr ("field-id"))),
         fieldElement = X3DUOM .find (`ConcreteNode[name="${node .getTypeName ()}"] field[name="${field .getName ()}"]`);

      name .attr ("title", this .getFieldTitle (node, field, fieldElement));
   }

   getNodeTitle (node, nodeElement)
   {
      const description = nodeElement .attr ("appinfo") ?? node .getAppInfo ?.();

      let title = "";

      if (description)
         title += `Description:\n\n${description}`;

      return title;
   }

   getFieldTitle (node, field, fieldElement)
   {
      function truncate (string, n)
      {
         return string .length > n ? string .slice (0, n) + "..." : string;
      };

      if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
         field = node .getFieldDefinitions () .get (field .getName ()) .getValue ();

      const description = fieldElement .attr ("description") ?? field .getAppInfo ();

      let title = "";

      if (description)
         title += `Description:\n\n${description}\n\n`;

      title += `Type: ${field .getTypeName ()}\n`;

      if (field instanceof X3D .X3DArrayField)
         title += `Number of values: ${field .length .toLocaleString (_.locale)}`;
      else if (field .getType () === X3D .X3DConstants .SFImage)
         title += `Current value: ${field .width} ${field .height} ${field .comp} ...`;
      else if (field .getType () === X3D .X3DConstants .SFString)
         title += `Current value: ${truncate (field .toString (), 20)}`;
      else
         title += `Current value: ${field .toString ({ scene: node .getExecutionContext () })}`;

      return title;
   }

   updateReferences (parent, node, field)
   {
      const element = parent .find (`.field[field-id=${field .getId ()}]`)

      if (field .getReferences () .size)
         element .addClass ("references")
      else
         element .removeClass ("references")
   }

   updateBoolean (parent, node, field)
   {
      parent .find (`.field[field-id=${field .getId ()}] > .item .boolean-button`)
         .attr ("src", `../images/OutlineEditor/Values/${field .getValue () ? "TRUE" : "FALSE"}.svg`)
   }

   updateColor (parent, node, field)
   {
      parent .find (`.field[field-id=${field .getId ()}] > .item .color-button`)
         .css ("background-color", this .getColorFromField (node, field))
   }

   getColorFromField (node, field, colorSpace = this .browser .getBrowserOption ("ColorSpace"))
   {
      if (colorSpace === "LINEAR" || (colorSpace === "LINEAR_WHEN_PHYSICAL_MATERIAL" && this .isPhysical (node)))
      {
         const
            r = field .r * 100,
            g = field .g * 100,
            b = field .b * 100,
            a = field .a ?? 1;

         return `color(srgb-linear ${r}% ${g}% ${b}% / ${a})`;
      }
      else
      {
         const
            r = field .r * 255,
            g = field .g * 255,
            b = field .b * 255,
            a = field .a ?? 1;

         return `rgba(${r},${g},${b},${a})`;
      }
   }

   getAccessTypeImage (field, active)
   {
      if (active)
      {
         switch (active)
         {
            case "input":
            {
               return "../images/OutlineEditor/AccessTypes/inputOnly.active.png"
            }
            case "output":
            {
               return "../images/OutlineEditor/AccessTypes/outputOnly.active.png"
            }
         }
      }
      else
      {
         let accessTypeImage = this .accessTypes [field .getAccessType ()]

         if (field .isInput ())
         {
            switch (field .getInputRoutes () .size)
            {
               case 0:
                  accessTypeImage += ".0"
                  break
               case 1:
                  accessTypeImage += ".1"
                  break
               default:
                  accessTypeImage += ".2"
                  break
            }
         }

         if (field .isOutput ())
         {
            switch (field .getOutputRoutes () .size)
            {
               case 0:
                  accessTypeImage += ".0"
                  break
               case 1:
                  accessTypeImage += ".1"
                  break
               default:
                  accessTypeImage += ".2"
                  break
            }
         }

         accessTypeImage = "../images/OutlineEditor/AccessTypes/" + accessTypeImage + ".png"

         return accessTypeImage
      }
   }

   updateField (parent, node, field, type, full)
   {
      if (!parent .prop ("isConnected"))
         return;

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            if (!field .getValue () || !field .getNodeUserData (_changing))
               break;

            this .browser .nextFrame ()
               .then (() => field .setNodeUserData (_changing, false));

            return;
         }
         case X3D .X3DConstants .MFNode:
         {
            for (const node of field)
            {
               if (!node ?.getNodeUserData (_changing))
                  continue;

               const nodes = Array .from (field);

               this .browser .nextFrame ()
                  .then (() => nodes .forEach (node => node ?.setNodeUserData (_changing, false)));

               return;
            }

            break;
         }
      }

      this .saveScrollPositions ();

      this .removeSubtree (parent);
      this .expandField (parent, node, field, type, full && (field .getInputRoutes () .size || field .getOutputRoutes () .size));

      this .restoreScrollPositions ();
   }

   #routesFullSymbol = Symbol ();

   expandField (parent, node, field, type, full)
   {
      parent
         .data ("expanded",      true)
         .data ("full-expanded", full);

      if (full)
         parent .find (".access-type") .addClass ("hidden");
      else
         parent .find (".access-type") .removeClass ("hidden");

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            field .addFieldCallback (this .#fieldSymbol, this .updateField .bind (this, parent, node, field, type, full));

            this .expandSFNode (parent, node, field, type, full);
            break;
         }
         case X3D .X3DConstants .MFNode:
         {
            field .addFieldCallback (this .#fieldSymbol, this .updateField .bind (this, parent, node, field, type, full));

            this .expandMFNode (parent, node, field, type, full);
            break;
         }
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
         case X3D .X3DConstants .SFDouble:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFImage:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFMatrix3d:
         case X3D .X3DConstants .SFMatrix3f:
         case X3D .X3DConstants .SFMatrix4d:
         case X3D .X3DConstants .SFMatrix4f:
         case X3D .X3DConstants .SFRotation:
         case X3D .X3DConstants .SFString:
         case X3D .X3DConstants .SFTime:
         case X3D .X3DConstants .SFVec2d:
         case X3D .X3DConstants .SFVec2f:
         case X3D .X3DConstants .SFVec3d:
         case X3D .X3DConstants .SFVec3f:
         case X3D .X3DConstants .SFVec4d:
         case X3D .X3DConstants .SFVec4f:
         {
            this .expandSingleField (parent, node, field, type, full);
            break;
         }
         case X3D .X3DConstants .MFBool:
         case X3D .X3DConstants .MFColor:
         case X3D .X3DConstants .MFColorRGBA:
         case X3D .X3DConstants .MFDouble:
         case X3D .X3DConstants .MFFloat:
         case X3D .X3DConstants .MFImage:
         case X3D .X3DConstants .MFInt32:
         case X3D .X3DConstants .MFMatrix3d:
         case X3D .X3DConstants .MFMatrix3f:
         case X3D .X3DConstants .MFMatrix4d:
         case X3D .X3DConstants .MFMatrix4f:
         case X3D .X3DConstants .MFRotation:
         case X3D .X3DConstants .MFString:
         case X3D .X3DConstants .MFTime:
         case X3D .X3DConstants .MFVec2d:
         case X3D .X3DConstants .MFVec2f:
         case X3D .X3DConstants .MFVec3d:
         case X3D .X3DConstants .MFVec3f:
         case X3D .X3DConstants .MFVec4d:
         case X3D .X3DConstants .MFVec4f:
         {
            this .expandArrayField (parent, node, field, type, full);
            break;
         }
         default:
         {
            break;
         }
      }

      if (full)
         field .addRouteCallback (this .#routesFullSymbol, this .updateField .bind (this, parent, node, field, type, full));
   }

   expandMFNode (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree");

      const ul = $("<ul></ul>")
         .appendTo (child);

      if (full)
         ul .append (this .createRouteElements (node, field));

      let index = 0;

      for (const node of field)
         ul .append (this .createNodeElement ("node", parent, node ?.getValue (), index ++));

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .appendTo (parent)
         .hide ();

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")
            .on ("click", this .selectNone .bind (this));

      child .find (".node")
         .on ("dblclick", this .activateNode .bind (this));

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this));

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>");

      // Connect actions.

      this .connectNodeActions (parent, child);
      this .connectFieldActions (child);

      // Expand children.

      const elements = child .find (".node");

      child .show ();
      this .expandMFNodeComplete (elements, field);
   }

   expandMFNodeComplete (elements, field)
   {
      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element);

         if (!node)
            continue;

         if (node .getUserData (_expanded) === field .getId ())
         {
            element .data ("auto-expand", true);
            element .jstree ("open_node", element);
         }
      }

      this .requestUpdateRouteGraph ();
   }

   expandSFNode (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree");

      const ul = $("<ul></ul>")
         .appendTo (child);

      if (full)
         ul .append (this .createRouteElements (node, field));

      ul .append (this .createNodeElement ("node", parent, field .getValue ()));

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .appendTo (parent)
         .hide ();

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")
            .on ("click", this .selectNone .bind (this));

      child .find (".node")
         .on ("dblclick", this .activateNode .bind (this));

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this));

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>");

      // Connect actions.

      this .connectNodeActions (parent, child);
      this .connectFieldActions (child);

      // Expand children.

      const elements = child .find (".node");

      child .show ();
      this .expandSFNodeComplete (elements, field);
   }

   expandSFNodeComplete (elements, field)
   {
      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element);

         if (!node)
            continue;

         if (node .getUserData (_expanded) === field .getId ())
         {
            element .data ("auto-expand", true);
            element .jstree ("open_node", element);
         }
      }

      this .requestUpdateRouteGraph ();
   }

   nodeIcons = new Map ([
      ["proto",         "Prototype"],
      ["externproto",   "ExternProto"],
      ["node",          "X3DBaseNode"],
      ["imported-node", "ImportedNode"],
      ["exported-node", "ExportedNode"],
   ]);

   typeNames = new Map ([
      ["X3DExternProtoDeclaration", "EXTERNPROTO"],
      ["X3DProtoDeclaration",       "PROTO",]
   ]);

   expandSingleField (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree");

      const ul = $("<ul></ul>")
         .appendTo (child);

      if (full)
         ul .append (this .createRouteElements (node, field));

      const li = $("<li></li>")
         .addClass (type + "-value no-expand")
         .attr ("node-id", node .getId ())
         .attr ("field-id", field .getId ())
         .appendTo (ul);

      $("<div></div>")
         .addClass (type + "-value-container")
         .append ($("<input></input>") .attr ("type", "text") .attr ("lang", "en"))
         .appendTo (li);

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .appendTo (parent)
         .hide ();

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor > *")
            .unwrap ();

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this));

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>");

      this .connectFieldActions (child);

      // Input

      const input = child .find ("input");

      input .on ("mouseenter", this .updateFieldTitle .bind (this));

      if (field .getType () === X3D .X3DConstants .SFString)
         input .val (field .getValue ());
      else
         input .val (field .toString ({ scene: node .getExecutionContext () }));

      if ((field .isInput () || field .isInitializable ()) && this .isEditable (parent))
      {
         input .on ("keydown",  this .onkeydownField .bind (this, input));
         input .on ("focusin",  this .disconnectField .bind (this, field));
         input .on ("focusout", this .connectField .bind (this, input, node, field, true));
      }
      else
      {
         input .attr ("disabled", "disabled");
      }

      this .connectField (input, node, field, false);

      // Expand children.

      child .show ();
      this .requestUpdateRouteGraph ();
   }

   onkeydownField (input, event)
   {
      if (event .key === "Enter")
         input .blur ()
   }

   disconnectField (field)
   {
      field .removeFieldCallback (this .#fieldSymbol)
   }

   #fieldValueSymbol = Symbol ();

   connectField (input, node, field, assign)
   {
      field .addFieldCallback (this .#fieldValueSymbol, () =>
      {
         if (field .getType () === X3D .X3DConstants .SFString)
            input .val (field .getValue ())
         else
            input .val (field .toString ({ scene: node .getExecutionContext () }))
      });

      if (assign)
         this .onFieldEdited (input, node, field);
   }

   onFieldEdited (input, node, field) { }

   expandArrayField (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree")

      const ul = $("<ul></ul>")
         .appendTo (child)

      if (full)
         ul .append (this .createRouteElements (node, field))

      const li = $("<li></li>")
         .addClass (type + "-value no-expand")
         .attr ("node-id", node .getId ())
         .attr ("field-id", field .getId ())
         .appendTo (ul)

      $("<div></div>")
         .addClass (type + "-value-container")
         .append ($("<textarea></textarea>") .attr ("lang", "en"))
         .appendTo (li)

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .appendTo (parent)
         .hide ()

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor > *")
            .unwrap ()

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this))

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves-wrapper\"><canvas class=\"route-curves\"></canvas></div>")

      this .connectFieldActions (child);

      // Textarea

      const textarea = child .find ("textarea")

      this .setTextAreaTabs (textarea)
      this .setTextArea (textarea, node, field)

      textarea .on ("mouseenter", this .updateFieldTitle .bind (this))

      if ((field .isInput () || field .isInitializable ()) && this .isEditable (parent))
      {
         textarea .on ("keydown",  this .onkeydownArrayField .bind (this, textarea))
         textarea .on ("focusin",  this .disconnectField .bind (this, field))
         textarea .on ("focusout", this .connectArrayField .bind (this, textarea, node, field, true))
      }
      else
      {
         textarea .attr ("disabled", "disabled")
      }

      this .connectArrayField (textarea, node, field, false)

      // Expand children.

      child .show ()
      this .requestUpdateRouteGraph ()
   }

   onkeydownArrayField (textarea, event)
   {
      if ((event .ctrlKey || event .metaKey) && event .key === "Enter")
         textarea .blur ()
   }

   connectArrayField (textarea, node, field, assign)
   {
      field .addFieldCallback (this .#fieldValueSymbol, this .setTextArea .bind (this, textarea, node, field))

      if (assign)
         this .onArrayFieldEdited (textarea, node, field)
   }

   onArrayFieldEdited (textarea, node, field) { }

   createRouteElements (node, field)
   {
      const elements = [ ]

      field .getInputRoutes () .forEach ((route) =>
      {
         elements .push (this .createRouteElement ("input", node, field, route) .get (0))
      })

      field .getOutputRoutes () .forEach ((route) =>
      {
         elements .push (this .createRouteElement ("output", node, field, route) .get (0))
      })

      return $(elements)
   }

   createRouteElement (type, node, field, route)
   {
      // Route

      const child = $("<li></li>")
         .addClass (["route", "no-expand"])
         .attr ("node-id", node .getId ())
         .attr ("field-id", field .getId ())
         .attr ("route-id", route .getId ())
         .attr ("route-type", type);

      // Icon

      $("<img></img>")
         .addClass ("icon")
         .attr ("src", "../images/OutlineEditor/Node/Route.svg")
         .appendTo (child);

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child);

      const connectorDescription = $("<span></span>")
         .addClass ("connector-description")
         .appendTo (name);

      switch (type)
      {
         case "input":
         {
            const sourceNodeName = route .getSourceNode () instanceof X3D .X3DNode
               ? route .getSourceNode () .getName ()
               : route .getSourceNode () .getImportedName ();

            connectorDescription .text (util .format (_("Route from %s<%s>.%s"), route .getSourceNode () .getTypeName (), sourceNodeName || _("unnamed"), route .sourceField));

            break;
         }
         case "output":
         {
            const destinationNodeName = route .getDestinationNode () instanceof X3D .X3DNode
               ? route .getDestinationNode () .getName ()
               : route .getDestinationNode () .getImportedName ();

            connectorDescription .text (util .format (_("Route to %s<%s>.%s"), route .getDestinationNode () .getTypeName (), destinationNodeName || _("unnamed"), route .destinationField));

            break;
         }
      }

      const accessType = $("<div></div>")
         .addClass (["access-type", type])
         .appendTo (child);

      const singleRoute = $("<canvas></canvas>")
         .addClass ("single-route")
         .appendTo (accessType);

      const mapId = ++ OutlineView .connectorId;

      switch (type)
      {
         case "input":
         {
            $("<img/>") .addClass ("image") .attr ("src", "../images/OutlineEditor/AccessTypes/inputOnly.1.png") .attr ("usemap", "#connector-id-" + mapId) .appendTo (accessType);
            break;
         }
         case "output":
         {
            $("<img/>") .addClass ("image") .attr ("src", "../images/OutlineEditor/AccessTypes/outputOnly.1.png") .attr ("usemap", "#connector-id-" + mapId) .appendTo (accessType);
            break;
         }
      }

      const map = $("<map></map>")
         .attr ("id", "connector-id-" + mapId)
         .attr ("name", "connector-id-" + mapId)
         .appendTo (accessType);

      switch (type)
      {
         case "input":
         {
            $("<area></area>")
               .attr ("title", process .platform === "darwin" ? _("Remove route (Cmd+Click).") : _("Remove route (Ctrl+Click)."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "0,0,13,12")
               .addClass ("input-selector")
               .appendTo (map);

            $("<area></area>")
               .attr ("title", _("Select route."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "20,0,28,7")
               .addClass ("input-routes-selector")
               .appendTo (map);

            break;
         }
         case "output":
         {
            $("<area></area>")
               .attr ("title", process .platform === "darwin" ? _("Remove route (Cmd+Click).") : _("Remove route (Ctrl+Click)."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "0,0,14,12")
               .addClass ("output-selector")
               .appendTo (map);

            $("<area></area>")
               .attr ("title", _("Select route."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "20,5,28,12")
               .addClass ("output-routes-selector")
               .appendTo (map);

            break;
         }
      }

      switch (type)
      {
         case "input":
         {
            $("<img/>") .addClass (["active", "input"]) .attr ("src", this .getAccessTypeImage (field, "input")) .appendTo (accessType);
            break;
         }
         case "output":
         {
            $("<img/>") .addClass (["active", "output"]) .attr ("src", this .getAccessTypeImage (field, "output")) .appendTo (accessType);
            break;
         }
      }

      return child;
   }

   setTextAreaTabs (textarea)
   {
      textarea .on ("keydown", (event) =>
      {
         if (event .key !== "Tab")
            return

         // Tab was pressed, get caret position/selection.
         const
            start = textarea .prop ("selectionStart"),
            end   = textarea .prop ("selectionEnd")

         // Set textarea value to: text before caret + tab + text after caret.
         textarea .val (textarea .val () .substring (0, start) + "\t" + textarea .val () .substring (end))

         // Put caret at right position again.
         textarea .prop ("selectionStart", start + 1)
         textarea .prop ("selectionEnd",   start + 1)

         // Prevent the focus lose.
         return false
      })
   }

   setTextArea (textarea, node, field)
   {
      switch (field .getType ())
      {
         case X3D .X3DConstants .MFBool:
         case X3D .X3DConstants .MFDouble:
         case X3D .X3DConstants .MFFloat:
         case X3D .X3DConstants .MFTime:
         {
            const
               single  = new (field .getSingleType ()) (),
               options = { scene: node .getExecutionContext () };

            single .setUnit (field .getUnit ());

            textarea .val (Array .from (field, value =>
            {
               single .setValue (value);

               return single .toString (options);
            })
            .join (",\n"));
            break;
         }
         case X3D .X3DConstants .MFInt32:
         {
            textarea .val (field .join (",\n"));
            break;
         }
         case X3D .X3DConstants .MFString:
         {
            textarea .val (field .getValue () .map (value => value .toString ()) .join (",\n"));
            break
         }
         default:
         {
            const
               single  = new (field .getSingleType ()) (),
               options = { scene: node .getExecutionContext () };

            single .setUnit (field .getUnit ());

            textarea .val (Array .from (field, value =>
            {
               single .assign (value);

               return single .toString (options);
            })
            .join (",\n"));
            break;
         }
      }
   }

   nodeBeforeOpen (event, leaf)
   {
      const
         element = $("#" + leaf .node .id),
         node    = this .getNode (element),
         field   = this .getField (element .closest (".field, .scene", this .sceneGraph));

      let full = node .getUserData (_fullExpanded) || element .data ("full-expanded");

      if (!element .data ("auto-expand"))
      {
         if (ActionKeys .value === ActionKeys .Shift)
            full = !full;
      }

      element .data ("auto-expand", false);

      this .nodeCloseClones (element);
      this .beforeOpen (element);
      this .expandNode (element, node, full);

      node .setUserData (_expanded,     field ?.getId () ?? true);
      node .setUserData (_fullExpanded, full);
   }

   nodeCloseClones (element)
   {
      const opened = this .sceneGraph .find (`.node[node-id=${element .attr ("node-id")}],
         .imported-node[node-id=${element .attr ("node-id")}],
         .exported-node[node-id=${element .attr ("node-id")}]`);

      opened .each (function (key, value)
      {
         if (value !== element .get (0))
            $(value) .jstree ("close_node", value);
      })
   }

   fieldBeforeOpen (event, leaf)
   {
      const element = $("#" + leaf .node .id);

      if (element .hasClass ("proto"))
      {
         this .nodeBeforeOpen (event, leaf);
      }

      if (element .hasClass ("scene"))
      {
         const scene = this .getNode (element);

         this .beforeOpen (element);
         this .expandScene (element, scene);

         scene .setUserData (_expanded, true);
      }

      if (element .is (".field, .special"))
      {
         const
            node  = this .getNode (element),
            field = this .getField (element);

         let full = field .getUserData (_fullExpanded) || element .data ("full-expanded");

         if (!element .data ("auto-expand"))
         {
            if (ActionKeys .value === ActionKeys .Shift)
               full = !full;
         }

         element .data ("auto-expand", false);

         this .beforeOpen (element);
         this .expandField (element, node, field, "field", full);

         field .setUserData (_expanded,     true);
         field .setUserData (_fullExpanded, full);
      }
   }

   beforeOpen (element)
   {
      element .find (".jstree-ocl") .text ("arrow_drop_down");
      element .find ("ul") .remove ();
   }

   nodeCloseNode (event, leaf)
   {
      const
         element = $("#" + leaf .node .id),
         node    = this .getNode (element);

      node .setUserData (_expanded, false);

      this .closeNode (element);
   }

   fieldCloseNode (event, leaf)
   {
      const element = $("#" + leaf .node .id);

      if (element .hasClass ("proto"))
      {
         this .nodeCloseNode (event, leaf);
      }

      if (element .hasClass ("scene"))
      {
         const scene = this .getNode (element);

         element .find (".access-type") .removeClass ("hidden");

         scene .setUserData (_expanded, false);

         this .closeNode (element);
      }

      if (element .is (".field, .special"))
      {
         const field = this .getField (element);

         element .find (".access-type") .removeClass ("hidden");

         field .setUserData (_expanded, false);

         this .closeNode (element);
      }
   }

   closeNode (element)
   {
      element
         .data ("expanded",      false)
         .data ("full-expanded", false);

      element.find (".jstree-ocl") .text ("arrow_right");

      // Collapse children.

      element .find ("> .subtree") .hide ();

      this .afterClose (element);
   }

   afterClose (element)
   {
      this .removeSubtree (element);

      if (ActionKeys .value === ActionKeys .Shift)
         element .jstree ("open_node", element);

      this .requestUpdateRouteGraph ();
   }

   removeSubtree (element)
   {
      this .disconnectSubtree (element);

      // Remove subtree.

      element .find ("> .subtree") .remove ();
   }

   disconnectSubtree (element)
   {
      // Don't disconnect typeName and name change, because they normally do not change, and clones cannot be handled.

      element .find (".scene") .addBack (".scene") .each ((i, e) =>
      {
         const
            child = $(e),
            scene = this .getNode (child);

         scene .externprotos  .removeInterest ("updateSceneSubtree", this);
         scene .protos        .removeInterest ("updateSceneSubtree", this);
         scene .importedNodes .removeInterest ("updateSceneSubtree", this);

         for (const importedNode of scene .importedNodes)
            importedNode .getInlineNode () .getLoadState () .removeFieldCallback (this .#importedNodeSymbol);

         scene .rootNodes .removeFieldCallback (this .#updateSceneRootNodesSymbol);

         if (scene instanceof X3D .X3DScene)
         {
            scene .units         .removeInterest ("updateScene",        this);
            scene .exportedNodes .removeInterest ("updateSceneSubtree", this);
         }
      });

      element .find (".externproto") .addBack (".externproto") .each ((i, e) =>
      {
         const
            child = $(e),
            node = this .getNode (child);

         node .getLoadState () .removeFieldCallback (this .#updateNodeSymbol);
      });

      element .find (".node [data-hasqtip]") .qtip ?.("hide") .qtip ("destroy", true);

      element .find (".node:not([node-id=NULL]), .exported-node")
         .addBack (".node:not([node-id=NULL]), .exported-node") .each ((i, e) =>
      {
         const child = $(e);

         if (!child .jstree ("is_open", child))
            return;

         const node = this .getNode (child);

         node .getPredefinedFields ()  .removeInterest ("updateNode", this);
         node .getUserDefinedFields () .removeInterest ("updateNode", this);

         for (const type of node .getType ())
         {
            switch (type)
            {
               case X3D .X3DConstants .X3DUrlObject:
               {
                  node .getLoadState () .removeFieldCallback (this .#updateNodeSymbol);
                  continue;
               }
            }
         }
      });

      element .find (".node:not([node-id=NULL]), .imported-node, .exported-node") .each ((i, e) =>
      {
         const
            child = $(e),
            node  = this .getNode (child);

         // In case imported node is not yet loaded.
         if (!node)
            return;

         // If node is somewhere else, don't disconnect.
         if (Array .from (this .sceneGraph .find (`.node[node-id="${node .getId ()}"],
            .imported-node[node-id="${node .getId ()}"],
            .exported-node[node-id="${node .getId ()}"]`))
            .some (s => !$(s) .closest (element) .length))
         {
            return;
         }

         node .typeName_changed .removeFieldCallback (this .#nodeSymbol);
         node .name_changed     .removeFieldCallback (this .#nodeSymbol);
         node .parents_changed  .removeFieldCallback (this .#nodeSymbol);

         for (const type of node .getType ())
         {
            switch (type)
            {
               case X3D .X3DConstants .X3DTimeDependentNode:
               {
                  node ._enabled  .removeFieldCallback (this .#updateNodePlaySymbol);
                  node ._isActive .removeFieldCallback (this .#updateNodePlaySymbol);
                  node ._isPaused .removeFieldCallback (this .#updateNodePlaySymbol);
                  node ._loop     .removeFieldCallback (this .#updateNodePlaySymbol);
                  continue;
               }
               case X3D .X3DConstants .X3DBindableNode:
               {
                  node ._isBound .removeFieldCallback (this .#updateNodeBoundSymbol);
                  continue;
               }
               case X3D .X3DConstants .X3DUrlObject:
               {
                  node .getLoadState () .removeFieldCallback (this .#updateNodeLoadStateSymbol);
                  continue;
               }
            }
         }
      });

      element .find (".exported-node") .each ((i, e) =>
      {
         const
            child = $(e),
            node  = this .getNode (child);

         node .typeName_changed .removeFieldCallback (this .#exportedNodeSymbol);
         node .name_changed     .removeFieldCallback (this .#exportedNodeSymbol);
      });

      element .find (".field, .special") .each ((i, e) =>
      {
         const
            child = $(e),
            field = this .getField (child);

         field .removeReferencesCallback (this .#fieldSymbol);
         field .removeRouteCallback (this .#fieldSymbol);
         field .removeFieldCallback (this .#fieldSymbol);
         field .removeFieldCallback (this .#fieldButtonSymbol);
         field .removeFieldCallback (this .#fieldValueSymbol);
      });

      // Field is collapsed.

      if (element .is (".field, .special"))
      {
         element .each ((i, e) =>
         {
            const
               child = $(e),
               field = this .getField (child);

            field .removeRouteCallback (this .#routesFullSymbol);
            field .removeFieldCallback (this .#fieldValueSymbol);
         });
      }

      // Color fields.

      this .removeFieldButtons (element .find (".color-button"));
   }

   selectAll ()
   {
      this .deselectAll ();

      const
         hierarchy = require ("../Application/Hierarchy"),
         elements  = this .sceneGraph .find ("> .root-nodes > ul > li[node-id]");

      hierarchy .target (this .executionContext);

      for (const element of elements)
         this .selectNodeElement ($(element), { add: true });
   }

   deselectAll ()
   {
      const
         selection = require ("../Application/Selection"),
         hierarchy = require ("../Application/Hierarchy"),
         nodes     = this .sceneGraph .find (".primary, .selected");

      nodes .removeClass (["primary", "manually", "selected"]);

      selection .clear ();
      hierarchy .clear ();
   }

   showPreview (event)
   {
      const
         icon    = $(event .currentTarget) ,
         item    = icon .closest (".item", this .sceneGraph),
         element = icon .closest (".node, .imported-node, .exported-node", this .sceneGraph),
         node    = this .objects .get (parseInt (element .attr ("node-id"))),
         on      = !!item .attr ("data-hasqtip");

      event .preventDefault ();
      event .stopImmediatePropagation ();

      $("[data-hasqtip]") .qtip ?.("hide") .qtip ("destroy", true);
      $("[action=show-preview].on") .removeClass ("on") .addClass ("off");

      if (on)
         return;

      icon .removeClass ("off") .addClass ("on");

      // Handle NULL node element.
      if (!node)
         return;

      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .AudioClip:
            case X3D .X3DConstants .BufferAudioSource:
            {
               require ("../Controls/AudioPreviewPopover");

               item .audioPreviewPopover (node);
               break;
            }
            case X3D .X3DConstants .MovieTexture:
            {
               if (!(node .getMediaElement () instanceof HTMLVideoElement))
                  continue;

               require ("../Controls/VideoPreviewPopover");

               item .videoPreviewPopover (node);
               break;
            }
            case X3D .X3DConstants .X3DMaterialNode:
            {
               require ("../Controls/MaterialPreviewPopover");

               item .materialPreviewPopover (node);
               break;
            }
            case X3D .X3DConstants .X3DSingleTextureNode:
            {
               require ("../Controls/TexturePreviewPopover");

               item .texturePreviewPopover (node);
               break;
            }
            default:
               continue;
         }

         break;
      }
   }

   toggleVisibility (event)
   {
      const
         target  = $(event .target),
         element = target .closest (".node, .imported-node, .exported-node", this .sceneGraph),
         node    = this .getNode (element),
         hidden  = !node .isHidden ();

      event .preventDefault ();
      event .stopImmediatePropagation ();

      node .setHidden (hidden);

      this .sceneGraph .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=toggle-visibility]")
         .removeClass (["on", "off"])
         .addClass (hidden ? "off" : "on")
         .text (hidden ? "visibility_off" : "visibility");
   }

   toggleTool (event)
   {
      const
         target  = $(event .target),
         element = target .closest (".node, .imported-node, .exported-node", this .sceneGraph),
         node    = this .getNode (element),
         tool    = node .getTool ();

      event .preventDefault ();
      event .stopImmediatePropagation ();

      if (tool)
      {
         tool .removeTool ("createOnDemand");
      }
      else
      {
         node .addTool ("createOnDemand");
         node .getTool () .setSelected (element .hasClass ("selected"));
      }

      node .setUserData (_changing, true);

      this .sceneGraph .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=toggle-tool]")
         .removeClass (["on", "off"])
         .addClass (tool ? "off" : "on");
   }

   proxyDisplay (event)
   {
      const
         target  = $(event .target),
         element = target .closest (".node, .imported-node, .exported-node", this .sceneGraph),
         node    = this .getNode (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      node .setProxyDisplay (!node .getProxyDisplay ());

      this .sceneGraph .find (`.node[node-id=${node .getId ()}],
         .imported-node[node-id=${node .getId ()}],
         .exported-node[node-id=${node .getId ()}]`)
         .find ("> .item [action=proxy-display]")
         .removeClass (["on", "off"])
         .addClass (node .getProxyDisplay () ? "on" : "off");
   }

   activateLayer (event) { }

   bindNode (event)
   {
      const
         target  = $(event .target),
         element = target .closest (".node, .imported-node, .exported-node", this .sceneGraph),
         node    = this .getNode (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      node ._set_bind = true;
   }

   playNode (event) { }

   stopNode (event) { }

   loopNode (event) { }

   reloadNode (event)
   {
      const
         target  = $(event .target),
         element = target .closest (".node, .imported-node, .exported-node, .externproto", this .sceneGraph),
         item    = target .closest (".item"),
         node    = this .getNode (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      if (node ._load .getValue ())
      {
         node .loadNow () .catch (Function .prototype);
         item .data ("preview") ?.loadNow () .catch (Function .prototype);
      }
      else
      {
         node .unloadNow ();
         item .data ("preview") ?.unloadNow ();
      }
   }

   showBranch (event)
   {
      const
         target        = $(event .target),
         element       = target .closest (".node", this .sceneGraph),
         parentElement = element .parent () .closest (".node", this .sceneGraph),
         node          = this .getNode (element),
         parent        = this .getNode (parentElement);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      this .sceneGraph .find (`.node[node-id=${parent .getId ()}] .node[node-id=${node .getId ()}]`)
         .siblings ()
         .find ("> .item [action=show-branch]")
         .removeClass (["on", "off"])
         .addClass ("off");

      this .sceneGraph .find (`.node[node-id=${parent .getId ()}] .node[node-id=${node .getId ()}]`)
         .find ("> .item [action=show-branch]")
         .removeClass (["on", "off"])
         .addClass (parent .getEditChild () !== node ? "on" : "off");

      if (parent .getEditChild () === node)
         parent .setEditChild (null)
      else
         parent .setEditChild (node);
   }

   hideUnselectedObjects ()
   {
      // Hide all X3DShapeNode nodes and show all other nodes.

      for (const object of this .executionContext .traverse (Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .setHidden)
            continue;

         node .setHidden (node .getType () .includes (X3D .X3DConstants .X3DShapeNode));

         this .sceneGraph .find (`.node[node-id=${node .getId ()}],
            .imported-node[node-id=${node .getId ()}],
            .exported-node[node-id=${node .getId ()}]`)
            .find ("> .item [action=toggle-visibility]")
            .removeClass (["on", "off"])
            .addClass (node .isHidden () ? "off" : "on")
            .text (node .isHidden () ? "visibility_off" : "visibility");
      }

      // Show all nodes in selection.

      const selection = require ("../Application/Selection");

      for (const object of Traverse .traverse (selection .nodes, Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .setHidden)
            continue;

         if (!node .getType () .includes (X3D .X3DConstants .X3DShapeNode))
            continue;

         node .setHidden (false);

         this .sceneGraph .find (`.node[node-id=${node .getId ()}],
            .imported-node[node-id=${node .getId ()}],
            .exported-node[node-id=${node .getId ()}]`)
            .find ("> .item .toggle-visibility")
            .removeClass ("off")
            .addClass ("on")
            .text ("visibility");
      }
   }

   showSelectedObjects ()
   {
      const selection = require ("../Application/Selection")

      for (const object of Traverse .traverse (selection .nodes .length ? selection .nodes : this .executionContext, Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .setHidden)
            continue;

         node .setHidden (false);

         this .sceneGraph .find (`.node[node-id=${node .getId ()}],
            .imported-node[node-id=${node .getId ()}],
            .exported-node[node-id=${node .getId ()}]`)
            .find ("> .item .toggle-visibility")
            .removeClass ("off")
            .addClass ("on")
            .text ("visibility");
      }
   }

   showAllObjects ()
   {
      for (const object of this .executionContext .traverse (Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .setHidden)
            continue;

         node .setHidden (false);

         this .sceneGraph .find (`.node[node-id=${node .getId ()}],
            .imported-node[node-id=${node .getId ()}],
            .exported-node[node-id=${node .getId ()}]`)
            .find ("> .item .toggle-visibility")
            .removeClass ("off")
            .addClass ("on")
            .text ("visibility");
      }
   }

   selectNone (event)
   {
      event .preventDefault ();
      event .stopImmediatePropagation ();

      // Hide color editor.
      $(document) .trigger ("click");
   }

   selectNode (event)
   {
      event .preventDefault ();
      event .stopImmediatePropagation ();

      $(document) .trigger ("click");

      // Click on node.

      this .clearConnectors ();

      const
         element = $(event .currentTarget) .closest (".node, .externproto, .proto"),
         add     = event .shiftKey || event .metaKey;

      if (element .hasClass ("node"))
         this .selectNodeElement (element, { add, target: true });

      else if (element .is (".externproto, .proto"))
         this .selectPrimaryElement (element, add);
   }

   selectNodeElement (element, { add = false, target = false } = { })
   {
      if (!element .hasClass ("node"))
         return;

      if (!this .isEditable (element))
         return;

      const
         selection        = require ("../Application/Selection"),
         hierarchy        = require ("../Application/Hierarchy"),
         selected         = element .hasClass ("manually"),
         selectedElements = this .sceneGraph .find (".primary, .selected"),
         node             = this .getNode (element),
         elements         = $(`.node[node-id=${node ?.getId ()}]`),
         changed          = new Map (selection .nodes .map (node => [node, node .getTool ()]));

      if (node)
         changed .set (node .valueOf (), node .getTool ());

      selectedElements .removeClass ("primary");

      if (add)
      {
         if (selected)
         {
            if (elements .length === 1)
            {
               element .removeClass (["manually", "selected"]);
            }
            else
            {
               if (elements .filter (".manually") .length === 1)
                  elements .removeClass (["manually", "selected"]);
               else
                  element .removeClass ("manually");
            }
         }
         else
         {
            element .addClass (["primary", "manually", "selected"]);
         }

         if (elements .filter (".manually") .length)
         {
            if (target)
               hierarchy .target (node);

            selection .add (node);
            hierarchy .add (node);
         }
         else
         {
            selection .remove (node);
            hierarchy .remove (node);
         }
      }
      else
      {
         selectedElements .removeClass (["manually", "selected"]);
         element .addClass (["primary", "manually"]);
         elements .addClass ("selected");

         if (target)
            hierarchy .target (node);

         selection .set (node);
         hierarchy .set (node);
      }

      for (const [node, tool] of changed)
      {
         if (node .getTool () !== tool)
            node .setUserData (_changing, true);
      }
   }

   selectPrimaryElement (element, add = false)
   {
      if (!this .isEditable (element))
         return;

      if (!add)
         this .sceneGraph .find (".manually") .removeClass ("manually");

      this .sceneGraph .find (".primary") .removeClass ("primary");

      element .addClass (["primary", "manually"]);
   }

   selectField (event)
   {
      event .preventDefault ();
      event .stopImmediatePropagation ();

      $(document) .trigger ("click");

      // Click on field.

      this .clearConnectors ();

      // Make primary selection from user defined field.

      const element = $(event .currentTarget) .closest (".field, .special");

      if (!element .hasClass ("field"))
         return;

      this .selectPrimaryElement (element);
   }

   selectExpander (event)
   {
      // Click on expander.

      const element = $(event .currentTarget) .closest (".jstree-node");

      event .preventDefault ();
      event .stopImmediatePropagation ();

      if (element .jstree ("is_closed", element))
         element .jstree ("open_node",  element);
      else
         element .jstree ("close_node", element);

      this .treeView .trigger ("focus");
   }

   clearConnectors ()
   {
      // Clear connectors.
   }

   activateExpander (event)
   {
      // Double click on expander.

      event .preventDefault ();
      event .stopImmediatePropagation ();
   }

   activateNode (event)
   {
      // Double click on externproto, proto, node.

      event .preventDefault ();
      event .stopImmediatePropagation ();
   }

   activateField (event)
   {
      // Double click on field.

      event .preventDefault ();
      event .stopImmediatePropagation ();
   }

   updateFieldAccessType (node, field)
   {
      const element = this .sceneGraph .find (`.field[field-id=${field .getId ()}]`);

      // Update access type image.

      element
         .find ("> .item .access-type img.image")
         .attr ("src", this .getAccessTypeImage (field));

      // Update route selectors.

      if (field .getAccessType () == X3D .X3DConstants .inputOutput)
      {
         const area = element .find ("area.output-routes-selector");

         if (field .getInputRoutes () .size)
            area .attr ("coords", "48,5,56,12");
         else
            area .attr ("coords", "34,5,42,12");
      }

      if (field .getInputRoutes () .size)
      {
         const area = element .find ("area.input-routes-selector");

         if (field .getInputRoutes () .size)
            area .attr ("href", "#");
         else
            area .removeAttr ("href");
      }

      if (field .getOutputRoutes () .size)
      {
         const area = element .find ("area.output-routes-selector");

         if (field .getOutputRoutes () .size)
            area .attr ("href", "#");
         else
            area .removeAttr ("href");
      }

      // Update route graph.

      this .requestUpdateRouteGraph ();
   }

   isEditable (parent)
   {
      if (parent .is (".externproto, .special"))
         parent = parent .closest (".scene", this .sceneGraph);

      if (parent .closest (".externproto, .instance-scene, .internal-scene, .imported-node .node, .imported-node .field", this .sceneGraph) .length)
      {
         return false;
      }

      return true;
   }

   getLayer (element)
   {
      for (;;)
      {
         if (element .hasClass ("scene"))
            break;

         const layerNode = this .getNode (element);

         if (layerNode ?.getType () .includes (X3D .X3DConstants .X3DLayerNode))
            return layerNode;

         element = element .parent () .closest (".node, .scene", this .sceneGraph);
      }

      return this .browser .getActiveLayer ();
   }

   getNode (element)
   {
      return this .objects .get (parseInt (element .attr ("node-id")));
   }

   getExportedNode (element)
   {
      return this .objects .get (parseInt (element .attr ("exported-node-id")));
   }

   getField (element)
   {
      return this .objects .get (parseInt (element .attr ("field-id")));
   }

   getRoute (element, routes)
   {
      const id = parseInt (element .attr ("route-id"));

      for (const route of routes)
      {
         if (route .getId () === id)
            return route;
      }

      return null;
   }

   onresize ()
   {
      this .requestUpdateRouteGraph ();
   }

   addFieldButtons (parent, child, node)
   {
      if (!this .isEditable (parent))
         return;

      if (node instanceof X3D .X3DExternProtoDeclaration)
      {
         child
            .find (".special .url-button")
            .each ((i, button) => this .addUrlField ($(button)));

         return;
      }

      for (const button of child .find (".field-button"))
      {
         for (const className of button .classList)
         {
            switch (className)
            {
               case "boolean-button":
                  this .addBooleanField ($(button));
                  break;
               case "color-button":
                  this .addColorField ($(button));
                  break;
               case "time-button":
                  this .addTimeField ($(button));
                  break;
               case "url-button":
                  this .addUrlField ($(button));
                  break;
               default:
                  continue;
            }

            break;
         }
      }
   }

   addBooleanField (button) { }

   addColorField (button) { }

   addTimeField (button) { }

   addUrlField (button) { }

   removeFieldButtons (buttons)
   {
      buttons .each ((i, e) => this .removeColorField ($(e)));
   }

   removeColorField (button) { }

   hoverInConnector (type, event)
   {
      // Hover in connector.
   }

   hoverOutConnector (type, event)
   {
      // Hover out connector.
   }

   hoverInSingleConnector (type, event)
   {
      // Hover in single connector.
   }

   hoverOutSingleConnector (type, event)
   {
      // Hover out single connector.
   }

   selectConnector (type, event)
   {
      // Click on connector.
   }

   selectSingleConnector (type, event)
   {
      // Click on connector.
   }

   selectRoutes (type, event)
   {
      // Select route(s).
   }

   selectSingleRoute (type, event)
   {
      // Select single route.
   }

   requestUpdateRouteGraph ()
   {
      // Update route graph.
   }

   onDragStartExternProto () { }

   onDragStartProto () { }

   onDragStartNode (event) { }

   onDragStartField (event) { }

   onDragEnter (event) { }

   onDragLeave (event) { }

   onDrop (event) { }

   onDragEnd (event) { }

   expandTo (object, { expandExternProtoDeclarations = false, expandInlineNodes = false, expandPrototypeInstances = false, expandObject = false, expandAll = false } = { })
   {
      let flags = Traverse .NONE;

      if (this .expandExternProtoDeclarations && expandExternProtoDeclarations)
         flags |= Traverse .EXTERNPROTO_DECLARATIONS | Traverse .EXTERNPROTO_DECLARATION_SCENE;

      flags |= Traverse .PROTO_DECLARATIONS;
      flags |= Traverse .PROTO_DECLARATION_BODY;

      if (this .expandInlineNodes && expandInlineNodes)
         flags |= Traverse .INLINE_SCENE;

      flags |= Traverse .ROOT_NODES;

      if (this .expandPrototypeInstances && expandPrototypeInstances)
         flags |= Traverse .PROTOTYPE_INSTANCES;

      flags |= Traverse .IMPORTED_NODES;

      for (const hierarchy of this .executionContext .find (object, flags))
      {
         hierarchy .shift (); // execution context
         hierarchy .shift (); // rootNode | protos ...

         if (!expandObject)
            hierarchy .pop ();

         this .expandHierarchy (hierarchy, this .sceneGraph, this .executionContext);

         if (!expandAll)
            break;
      }
   }

   static objectClasses = {
      "X3DExternProtoDeclaration": "externproto",
      "X3DProtoDeclaration": "proto",
      "X3DScene": "scene",
      "X3DExecutionContext": "scene",
   };

   expandHierarchy (hierarchy, parent, parentObject)
   {
      let object = hierarchy .shift ();

      if (object === undefined)
         return;

      switch (true)
      {
         case typeof object === "string":
         {
            object = parentObject .getField (object);

            let element = parent .find (`.field[field-id=${object .getId ()}]`);

            if (element .length === 0)
            {
               parent .jstree ("close_node", parent);
               parent .jstree ("open_node",  parent);

               element = parent .find (`.field[field-id=${object .getId ()}]`);
            }

            element .jstree ("open_node", element);

            this .expandHierarchy (hierarchy, element);
            break;
         }
         case typeof object === "number":
         {
            this .expandHierarchy (hierarchy, parent);
            break;
         }
         case object instanceof X3D .X3DImportedNode:
         {
            const element = parent .find (`.imported-node[imported-node-id=${object .getId ()}]`);

            element .jstree ("open_node", element);

            this .expandHierarchy (hierarchy, element);
            break;
         }
         case object instanceof X3D .SFNode:
         {
            object = object .getValue ();
            // Proceed with next case:
         }
         default: // X3DBaseNode
         {
            const
               objectClass = OutlineView .objectClasses [object .getTypeName ()] || "node",
               element     = parent .find (`.${objectClass}[node-id=${object .getId ()}]`);

            element .jstree ("open_node", element);

            if (object instanceof X3D .X3DExecutionContext)
               hierarchy .shift (); // rootNode | protos ...

            this .expandHierarchy (hierarchy, element, object);
            break;
         }
      }
   }

   scrollPositions = [ ];
   scrollTimeoutId = 0;

   saveScrollPositions ()
   {
      this .scrollPositions .push ([this .treeView .scrollTop (), this .treeView .scrollLeft ()]);

      cancelAnimationFrame (this .scrollTimeoutId);

      this .scrollTimeoutId = requestAnimationFrame (() => this .scrollPositions .length = 0);
   }

   restoreScrollPositions ()
   {
      const scrollPositions = this .scrollPositions [0];

      this .treeView .scrollTop  (scrollPositions [0]);
      this .treeView .scrollLeft (scrollPositions [1]);
   }

   saveExpanded (config)
   {
      if (!this .executionContext)
         return;

      const expanded = this .saveExpandedNodes (this .sceneGraph .find ("> div > ul > li"), [ ], [ ]);

      config .expanded   = expanded;
      config .scrollTop  = this .treeView .scrollTop ();
      config .scrollLeft = this .treeView .scrollLeft ();
   }

   saveExpandedNodes (elements, path, expanded)
   {
      elements .each ((i, e) =>
      {
         const element = $(e);

         path .push (element .hasClass ("field") ? this .getField (element) .getName () : i);

         if (element .data ("expanded"))
         {
            expanded .push ({
               path: path .join (":"),
               fullExpanded: element .data ("full-expanded"),
            });
         }

         this .saveExpandedNodes (element .find ("> div > ul > li"), path, expanded);

         path .pop ();
      })

      return expanded;
   }

   restoreExpanded ()
   {
      const expanded = new Map ();

      this .config .file .setDefaultValues ({
         expanded: [ ],
         scrollTop: 0,
         scrollLeft: 0,
      });

      for (const row of this .config .file .expanded)
         expanded .set (row .path, row);

      this .restoreExpandedNodes (this .sceneGraph .find ("> div > ul > li"), [ ], expanded);

      this .treeView .scrollTop (this .config .file .scrollTop);
      this .treeView .scrollLeft (this .config .file .scrollLeft);
   }

   restoreExpandedNodes (elements, path, expanded)
   {
      elements .each ((i, e) =>
      {
         const element = $(e);

         path .push (element .hasClass ("field") ? this .getField (element) .getName () : i);

         const data = expanded .get (path .join (":"));

         if (data)
         {
            element .data ("full-expanded", data .fullExpanded);
            element .jstree ("open_node", element);

            this .restoreExpandedNodes (element .find ("> div > ul > li"), path, expanded);
         }

         path .pop ();
      })
   }
}
