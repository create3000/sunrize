"use strict"

const
   $            = require ("jquery"),
   electron     = require ("electron"),
   url          = require ("url"),
   util         = require ("util"),
   jstree       = require ("jstree"),
   ResizeSensor = require ("css-element-queries/src/ResizeSensor"),
   X3D          = require ("../X3D"),
   Interface    = require ("../Application/Interface"),
   ActionKeys   = require ("../Application/ActionKeys"),
   Traverse     = require ("../Application/Traverse"),
   _            = require ("../Application/GetText")

const
   _expanded     = Symbol (),
   _fullExpanded = Symbol (),
   _primary      = Symbol (),
   _selected     = Symbol (),
   _changing     = Symbol .for ("Sunrize.changing")

module .exports = class OutlineView extends Interface
{
   naturalCompare = new Intl .Collator (undefined, { numeric: true, sensitivity: "base" }) .compare

   constructor (element)
   {
      super (`Sunrize.OutlineEditor.${element .attr ("id")}.`)

      this .outlineEditor     = element
      this .objects           = new Map () // <id, node>
      this .actionKeys        = new ActionKeys ()
      this .onDemandToolNodes = new Set ()

      this .globalConfig .setDefaultValues ({
         expandExternProtoDeclarations: true,
         expandPrototypeInstances: true,
         expandInlineNodes: true,
      })

      this .treeView = $("<div><div/>")
         .attr ("tabindex", "0")
         .addClass ("tree-view")
         .appendTo (this .outlineEditor)

      this .resizeSensor = new ResizeSensor (this .treeView, this .onresize .bind (this))

      this .sceneGraph = $("<div><div/>")
         .addClass (["tree", "scene-graph", "scene"])
         .on ("dragenter dragover", this .onDragEnter .bind (this))
         .on ("dragleave dragend drop", this .onDragLeave .bind (this))
         .on ("drop", this .onDrop .bind (this))
         .on ("dragend", this .onDragEnd .bind (this))
      .appendTo (this .treeView)

      electron .ipcRenderer .on ("select-all",              () => this .selectAll ())
      electron .ipcRenderer .on ("deselect-all",            () => this .deselectAll ())
      electron .ipcRenderer .on ("hide-unselected-objects", () => this .hideUnselectedObjects ())
      electron .ipcRenderer .on ("show-selected-objects",   () => this .showSelectedObjects ())
      electron .ipcRenderer .on ("show-all-objects",        () => this .showAllObjects ())

      electron .ipcRenderer .on ("expand-extern-proto-declarations", (event, value) => this .expandExternProtoDeclarations = value)
      electron .ipcRenderer .on ("expand-prototype-instances",       (event, value) => this .expandPrototypeInstances      = value)
      electron .ipcRenderer .on ("expand-inline-nodes",              (event, value) => this .expandInlineNodes             = value)

      electron .ipcRenderer .on ("close", (event) => this .saveExpanded ())
   }

   get expandExternProtoDeclarations ()
   {
      return this .globalConfig .expandExternProtoDeclarations
   }

   set expandExternProtoDeclarations (value)
   {
      this .globalConfig .expandExternProtoDeclarations = value
      this .updateSceneGraph ()
   }

   get expandPrototypeInstances ()
   {
      return this .globalConfig .expandPrototypeInstances
   }

   set expandPrototypeInstances (value)
   {
      this .globalConfig .expandPrototypeInstances = value
      this .updateSceneGraph ()
   }

   get expandInlineNodes ()
   {
      return this .globalConfig .expandInlineNodes
   }

   set expandInlineNodes (value)
   {
      this .globalConfig .expandInlineNodes = value
      this .updateSceneGraph ()
   }

   get autoExpandMaxChildren ()
   {
      return 30
   }

   accessTypes = {
      [X3D .X3DConstants .initializeOnly]: "initializeOnly",
      [X3D .X3DConstants .inputOnly]:      "inputOnly",
      [X3D .X3DConstants .outputOnly]:     "outputOnly",
      [X3D .X3DConstants .inputOutput]:    "inputOutput",
   }

   configure ()
   {
      if (this .executionContext)
      {
         this .saveExpanded ()
         this .removeSubtree (this .sceneGraph)

         this .executionContext .profile_changed .removeInterest ("updateComponents", this)
         this .executionContext .components      .removeInterest ("updateComponents", this)
      }

      this .executionContext = this .browser .currentScene

      this .executionContext .profile_changed .addInterest ("updateComponents", this)
      this .executionContext .components      .addInterest ("updateComponents", this)

      this .updateComponents ()

      // Clear tree.

      this .objects .clear ()
      this .objects .set (this .executionContext .getId (), this .executionContext)
      this .sceneGraph .empty ()
      this .sceneGraph .attr ("node-id", this .executionContext .getId ())

      // Expand scene.

      this .expandScene (this .sceneGraph, this .executionContext)
      this .restoreExpanded ()
   }

   updateComponents ()
   {
      this .onDemandToolNodes = new Set ([
         X3D .X3DConstants .Sound,
         X3D .X3DConstants .X3DEnvironmentalSensorNode,
         X3D .X3DConstants .X3DLightNode,
         X3D .X3DConstants .X3DTextureProjectorNode,
         X3D .X3DConstants .X3DViewpointNode,
      ])
   }

   updateSceneGraph ()
   {
      this .updateScene (this .sceneGraph, this .executionContext)
   }

   updateScene (parent, scene)
   {
      this .saveScrollPositions ()
      this .saveExpanded ()
      this .removeSubtree (parent)
      this .expandScene (parent, scene)
      this .restoreExpanded ()
      this .restoreScrollPositions ()
   }

   expandScene (parent, scene)
   {
      parent .data ("expanded",      true)
      parent .data ("full-expanded", false)

      if (scene .getOuterNode () instanceof X3D .X3DProtoDeclaration)
      {
         Traverse .traverse (scene, Traverse .ROOT_NODES, node =>
         {
            if (node .isInitialized ())
               return

            if (node .getType () .includes (X3D .X3DConstants .X3DUrlObject))
               node .requestImmediateLoad = () => Promise .resolve ()

            node .setup ()
         })
      }

      if (scene instanceof X3D .X3DScene)
         scene .units .addInterest ("updateScene", this, parent, scene)

      // Generate subtrees.

      const
         externprotos  = this .expandSceneExternProtoDeclarations (parent, scene),
         protos        = this .expandSceneProtoDeclarations       (parent, scene),
         rootNodes     = this .expandSceneRootNodes               (parent, scene),
         importedNodes = this .expandSceneImportedNodes           (parent, scene),
         exportedNodes = this .expandSceneExportedNodes           (parent, scene)

      if (!externprotos .is (":empty") || !protos .is (":empty") || !rootNodes .is (":empty") || !importedNodes .is (":empty") || !exportedNodes .is (":empty"))
      {
         return
      }

      // Add empty scene.

      const child = $("<div></div>")
         .addClass (["empty-scene", "subtree"])

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["empty-scene", "description", "no-select"])
         .text ("Empty Scene")
         .appendTo (ul)

      this .connectSceneSubtree (parent, child)
   }

   connectSceneSubtree (parent, child)
   {
      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .on ("select_node.jstree", this .selectNode .bind (this))
         .appendTo (parent)
         .hide ()

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")

      child .find (".externproto, .proto, .node, .imported-node, .exported-node")
         .on ("dblclick", this .activateNode .bind (this))

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this))

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      if (this .isEditable (parent))
      {
         child .find (".externproto > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartExternProto .bind (this))

         child .find (".proto > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartProto .bind (this))

         child .find (".node:not([node-id=NULL]) > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartNode .bind (this))
      }

      child .find (".exported-node > .item .boolean-button")
         .on ("click", event => this .toggleImportedNode (event, parent))

      child .find (".visibility")
         .on ("click", this .toggleVisibility .bind (this))

      child .find (".tool")
         .on ("click", this .toggleTool .bind (this))

      // Expand children.

      const
         specialElements = child .find (".externproto, .proto, .imported-node, .exported-node"),
         elements        = child .find (".node")

      child .show ()
      this .expandSceneSubtreeComplete (specialElements, elements)
   }

   toggleImportedNode (event, parent) { }

   expandSceneSubtreeComplete (specialElements, elements)
   {
      this .updateRouteGraph ()

      // Reopen externprotos, protos, imported, exported nodes.

      for (const e of specialElements)
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (node && node .getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .jstree ("open_node", element)
         }
      }

      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (node .getUserData (_expanded) && element .jstree ("is_closed", element))
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }
   }

   updateSceneSubtree (parent, scene, type, func)
   {
      if (scene .externprotos .length || scene .protos .length || scene .rootNodes .length)
      {
         this .saveScrollPositions ()

         const oldSubtree = parent .find (`> .${type}.subtree`)

         this .disconnectSubtree (oldSubtree)

         const newSubtree = this [func] (parent, scene)

         oldSubtree .replaceWith (newSubtree .detach ())

         parent .find ("> .empty-scene.subtree") .detach ()

         this .restoreScrollPositions ()
      }
      else
      {
         this .updateScene (parent, scene)
      }
   }

   expandSceneExternProtoDeclarations (parent, scene)
   {
      scene .externprotos .addInterest ("updateSceneSubtree", this, parent, scene, "externprotos", "expandSceneExternProtoDeclarations")

      const child = $("<div></div>")
         .addClass (["externprotos", "subtree"])

      if (!scene .externprotos .length)
         return child .appendTo (parent)

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["externprotos", "description", "no-select"])
         .text ("Extern Prototypes")
         .appendTo (ul)

      let index = 0

      for (const externproto of scene .externprotos)
         ul .append (this .createNodeElement ("externproto", parent, externproto, index ++))

      this .connectSceneSubtree (parent, child)

      return child
   }

   expandSceneProtoDeclarations (parent, scene)
   {
      scene .protos .addInterest ("updateSceneSubtree", this, parent, scene, "protos", "expandSceneProtoDeclarations")

      const child = $("<div></div>")
         .addClass (["protos", "subtree"])

      if (!scene .protos .length)
         return child .appendTo (parent)

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["protos", "description", "no-select"])
         .text ("Prototypes")
         .appendTo (ul)

      let index = 0

      for (const proto of scene .protos)
         ul .append (this .createNodeElement ("proto", parent, proto, index ++))

      this .connectSceneSubtree (parent, child)

      return child
   }

   expandSceneRootNodes (parent, scene)
   {
      scene .rootNodes .addFieldCallback (this, this .updateSceneRootNodes .bind (this, parent, scene, "root-nodes", "expandSceneRootNodes"))

      parent .attr ("index", scene .rootNodes .length)

      const child = $("<div></div>")
         .addClass (["root-nodes", "subtree"])

      if (!scene .rootNodes .length)
         return child .appendTo (parent)

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["root-nodes", "description", "no-select"])
         .text ("Root Nodes")
         .appendTo (ul)

      let index = 0

      for (const rootNode of scene .rootNodes)
         ul .append (this .createNodeElement ("node", parent, rootNode ? rootNode .getValue () : null, index ++))

      // Added to prevent bug, that last route is not drawn right.
      $("<li></li>")
         .addClass (["last", "no-select"])
         .appendTo (ul)

      this .connectSceneSubtree (parent, child)

      return child
   }

   updateSceneRootNodes (parent, scene, type, func)
   {
      for (const node of scene .rootNodes)
      {
         if (!node ?.getNodeUserData (_changing))
            continue

         const nodes = Array .from (scene .rootNodes)

         setTimeout (() => nodes .forEach (n => n .setNodeUserData (_changing, false)))
         return
      }

      this .updateSceneSubtree (parent, scene, type, func)
   }

   expandSceneImportedNodes (parent, scene)
   {
      scene .importedNodes .addInterest ("updateSceneSubtree", this, parent, scene, "imported-nodes", "expandSceneImportedNodes")

      const child = $("<div></div>")
         .addClass (["imported-nodes", "subtree"])

      if (!scene .importedNodes .length)
         return child .appendTo (parent)

      const importedNodes = Array .from (scene .importedNodes) .sort ((a, b) =>
      {
         return this .naturalCompare (a .getImportedName (), b .getImportedName ())
      })

      const ul = $("<ul></ul>")
         .appendTo (child)

      $("<li></li>")
         .addClass (["imported-nodes", "description", "no-select"])
         .text ("Imported Nodes")
         .appendTo (ul)

      for (const importedNode of importedNodes)
      {
         try
         {
            ul .append (this .createImportedNodeElement ("imported-node", parent, scene, importedNode))
         }
         catch
         {
            // Exported node not found.
         }
      }

      // Added to prevent bug, that last route is not drawn right.
      $("<li></li>")
         .addClass (["last", "no-select"])
         .appendTo (ul)

      this .connectSceneSubtree (parent, child)

      return child
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
      this .saveScrollPositions ()

      this .removeSubtree (parent)
      this .expandNode (parent, node, full)

      this .restoreScrollPositions ()
   }

   expandNode (parent, node, full)
   {
      parent .data ("expanded",      true)
      parent .data ("full-expanded", full)

      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree")

      const ul = $("<ul></ul>")
         .appendTo (child)

      // Fields

      let fields = full ? node .getFields () : node .getChangedFields (true)

      if (!fields .length)
         fields = node .getFields ()

      if (node .canUserDefinedFields ())
      {
         // Move user-defined fields on top.

         const userDefinedFields = node .getUserDefinedFields ()

         fields .sort ((a, b) =>
         {
            const
               ua = userDefinedFields .get (a .getName ()) === a,
               ub = userDefinedFields .get (b .getName ()) === b

            return ub - ua
         })

         // Move metadata field on top.

         fields .sort ((a, b) =>
         {
            const
               ma = a .getName () === "metadata",
               mb = b .getName () === "metadata"

            return mb - ma
         })

         // Proto fields, user-defined fields.
         // Instances are updated, because they completely change.

         node .getPredefinedFields ()  .addInterest ("updateNode", this, parent, node, full)
         node .getUserDefinedFields () .addInterest ("updateNode", this, parent, node, full)
      }

      for (const field of fields)
         ul .append (this .createFieldElement (parent, node, field))

      // Extern proto

      if (parent .hasClass ("externproto"))
      {
         // URL

         ul .append (this .createFieldElement (parent, node, node ._url, "special"))

         // Proto

         node .getLoadState () .addFieldCallback (this, this .updateNode .bind (this, parent, node, full))

         if (this .expandExternProtoDeclarations && node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE)
            ul .append (this .createNodeElement ("proto", parent, node .getProtoDeclaration ()))
         else
            ul .append (this .createLoadStateElement (node .checkLoadState (), "Extern Prototype"))
      }

      // Proto Body or Instance Body

      if (node instanceof X3D .X3DProtoDeclaration)
      {
         ul .append (this .createSceneElement (node .getBody (), "Body", "proto-scene"))
      }
      else if (this .expandPrototypeInstances && node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
      {
         if (node .getBody ())
            ul .append (this .createSceneElement (node .getBody (), "Body", "instance-scene"))
         else
            ul .append (this .createLoadStateElement (node .getProtoNode () .checkLoadState (), node .getTypeName ()))
      }

      // X3DUrlObject scene or load state

      if (parent .is (".node, .imported-node, .exported-node") && node .getType () .includes (X3D .X3DConstants .X3DUrlObject))
      {
         // X3DUrlObject

         node .getLoadState () .addFieldCallback (this, this .updateNode .bind (this, parent, node, full))

         if (node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE && this .expandInlineNodes && node .getType () .includes (X3D .X3DConstants .Inline))
         {
            ul .append (this .createSceneElement (node .getInternalScene (), "Scene", "internal-scene"))
         }
         else
         {
            ul .append (this .createLoadStateElement (node .checkLoadState (), node .getTypeName ()))
         }
      }

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .fieldBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .fieldCloseNode .bind (this))
         .on ("select_node.jstree", this .selectField .bind (this))
         .appendTo (parent)
         .hide ()

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")

      child .find ("li")
         .on ("dblclick", this .activateField .bind (this))

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this))

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      child .find (".field .name, .special .name")
         .on ("mouseenter", this .updateTitle .bind (this))

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutConnector .bind (this, "input"))
         .on ("click", this .selectConnector .bind (this, "input"))

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutConnector .bind (this, "output"))
         .on ("click", this .selectConnector .bind (this, "output"))

      child .find ("area.input-routes-selector")
         .on ("click", this .selectRoutes .bind (this, "input"))

      child .find ("area.output-routes-selector")
         .on ("click", this .selectRoutes .bind (this, "output"))

      if (this .isEditable (parent))
      {
         child .find (".field > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartField .bind (this))
      }

      // Field Tools

      if (this .isEditable (parent))
         this .addFieldButtons (child .find (".boolean-button, .color-button, .time-button"))

      // Expand children.

      const
         protos   = child .find (".proto"),
         scenes   = child .find (".scene"),
         elements = child .find (".field, .special")

      child .show ()
      this .expandNodeComplete (protos, scenes, elements)
   }

   expandNodeComplete (protos, scenes, elements)
   {
      this .updateRouteGraph ()

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

   createLoadStateElement (loadState, typeName)
   {
      switch (loadState)
      {
         case X3D .X3DConstants .NOT_STARTED_STATE:
         {
            return $("<li></li>")
               .addClass (["description", "load-state", "not-started-state", "no-select"])
               .text (util .format (_ ("Loading %s not started"), typeName))
         }
         case X3D .X3DConstants .IN_PROGRESS_STATE:
         {
            return $("<li></li>")
               .addClass (["description", "load-state", "in-progress-state", "no-select"])
               .text (util .format (_ ("Loading %s in progress"), typeName))
         }
         case X3D .X3DConstants .COMPLETE_STATE:
         {
            return $("<li></li>")
               .addClass (["description", "load-state", "complete-state", "no-select"])
               .text (util .format (_ ("Loading %s completed"), typeName))
         }
         case X3D .X3DConstants .FAILED_STATE:
         {
            return $("<li></li>")
                  .addClass (["description", "load-state", "failed-state", "no-select"])
                  .text (util .format (_ ("Loading %s failed"), typeName))
         }
      }
   }

   createNodeElement (type, parent, node, index)
   {
      if (node)
      {
         this .objects .set (node .getId (), node .valueOf ())

         // These fields are observed and must never be disconnected, because clones would also lose connection.

         node .typeName_changed .addFieldCallback (this, this .updateNodeTypeName .bind (this, node))
         node .name_changed     .addFieldCallback (this, this .updateNodeName     .bind (this, node))
         node .parents_changed  .addFieldCallback (this, this .updateCloneCount   .bind (this, node))
      }

      // Classes

      const classes = [type]

      if (node)
      {
         if (node .getUserData (_primary))
            classes .push ("primary")

         if (node .getUserData (_selected))
            classes .push ("selected")

         if (this .isInParents (parent, node))
            classes .push ("circular-reference", "no-expand")
      }
      else
      {
         classes .push ("no-expand")
      }

      // Node

      const child = $("<li></li>")
         .addClass (classes)
         .attr ("node-id", node ? node .getId () : "NULL")
         .attr ("index", index)

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons [type]}.svg`)
         .appendTo (child)

      if (node)
      {
         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child)

         $("<span></span>")
            .addClass ("node-type-name")
            .text (this .typeNames [node .getTypeName ()] || node .getTypeName ())
            .appendTo (name)

         name .append (document .createTextNode (" "))

         $("<span></span>")
            .addClass ("node-name")
            .text (node .getDisplayName ())
            .appendTo (name)

         name .append (document .createTextNode (" "))

         const cloneCount = node .getCloneCount ?.() ?? 0

         $("<span></span>")
            .addClass ("clone-count")
            .text (cloneCount > 1 ? `[${cloneCount}]` : "")
            .appendTo (name)

         if (node .setHidden && !(node .getExecutionContext () .getOuterNode () instanceof X3D .X3DProtoDeclaration))
         {
            name .append (document .createTextNode (" "))

            $("<span></span>")
               .addClass (["visibility", "button", "material-symbols-outlined"])
               .addClass (node .isHidden () ? "off" : "")
               .text (node .isHidden () ? "visibility_off" : "visibility")
               .appendTo (name)
         }

         if (node .valueOf () .getType () .some (t => this .onDemandToolNodes .has (t)))
         {
            name .append (document .createTextNode (" "))

            $("<span></span>")
               .addClass (["tool", "button", "material-symbols-outlined"])
               .addClass (node .valueOf () === node ? "off" : "" )
               .text ("build_circle")
               .appendTo (name)
         }

         // Append empty tree to enable expander.

         if (!this .isInParents (parent, node))
            $("<ul><li></li></ul>") .appendTo (child)
      }
      else
      {
         $("<div></div>")
            .addClass ("name")
            .append ($("<span></span>") .addClass ("node-type-name") .text ("NULL"))
            .appendTo (child)
      }

      return child
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

   updateCloneCount (node)
   {
      const cloneCount = node .getCloneCount ?.() ?? 0

      this .sceneGraph
         .find (`.node[node-id=${node .getId ()}]`)
         .find ("> .item .clone-count")
         .text (cloneCount > 1 ? `[${cloneCount}]` : "")
   }

   isInParents (parent, node)
   {
      return parent .closest (".node[node-id=" + node .getId () + "]", this .sceneGraph) .length
   }

   importedNodeSymbol = Symbol ()

   createImportedNodeElement (type, parent, scene, importedNode)
   {
      importedNode .getInlineNode () .getLoadState () .addFieldCallback (this .importedNodeSymbol, this .updateScene .bind (this, parent, scene))

      try
      {
         this .objects .set (importedNode .getId (), importedNode)
         this .objects .set (importedNode .getExportedNode () .getId (), importedNode .getExportedNode ())

         // Node

         const child = $("<li></li>")
            .addClass (type)
            .attr ("imported-node-id", importedNode .getId ())
            .attr ("node-id", importedNode .getExportedNode () .getId ())

         // Icon

         const icon = $("<img></img>")
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons [type]}.svg`)
            .appendTo (child)

         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child)

         $("<span></span>")
            .addClass ("node-type-name")
            .text (importedNode .getExportedNode () .getTypeName ())
            .appendTo (name)

         name .append (document .createTextNode (" "))

         $("<span></span>")
            .addClass ("node-name")
            .text (importedNode .getExportedName ())
            .appendTo (name)

         if (importedNode .getExportedName () !== importedNode .getImportedName ())
         {
            name
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as") .text ("AS"))
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as-name") .text (importedNode .getImportedName ()))
         }

         // Append empty tree to enable expander.

         $("<ul><li></li></ul>") .appendTo (child)

         return child
      }
      catch
      {
         this .objects .set (importedNode .getId (), importedNode)

         // Node

         const child = $("<li></li>")
            .addClass ([type, "no-expand"])
            .attr ("imported-node-id", importedNode .getId ())

         // Icon

         const icon = $("<img></img>")
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons [type]}.svg`)
            .appendTo (child)

         // Name

         const name = $("<div></div>")
            .addClass ("name")
            .appendTo (child)

         $("<span></span>")
            .addClass ("node-name")
            .text (importedNode .getExportedName ())
            .appendTo (name)

         if (importedNode .getExportedName () !== importedNode .getImportedName ())
         {
            name
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as") .text ("AS"))
               .append (document .createTextNode (" "))
               .append ($("<span></span>") .addClass ("as-name") .text (importedNode .getImportedName ()))
         }

         return child
      }
   }

   exportedNodeSymbol = Symbol ()

   createExportedNodeElement (type, parent, exportedNode)
   {
      const node = exportedNode .getLocalNode ()

      this .objects .set (exportedNode .getId (), exportedNode)
      this .objects .set (node .getId (), node .valueOf ())

      node .typeName_changed .addFieldCallback (this .exportedNodeSymbol, this .updateNodeTypeName .bind (this, node))
      node .name_changed     .addFieldCallback (this .exportedNodeSymbol, this .updateNodeName     .bind (this, node))

      // Node

      const child = $("<li></li>")
         .addClass (type)
         .attr ("exported-node-id", exportedNode .getId ())
         .attr ("node-id", node .getId ())

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("src", `../images/OutlineEditor/Node/${this .nodeIcons [type]}.svg`)
         .appendTo (child)

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child)

      $("<span></span>")
         .addClass ("node-type-name")
         .text (node .getTypeName ())
         .appendTo (name)

      name .append (document .createTextNode (" "))

      $("<span></span>")
         .addClass ("node-name")
         .text (node .getName ())
         .appendTo (name)

      if (exportedNode .getExportedName () !== node .getName ())
      {
         name
            .append (document .createTextNode (" "))
            .append ($("<span></span>") .addClass ("as") .text ("AS"))
            .append (document .createTextNode (" "))
            .append ($("<span></span>") .addClass ("as-name") .text (exportedNode .getExportedName ()))
      }

      const exportedExecutionContext = exportedNode .getLocalNode () .getExecutionContext ();

      if (exportedExecutionContext !== this .executionContext && exportedExecutionContext .getExecutionContext () === this .executionContext)
      {
         const imported = this .executionContext .importedNodes
            .some (importedNode => importedNode .getExportedNode () === exportedNode .getLocalNode () && importedNode .getImportedName () === exportedNode .getExportedName ());

         $("<img></img>")
            .addClass ("boolean-button")
            .attr ("src", `../images/OutlineEditor/Values/${imported ? "TRUE" : "FALSE"}.svg`)
            .attr ("title", _ ("Toggle value."))
            .appendTo (child)
      }

      // Append empty tree to enable expander.

      $("<ul><li></li></ul>") .appendTo (child)

      return child
   }

   static connectorId = 0

   fieldButtonSymbol = Symbol ()

   createFieldElement (parent, node, field, type = "field")
   {
      this .objects .set (field .getId (), field)

      // Classes

      const classes = [type]

      if (field .getUserData (_primary))
         classes .push ("primary")

      if (field .hasReferences ())
         classes .push ("references")

      if (node .getUserDefinedFields () .get (field .getName ()) === field)
         classes .push ("user-defined")

      // Node

      const child = $("<li></li>")
         .addClass (classes)
         .attr ("node-id", node .getId ())
         .attr ("field-id", field .getId ())
         .attr ("type-name", field .getTypeName ())

      // Icon

      const icon = $("<img></img>")
         .addClass ("icon")
         .attr ("title", field .getTypeName ())
         .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName ()}.svg`)
         .appendTo (child)

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child)

      $("<span></span>")
         .addClass ("field-name")
         .text (field .getName ())
         .appendTo (name)

      field .addReferencesCallback (this, this .updateReferences .bind (this, parent, node, field))

      // Color

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         {
            $("<img></img>")
               .addClass ("boolean-button")
               .attr ("src", `../images/OutlineEditor/Values/${field .getValue () ? "TRUE" : "FALSE"}.svg`)
               .attr ("title", _ ("Toggle value."))
               .appendTo (child)

            field .addFieldCallback (this .fieldButtonSymbol, this .updateBoolean .bind (this, parent, node, field))
            break
         }
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFColorRGBA:
         {
            $("<div></div>")
               .addClass ("color-button")
               .attr ("title", _ ("Open color picker."))
               .css ("background-color", this .getColorFromField (field))
               .appendTo (child)

            field .addFieldCallback (this .fieldButtonSymbol, this .updateColor .bind (this, parent, node, field))
            break
         }
         case X3D .X3DConstants .SFTime:
         {
            $("<img></img>")
               .addClass ("time-button")
               .attr ("src", `../images/OutlineEditor/Values/Bell.svg`)
               .attr ("title", _ ("Set current time."))
               .appendTo (child)

            break
         }
         default:
            break
      }

      // Access type

      const accessType = $("<div></div>")
         .addClass (["access-type", this .accessTypes [field .getAccessType ()]])
         .appendTo (child)

      const mapId = ++ OutlineView .connectorId

      $("<img/>")
         .addClass ("image")
         .attr ("src", this .getAccessTypeImage (field))
         .attr ("usemap", "#connector-id-" + mapId)
         .appendTo (accessType)

      if (parent .is (".node, .imported-node, .exported-node"))
      {
         if (type !== "special")
            $("<canvas></canvas>") .addClass ("field-routes") .appendTo (accessType)

         const map = $("<map></map>")
            .attr ("id", "connector-id-" + mapId)
            .attr ("name", "connector-id-" + mapId)
            .appendTo (accessType)

         switch (field .getAccessType ())
         {
            case X3D .X3DConstants .initializeOnly:
            {
            	break
            }
            case X3D .X3DConstants .inputOnly:
            {
               $("<area></area>")
                  .attr ("title", _ ("Select input."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,13,12")
                  .addClass ("input-selector") .appendTo (map)

               const inputRoutesSelector = $("<area></area>")
                  .attr ("title", _ ("Select routes."))
                  .attr ("shape", "rect")
                  .attr ("coords", "20,0,28,7")
                  .addClass ("input-routes-selector") .appendTo (map)

               if (field .getInputRoutes () .size)
                  inputRoutesSelector .attr ("href", "#")

               break
            }
            case X3D .X3DConstants .outputOnly:
            {
               $("<area></area>")
                  .attr ("title", _ ("Select output."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,14,12")
                  .addClass ("output-selector") .appendTo (map)

               const outputRoutesSelector = $("<area></area>")
                  .attr ("title", _ ("Select routes."))
                  .attr ("shape", "rect")
                  .attr ("coords", "20,5,28,12")
                  .addClass ("output-routes-selector")
                  .appendTo (map)

               if (field .getOutputRoutes () .size)
                  outputRoutesSelector .attr ("href", "#")

               break
            }
            case X3D .X3DConstants .inputOutput:
            {
               $("<area></area>")
                  .attr ("title", _ ("Select input."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "0,0,13,12")
                  .addClass ("input-selector") .appendTo (map)

               $("<area></area>")
                  .attr ("title", _ ("Select output."))
                  .attr ("href", "#")
                  .attr ("shape", "rect")
                  .attr ("coords", "14,0,28,12")
                  .addClass ("output-selector")
                  .appendTo (map)

               const inputRoutesSelector = $("<area></area>")
                  .attr ("title", _ ("Select routes."))
                  .attr ("shape", "rect")
                  .attr ("coords", "34,0,42,7")
                  .addClass ("input-routes-selector")
                  .appendTo (map)

               if (field .getInputRoutes () .size)
                  inputRoutesSelector .attr ("href", "#")

               const outputRoutesSelector = $("<area></area>")
                  .attr ("title", _ ("Select routes."))
                  .attr ("shape", "rect")
                  .addClass ("output-routes-selector")
                  .appendTo (map)

               if (field .getInputRoutes () .size)
                  outputRoutesSelector .attr ("coords", "48,5,56,12")
               else
                  outputRoutesSelector .attr ("coords", "34,5,42,12")

               if (field .getOutputRoutes () .size)
                  outputRoutesSelector .attr ("href", "#")

            	break
            }
         }

         if (this .connector && this .connector .type === "input" && this .connector .field === field)
            var inputActivated = "activated"
         else
            var inputActivated = ""

         if (this .connector && this .connector .type === "output" && this .connector .field === field)
            var outputActivated = "activated"
         else
            var outputActivated = ""

         switch (field .getAccessType ())
         {
            case X3D .X3DConstants .initializeOnly:
            {
            	break
            }
            case X3D .X3DConstants .inputOnly:
            {
               $("<img/>")
                  .addClass (["active", "input", inputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "input"))
                  .appendTo (accessType)

            	break
            }
            case X3D .X3DConstants .outputOnly:
            {
               $("<img/>")
                  .addClass (["active", "output", outputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "output"))
                  .appendTo (accessType)

            	break
            }
            case X3D .X3DConstants .inputOutput:
            {
               $("<img/>")
                  .addClass (["active", "input", inputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "input"))
                  .appendTo (accessType)

               $("<img/>")
                  .addClass (["active", "output", outputActivated])
                  .attr ("src", this .getAccessTypeImage (field, "output"))
                  .appendTo (accessType)

               break
            }
         }

         // Route callback.

         field .addRouteCallback (this, this .updateFieldAccessType .bind (this, node, field))
      }

      // Append empty tree to enable expander.

      $("<ul><li></li></ul>") .appendTo (child)

      return child
   }

   updateTitle (event)
   {
      const
         name    = $(event .currentTarget),
         element = $(event .currentTarget) .closest (".field, .special", this .sceneGraph),
         node    = this .objects .get (parseInt (element .attr ("node-id"))),
         field   = this .objects .get (parseInt (element .attr ("field-id")))

      if (field instanceof X3D .X3DArrayField)
      {
         name .attr ("title", util .format (field .length === 1 ? _ ("%s value") : _ ("%s values"), field .length .toLocaleString (_.locale)))
      }
      else
      {
         name .attr ("title", field .toString ({ scene: node .getExecutionContext () }))
      }
   }

   updateReferences (parent, node, field)
   {
      const element = parent .find (`.field[field-id=${field .getId ()}]`)

      if (field .hasReferences ())
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
         .css ("background-color", this .getColorFromField (field))
   }

   getColorFromField (field)
   {
      const
         r = Math .floor (field .r * 255),
         g = Math .floor (field .g * 255),
         b = Math .floor (field .b * 255),
         a = field .a ?? 1

      return `rgba(${r},${g},${b},${a})`
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
      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            if (!field .getValue () || !field ?.getNodeUserData (_changing))
               break

            setTimeout (() => field .setNodeUserData (_changing, false))
            return
         }
         case X3D .X3DConstants .MFNode:
         {
            for (const node of field)
            {
               if (!node ?.getNodeUserData (_changing))
                  continue

               const nodes = Array .from (field)

               setTimeout (() => nodes .forEach (n => n .setNodeUserData (_changing, false)))
               return
            }

            break
         }
      }

      this .saveScrollPositions ()

      this .removeSubtree (parent)
      this .expandField (parent, node, field, type, full && (field .getInputRoutes () .size || field .getOutputRoutes () .size))

      this .restoreScrollPositions ()
   }

   routesFullSymbol = Symbol ()

   expandField (parent, node, field, type, full)
   {
      parent .data ("expanded",      true)
      parent .data ("full-expanded", full)

      if (full)
         parent .find (".access-type") .addClass ("hidden")
      else
         parent .find (".access-type") .removeClass ("hidden")

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            field .addFieldCallback (this, this .updateField .bind (this, parent, node, field, type, full))

            this .expandSFNode (parent, node, field, type, full)
            break
         }
         case X3D .X3DConstants .MFNode:
         {
            field .addFieldCallback (this, this .updateField .bind (this, parent, node, field, type, full))

            this .expandMFNode (parent, node, field, type, full)
            break
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
            this .expandSingleField (parent, node, field, type, full)
            break
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
            this .expandArrayField (parent, node, field, type, full)
            break
         }
         default:
         {
            break
         }
      }

      if (full)
         field .addRouteCallback (this .routesFullSymbol, this .updateField .bind (this, parent, node, field, type, full))
   }

   expandMFNode (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree")

      const ul = $("<ul></ul>")
         .appendTo (child)

      if (full)
         ul .append (this .createRouteElements (node, field))

      let index = 0

      for (const node of field)
         ul .append (this .createNodeElement ("node", parent, node ? node .getValue () : null, index ++))

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .on ("select_node.jstree", this .selectNode .bind (this))
         .appendTo (parent)
         .hide ()

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")

      child .find (".node")
         .on ("dblclick", this .activateNode .bind (this))

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this))

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      if (this .isEditable (parent))
      {
         child .find (".node:not([node-id=NULL]) > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartNode .bind (this))
      }

      child .find (".visibility")
         .on ("click", this .toggleVisibility .bind (this))

      child .find (".tool")
         .on ("click", this .toggleTool .bind (this))

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "input"))
         .on ("click", this .selectSingleConnector .bind (this, "input"))

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "output"))
         .on ("click", this .selectSingleConnector .bind (this, "output"))

      child .find ("area.input-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "input"))

      child .find ("area.output-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "output"))

      // Expand children.

      const elements = child .find (".node")

      child .show ()
      this .expandMFNodeComplete (elements, field)
   }

   expandMFNodeComplete (elements, field)
   {
      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (!node)
            continue

         if (node .getUserData (_expanded) === field .getId ())
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }

      this .updateRouteGraph ()
   }

   expandSFNode (parent, node, field, type, full)
   {
      // Generate tree.

      const child = $("<div></div>")
         .addClass ("subtree")

      const ul = $("<ul></ul>")
         .appendTo (child)

      if (full)
         ul .append (this .createRouteElements (node, field))

      ul .append (this .createNodeElement ("node", parent, field .getValue ()))

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("before_open.jstree", this .nodeBeforeOpen .bind (this))
         .on ("close_node.jstree",  this .nodeCloseNode .bind (this))
         .on ("select_node.jstree", this .selectNode .bind (this))
         .appendTo (parent)
         .hide ()

      child
         .removeAttr ("tabindex")
         .find (".jstree-anchor")
            .removeAttr ("href")
            .removeAttr ("tabindex")

      child .find (".node")
         .on ("dblclick", this .activateNode .bind (this))

      child .find (".jstree-ocl")
         .addClass ("material-icons")
         .text ("arrow_right")
         .on ("click", this .selectExpander .bind (this))
         .on ("dblclick", this .activateExpander .bind (this))

      child .find (".jstree-node")
         .wrapInner ("<div class=\"item no-select\"/>")
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      if (this .isEditable (parent))
      {
         child .find (".node:not([node-id=NULL]) > .item")
            .attr ("draggable", "true")
            .on ("dragstart", this .onDragStartNode .bind (this))
      }

      child .find (".visibility")
         .on ("click", this .toggleVisibility .bind (this))

      child .find (".tool")
         .on ("click", this .toggleTool .bind (this))

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "input"))
         .on ("click", this .selectSingleConnector .bind (this, "input"))

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "output"))
         .on ("click", this .selectSingleConnector .bind (this, "output"))

      child .find ("area.input-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "input"))

      child .find ("area.output-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "output"))

      // Expand children.

      const elements = child .find (".node")

      child .show ()
      this .expandSFNodeComplete (elements, field)
   }

   expandSFNodeComplete (elements, field)
   {
      // Reopen nodes.

      for (const e of elements)
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (!node)
            continue

         if (node .getUserData (_expanded) === field .getId ())
         {
            element .data ("auto-expand", true)
            element .jstree ("open_node", element)
         }
      }

      this .updateRouteGraph ()
   }

   nodeIcons = {
      "proto": "Prototype",
      "externproto": "ExternProto",
      "node": "X3DBaseNode",
      "imported-node": "ImportedNode",
      "exported-node": "ExportedNode",
   }

   typeNames = {
      "X3DExternProtoDeclaration": "EXTERNPROTO",
      "X3DProtoDeclaration": "PROTO",
   }

   expandSingleField (parent, node, field, type, full)
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
         .append ($("<input></input>") .attr ("type", "text"))
         .appendTo (li)

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("select_node.jstree", this .selectField .bind (this))
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
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "input"))
         .on ("click", this .selectSingleConnector .bind (this, "input"))

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "output"))
         .on ("click", this .selectSingleConnector .bind (this, "output"))

      child .find ("area.input-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "input"))

      child .find ("area.output-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "output"))

      // Input

      const input = child .find ("input")

      if (field .getType () === X3D .X3DConstants .SFString)
         input .val (field .getValue ())
      else
         input .val (field .toString ({ scene: node .getExecutionContext () }))

      if ((field .isInput () || field .isInitializable ()) && this .isEditable (parent))
      {
         input .on ("keydown",  this .onkeydownField .bind (this, input))
         input .on ("focusin",  this .disconnectField .bind (this, field))
         input .on ("focusout", this .connectField .bind (this, input, node, field, true))
      }
      else
      {
         input .attr ("disabled", "disabled")
      }

      this .connectField (input, node, field, false)

      // Expand children.

      child .show ()
      this .updateRouteGraph ()
   }

   onkeydownField (input, event)
   {
      if (event .key === "Enter")
         input .blur ()
   }

   disconnectField (field)
   {
      field .removeFieldCallback (this)
   }

   fieldValueSymbol = Symbol ()

   connectField (input, node, field, assign)
   {
      field .addFieldCallback (this .fieldValueSymbol, () =>
      {
         if (field .getType () === X3D .X3DConstants .SFString)
            input .val (field .getValue ())
         else
            input .val (field .toString ({ scene: node .getExecutionContext () }))
      })

      if (assign)
         this .onFieldEdited (input, node, field)
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
         .append ($("<textarea></textarea>"))
         .appendTo (li)

      // Make jsTree.

      child
         .jstree ()
         .off ("keypress.jstree dblclick.jstree")
         .on ("select_node.jstree", this .selectField .bind (this))
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
         .find (".item") .append ("<div class=\"route-curves\"><canvas></canvas></div>")

      child .find ("area.input-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "input"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "input"))
         .on ("click", this .selectSingleConnector .bind (this, "input"))

      child .find ("area.output-selector")
         .on ("mouseenter", this .hoverInSingleConnector .bind (this, "output"))
         .on ("mouseleave", this .hoverOutSingleConnector .bind (this, "output"))
         .on ("click", this .selectSingleConnector .bind (this, "output"))

      child .find ("area.input-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "input"))

      child .find ("area.output-routes-selector")
         .on ("click", this .selectSingleRoute .bind (this, "output"))

      // Textarea

      const textarea = child .find ("textarea")

      this .setTextAreaTabs (textarea)
      this .setTextArea (textarea, node, field)

      textarea .on ("mouseenter", this .updateTitle .bind (this))

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
      this .updateRouteGraph ()
   }

   onkeydownArrayField (textarea, event)
   {
      if ((event .ctrlKey || event .metaKey) && event .key === "Enter")
         textarea .blur ()
   }

   connectArrayField (textarea, node, field, assign)
   {
      field .addFieldCallback (this .fieldValueSymbol, this .setTextArea .bind (this, textarea, node, field))

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
         .attr ("route-type", type)

      // Icon

      $("<img></img>")
         .addClass ("icon")
         .attr ("src", "../images/OutlineEditor/Node/Route.svg")
         .appendTo (child)

      // Name

      const name = $("<div></div>")
         .addClass ("name")
         .appendTo (child)

      const connectorDescription = $("<span></span>")
         .addClass ("connector-description")
         .appendTo (name)

      switch (type)
      {
         case "input":
         {
            connectorDescription .text (util .format (_ ("Route from %s<%s>.%s"), route .getSourceNode () .getTypeName (), route .getSourceNode () .getName () || _ ("unnamed"), route .sourceField))
            break
         }
         case "output":
         {
            connectorDescription .text (util .format (_ ("Route to %s<%s>.%s"), route .getDestinationNode () .getTypeName (), route .getDestinationNode () .getName () || _ ("unnamed"), route .destinationField))
            break
         }
      }

      const accessType = $("<div></div>")
         .addClass (["access-type", type])
         .appendTo (child)

      const singleRoute = $("<canvas></canvas>")
         .addClass ("single-route")
         .appendTo (accessType)

      const mapId = ++ OutlineView .connectorId

      switch (type)
      {
         case "input":
         {
            $("<img/>") .addClass ("image") .attr ("src", "../images/OutlineEditor/AccessTypes/inputOnly.1.png") .attr ("usemap", "#connector-id-" + mapId) .appendTo (accessType)
            break
         }
         case "output":
         {
            $("<img/>") .addClass ("image") .attr ("src", "../images/OutlineEditor/AccessTypes/outputOnly.1.png") .attr ("usemap", "#connector-id-" + mapId) .appendTo (accessType)
            break
         }
      }

      const map = $("<map></map>")
         .attr ("id", "connector-id-" + mapId)
         .attr ("name", "connector-id-" + mapId)
         .appendTo (accessType)

      switch (type)
      {
         case "input":
         {
            $("<area></area>")
               .attr ("title", process .platform === "darwin" ? _ ("Remove route (Cmd+Click).") : _ ("Remove route (Ctrl+Click)."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "0,0,13,12")
               .addClass ("input-selector")
               .appendTo (map)

            $("<area></area>")
               .attr ("title", _ ("Select route."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "20,0,28,7")
               .addClass ("input-routes-selector")
               .appendTo (map)

            break
         }
         case "output":
         {
            $("<area></area>")
               .attr ("title", process .platform === "darwin" ? _ ("Remove route (Cmd+Click).") : _ ("Remove route (Ctrl+Click)."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "0,0,14,12")
               .addClass ("output-selector")
               .appendTo (map)

            $("<area></area>")
               .attr ("title", _ ("Select route."))
               .attr ("href", "#")
               .attr ("shape", "rect")
               .attr ("coords", "20,5,28,12")
               .addClass ("output-routes-selector")
               .appendTo (map)

            break
         }
      }

      switch (type)
      {
         case "input":
         {
            $("<img/>") .addClass (["active", "input"]) .attr ("src", this .getAccessTypeImage (field, "input")) .appendTo (accessType)
            break
         }
         case "output":
         {
            $("<img/>") .addClass (["active", "output"]) .attr ("src", this .getAccessTypeImage (field, "output")) .appendTo (accessType)
            break
         }
      }

      return child
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
            const single = new (field .getSingleType ()) ()

            textarea .val (Array .from (field, value =>
            {
               single .setValue (value)

               return single .toString ({ scene: node .getExecutionContext () })
            })
            .join (",\n"))
            break
         }
         case X3D .X3DConstants .MFInt32:
         {
            textarea .val (field .join (",\n"))
            break
         }
         case X3D .X3DConstants .MFString:
         {
            textarea .val (field .getValue () .map (value => value .toString ()) .join (",\n"))
            break
         }
         default:
         {
            textarea .val (Array .from (field, value => value .toString ({ scene: node .getExecutionContext () })) .join (",\n"))
            break
         }
      }
   }

   nodeBeforeOpen (event, leaf)
   {
      const
         element = $("#" + leaf .node .id),
         node    = this .getNode (element),
         field   = this .getField (element .closest (".field, .scene", this .sceneGraph))

      let full = node .getUserData (_fullExpanded) || element .data ("full-expanded")

      if (!element .data ("auto-expand"))
      {
         if (this .actionKeys .value === ActionKeys .Shift)
            full = !full
      }

      element .data ("auto-expand", false)

      this .nodeCloseClones (element)
      this .beforeOpen (element)
      this .expandNode (element, node, full)

      node .setUserData (_expanded,     field ?.getId () ?? true)
      node .setUserData (_fullExpanded, full)
   }

   nodeCloseClones (element)
   {
      const opened = this .sceneGraph .find (`.node[node-id=${element .attr ("node-id")}], .imported-node[node-id=${element .attr ("node-id")}], .exported-node[node-id=${element .attr ("node-id")}]`)

      opened .each (function (key, value)
      {
         if (value !== element .get (0))
            $(value) .jstree ("close_node", value)
      })
   }

   fieldBeforeOpen (event, leaf)
   {
      const element = $("#" + leaf .node .id)

      if (element .hasClass ("proto"))
      {
         this .nodeBeforeOpen (event, leaf)
      }

      if (element .hasClass ("scene"))
      {
         const scene = this .getNode (element)

         this .beforeOpen (element)
         this .expandScene (element, scene)

         scene .setUserData (_expanded, true)
      }

      if (element .is (".field, .special"))
      {
         const
            node  = this .getNode (element),
            field = this .getField (element)

         let full = field .getUserData (_fullExpanded) || element .data ("full-expanded")

         if (!element .data ("auto-expand"))
         {
            if (this .actionKeys .value === ActionKeys .Shift)
               full = !full
         }

         element .data ("auto-expand", false)

         this .beforeOpen (element)
         this .expandField (element, node, field, "field", full)

         field .setUserData (_expanded,     true)
         field .setUserData (_fullExpanded, full)
      }
   }

   beforeOpen (element)
   {
      element .find (".jstree-ocl") .text ("arrow_drop_down")
      element .find ("ul") .remove ()
   }

   nodeCloseNode (event, leaf)
   {
      const
         element = $("#" + leaf .node .id),
         node    = this .getNode (element)

      node .setUserData (_expanded, false)

      this .closeNode (element)
   }

   fieldCloseNode (event, leaf)
   {
      const element = $("#" + leaf .node .id)

      if (element .hasClass ("proto"))
      {
         this .nodeCloseNode (event, leaf)
      }

      if (element .hasClass ("scene"))
      {
         const scene = this .getNode (element)

         element .find (".access-type") .removeClass ("hidden")

         scene .setUserData (_expanded, false)

         this .closeNode (element)
      }

      if (element .is (".field, .special"))
      {
         const field = this .getField (element)

         element .find (".access-type") .removeClass ("hidden")

         field .setUserData (_expanded, false)

         this .closeNode (element)
      }
   }

   closeNode (element)
   {
      element .find (".jstree-ocl") .text ("arrow_right")
      element .data ("expanded",      false)
      element .data ("full-expanded", false)

      // Collapse children.

      const child = element .find ("> .subtree")

      child .hide ()
      this .afterClose (element)
   }

   afterClose (element)
   {
      this .removeSubtree (element)

      if (this .actionKeys .value === ActionKeys .Shift)
         element .jstree ("open_node", element)

      this .updateRouteGraph ()
   }

   removeSubtree (element)
   {
      this .disconnectSubtree (element)

      // Remove subtree.

      element .find ("> .subtree") .remove ()
   }

   disconnectSubtree (element)
   {
      // Don't disconnect typeName and name change, because they normally do not change, and clones cannot be handled.

      element .find (".scene") .addBack (".scene") .each ((i, e) =>
      {
         const
            element = $(e),
            scene   = this .getNode (element)

         scene .externprotos  .removeInterest ("updateSceneSubtree", this)
         scene .protos        .removeInterest ("updateSceneSubtree", this)
         scene .importedNodes .removeInterest ("updateSceneSubtree", this)

         scene .rootNodes .removeFieldCallback (this)

         if (scene instanceof X3D .X3DScene)
         {
            scene .units         .removeInterest ("updateScene",        this)
            scene .exportedNodes .removeInterest ("updateSceneSubtree", this)
         }
      })

      element .find (".externproto") .addBack (".externproto") .each ((i, e) =>
      {
         const
            element = $(e),
            node    = this .getNode (element)

         node .getLoadState () .removeFieldCallback (this)
      })

      element .find (".node") .addBack (".node") .each ((i, e) =>
      {
         const
            element = $(e),
            node    = this .getNode (element)

         if (!node)
            return

         if (node .getType () .includes (X3D .X3DConstants .X3DUrlObject))
            node .getLoadState () .removeFieldCallback (this)

         node .getPredefinedFields ()  .removeInterest ("updateNode", this)
         node .getUserDefinedFields () .removeInterest ("updateNode", this)
      })

      element .find (".field, .special") .each ((i, e) =>
      {
         const
            element = $(e),
            field   = this .getField (element)

         field .removeReferencesCallback (this)
         field .removeRouteCallback (this)
         field .removeFieldCallback (this)
         field .removeFieldCallback (this .fieldButtonSymbol)
         field .removeFieldCallback (this .fieldValueSymbol)
      })

      // Field is collapsed.

      if (element .is (".field, .special"))
      {
         element .each ((i, e) =>
         {
            const
               element = $(e),
               field   = this .getField (element)

            field .removeRouteCallback (this .routesFullSymbol)
            field .removeFieldCallback (this .fieldValueSymbol)
         })
      }

      // Color fields.

      this .removeFieldButtons (element .find (".color-button"))
   }

   selectAll ()
   {
      this .deselectAll ()

      const elements = this .sceneGraph .find ("> .root-nodes > ul > li[node-id]")

      for (const element of elements)
         this .selectNodeElement ($(element), true)
   }

   deselectAll ()
   {
      const
         selection = require ("../Application/Selection"),
         nodes     = this .sceneGraph .find (".primary, .selected")

      nodes .removeClass ("primary") .removeClass ("selected")

      for (const element of nodes)
         this .getNode ($(element)) .setUserData (_primary, false)

      for (const element of nodes)
         this .getNode ($(element)) .setUserData (_selected, false)

      selection .clear ()
   }

   toggleVisibility (event)
   {
      event .preventDefault ()
      event .stopImmediatePropagation ()

      const
         target  = $(event .target),
         element = target .closest (".node", this .sceneGraph),
         node    = this .getNode (element),
         hidden  = !node .isHidden ()

      node .setHidden (hidden)

      this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
         .find ("> .item .visibility")
         .removeClass ("off")
         .addClass (hidden ? "off" : "")
         .text (hidden ? "visibility_off" : "visibility")
   }

   toggleTool (event)
   {
      event .preventDefault ()
      event .stopImmediatePropagation ()

      const
         target  = $(event .target),
         element = target .closest (".node", this .sceneGraph),
         node    = this .getNode (element),
         tool    = node .getTool ()

      if (tool)
      {
         tool .removeTool ()
      }
      else
      {
         node .addTool ("createOnDemand")
         node .getTool () .setSelected (element .hasClass ("selected"))
      }

      this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
         .find ("> .item .tool")
         .removeClass ("off")
         .addClass (tool ? "off" : "")
   }

   hideUnselectedObjects ()
   {
      // Hide all X3DShapeNode nodes and show all other nodes.

      Traverse .traverse (this .executionContext, Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, node =>
      {
         if (!node .setHidden)
            return

         node .setHidden (node .getType () .includes (X3D .X3DConstants .X3DShapeNode))

         this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
            .find ("> .item .visibility")
            .removeClass ("off")
            .addClass (node .isHidden () ? "off" : "")
            .text (node .isHidden () ? "visibility_off" : "visibility")
      })

      // Show all nodes in selection.

      const selection = require ("../Application/Selection");

      Traverse .traverse ([... selection .nodes .values ()], Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, node =>
      {
         if (!node .setHidden)
            return

         if (!node .getType () .includes (X3D .X3DConstants .X3DShapeNode))
            return

         node .setHidden (false)

         this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
            .find ("> .item .visibility")
            .removeClass ("off")
            .text ("visibility")
      })
   }

   showSelectedObjects ()
   {
      const selection = require ("../Application/Selection")

      Traverse .traverse (selection .nodes .size ? [... selection .nodes .values ()] : this .executionContext, Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, node =>
      {
         if (!node .setHidden)
            return

         node .setHidden (false)

         this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
            .find ("> .item .visibility")
            .removeClass ("off")
            .text ("visibility")
      })
   }

   showAllObjects ()
   {
      Traverse .traverse (this .executionContext, Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, node =>
      {
         if (!node .setHidden)
            return

         node .setHidden (false)

         this .sceneGraph .find (`.node[node-id=${node .getId ()}]`)
            .find ("> .item .visibility")
            .removeClass ("off")
            .text ("visibility")
      })
   }

   selectNode (event, selected)
   {
      // Click on node.

      selected .instance .deselect_node (selected .node)

      this .clearConnectors ()

      const element = $("#" + selected .node .id)

      if (element .hasClass ("node"))
         this .selectNodeElement (element, window .event .shiftKey || window .event .metaKey)
      else if (element .is (".externproto, .proto"))
         this .selectPrimaryElement (element)
   }

   selectNodeElement (element, add = false)
   {
      if (!element .hasClass ("node"))
         return

      if (!this .isEditable (element))
         return

      const
         selection        = require ("../Application/Selection"),
         selected         = element .hasClass ("selected"),
         selectedElements = this .sceneGraph .find (".primary, .selected"),
         node             = this .getNode (element),
         elements         = $(`.node[node-id=${node .getId ()}]`)

      for (const element of selectedElements)
         this .getNode ($(element)) .setUserData (_primary, false)

      selectedElements .removeClass ("primary")

      if (add)
      {
         node .setUserData (_primary,  true)
         node .setUserData (_selected, !selected)

         if (selected)
         {
            element .removeClass ("selected") .addClass ("primary")
         }
         else
         {
            element .addClass (["primary", "selected"])
            elements .addClass ("selected")
         }

         if (selected)
            selection .remove (node)
         else
            selection .add (node)
      }
      else
      {
         for (const element of selectedElements)
            this .getNode ($(element)) .setUserData (_selected, false)

         node .setUserData (_primary,  true)
         node .setUserData (_selected, true)

         selectedElements .removeClass ("selected")
         element .addClass (["primary", "selected"])
         elements .addClass ("selected")
         selection .set (node)
      }
   }

   selectPrimaryElement (element)
   {
      if (!this .isEditable (element))
         return

      this .sceneGraph .find (".primary") .removeClass ("primary")

      element .addClass ("primary")
   }

   selectField (event, selected)
   {
      // Click on field.

      selected .instance .deselect_node (selected .node)

      this .clearConnectors ()

      // Make primary selection from user defined field.

      const element = $(`#${selected .node .id}`)

      if (!element .hasClass ("field"))
         return

      const
         node  = this .getNode (element),
         field = this .getField (element)

      if (node .canUserDefinedFields () && node .getUserDefinedFields () .has (field .getName ()) && this .isEditable (element .parent ()))
      {
         this .selectPrimaryElement (element)
      }
   }

   selectExpander ()
   {
      // Click on expander.

      this .treeView .trigger ("focus")
   }

   clearConnectors ()
   {
      // Clear connectors.
   }

   activateExpander (event)
   {
      // Double click on expander.

      event .preventDefault ()
      event .stopImmediatePropagation ()
   }

   activateNode (event)
   {
      // Double click on externproto, proto, node.

      event .preventDefault ()
      event .stopImmediatePropagation ()
   }

   activateField (event)
   {
      // Double click on field.

      event .preventDefault ()
      event .stopImmediatePropagation ()
   }

   updateFieldAccessType (node, field)
   {
      const element = this .sceneGraph .find (`.field[field-id=${field .getId ()}]`)

      // Update access type image.

      element
         .find ("> .item .access-type img.image")
         .attr ("src", this .getAccessTypeImage (field))

      // Update route selectors.

      if (field .getAccessType () == X3D .X3DConstants .inputOutput)
      {
         const area = element .find ("area.output-routes-selector")

         if (field .getInputRoutes () .size)
            area .attr ("coords", "48,5,56,12")
         else
            area .attr ("coords", "34,5,42,12")
      }

      if (field .getInputRoutes () .size)
      {
         const area = element .find ("area.input-routes-selector")

         if (field .getInputRoutes () .size)
            area .attr ("href", "#")
         else
            area .removeAttr ("href")
      }

      if (field .getOutputRoutes () .size)
      {
         const area = element .find ("area.output-routes-selector")

         if (field .getOutputRoutes () .size)
            area .attr ("href", "#")
         else
            area .removeAttr ("href")
      }

      // Update route graph.

      this .updateRouteGraph ()
   }

   isEditable (parent)
   {
      if (parent .is (".externproto, .special"))
         parent = parent .closest (".scene")

      if (parent .closest (".externproto, .instance-scene, .internal-scene, .imported-node .node, .imported-node .field", this .sceneGraph) .length)
      {
         return false
      }

      return true
   }

   getNode (element)
   {
      return this .objects .get (parseInt (element .attr ("node-id")))
   }

   getExportedNode (element)
   {
      return this .objects .get (parseInt (element .attr ("exported-node-id")))
   }

   getField (element)
   {
      return this .objects .get (parseInt (element .attr ("field-id")))
   }

	getRoute (element, routes)
	{
		const id = parseInt (element .attr ("route-id"))

		for (const route of routes)
		{
			if (route .getId () === id)
				return route
		}

		return null
	}

   onresize ()
   {
      this .updateRouteGraph ()
   }

   addFieldButtons (elements)
   {
      elements .each ((i, e) =>
      {
         const element = $(e)

         switch (element .attr ("class"))
         {
            case "boolean-button":
               return this .addBooleanField (element)
            case "color-button":
               return this .addColorField (element)
            case "time-button":
               return this .addTimeField (element)
         }
      })
   }

   addBooleanField (element) { }

   addColorField (element) { }

   addTimeField (element) { }

	removeFieldButtons (elements)
   {
      elements .each ((i, e) => this .removeColorField ($(e)))
   }

   removeColorField (element) { }

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
      // Select routes.
   }

   selectSingleRoute (type, event)
   {
      // Select single route.
   }

   updateRouteGraph ()
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

   expandTo (object)
   {
      let flags = Traverse .ROOT_NODES

      if (this .expandExternProtoDeclarations)
         flags |= Traverse .EXTERNPROTO_DECLARATIONS | Traverse .EXTERNPROTO_DECLARATION_SCENE

      flags |= Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY

      if (this .expandInlineNodes)
         flags |= Traverse .INLINE_SCENE

      flags |= Traverse .ROOT_NODES

      if (this .expandPrototypeInstances)
         flags |= Traverse .PROTOTYPE_INSTANCES

      flags |= Traverse .IMPORTED_NODES

      const hierarchies = Traverse .find (this .executionContext, object, flags)

      for (const hierarchy of hierarchies .reverse ())
      {
         hierarchy .shift () // execution context

         this .expandHierarchy (hierarchy, this .sceneGraph)
         break
      }
   }

   static objectClasses = {
      "X3DExternProtoDeclaration": "externproto",
      "X3DProtoDeclaration": "proto",
      "X3DScene": "scene",
      "X3DExecutionContext": "scene",
   }

   expandHierarchy (hierarchy, parent)
   {
      const object = hierarchy .shift ()

      if (!object)
         return

      if (object instanceof X3D .X3DField)
      {
         const element = parent .find (`.field[field-id=${object .getId ()}]`)

         element .jstree ("open_node", element)

         this .expandHierarchy (hierarchy, element)
      }
      else if (object instanceof X3D .X3DImportedNode)
      {
         const element = parent .find (`.imported-node[imported-node-id=${object .getId ()}]`)

         element .jstree ("open_node", element)

         this .expandHierarchy (hierarchy, element)
      }
      else
      {
         const
            objectClass = OutlineView .objectClasses [object .getTypeName ()] || "node",
            element     = parent .find (`.${objectClass}[node-id=${object .getId ()}]`)

         element .jstree ("open_node", element)

         this .expandHierarchy (hierarchy, element)
      }
   }

   scrollPositions = [ ]
   scrollTimeoutId = 0

   saveScrollPositions ()
   {
      this .scrollPositions .push ([this .treeView .scrollTop (), this .treeView .scrollLeft ()])

      cancelAnimationFrame (this .scrollTimeoutId)

      this .scrollTimeoutId = requestAnimationFrame (() => this .scrollPositions .length = 0)
   }

   restoreScrollPositions ()
   {
      const scrollPositions = this .scrollPositions [0]

      this .treeView .scrollTop (scrollPositions [0])
      this .treeView .scrollLeft (scrollPositions [1])
   }

   saveExpanded ()
   {
      if (!this .executionContext)
         return

      const
         config   = this .getFileConfig (this .executionContext),
         expanded = this .saveExpandedNodes (this .sceneGraph .find ("> div > ul > li"), [ ], [ ])

      config .expanded   = expanded
      config .scrollTop  = this .treeView .scrollTop ()
      config .scrollLeft = this .treeView .scrollLeft ()
   }

   saveExpandedNodes (elements, path, expanded)
   {
      elements .each ((i, e) =>
      {
         const element = $(e)

         path .push (element .hasClass ("field") ? this .getField (element) .getName () : i)

         if (element .data ("expanded"))
         {
            expanded .push ({
            	path: path .join (":"),
            	fullExpanded: element .data ("full-expanded"),
            })
         }

         this .saveExpandedNodes (element .find ("> div > ul > li"), path, expanded)

         path .pop ()
      })

      return expanded
   }

   restoreExpanded ()
   {
      const expanded = new Map ()

      this .fileConfig .setDefaultValues ({
         expanded: [ ],
         scrollTop: 0,
         scrollLeft: 0,
      })

      for (const row of this .fileConfig .expanded)
         expanded .set (row .path, row)

      this .restoreExpandedNodes (this .sceneGraph .find ("> div > ul > li"), [ ], expanded)

      this .treeView .scrollTop (this .fileConfig .scrollTop)
      this .treeView .scrollLeft (this .fileConfig .scrollLeft)
   }

   restoreExpandedNodes (elements, path, expanded)
   {
      elements .each ((i, e) =>
      {
         const element = $(e)

         path .push (element .hasClass ("field") ? this .getField (element) .getName () : i)

         const data = expanded .get (path .join (":"))

         if (data)
         {
            element .data ("full-expanded", data .fullExpanded)
            element .jstree ("open_node", element)

            this .restoreExpandedNodes (element .find ("> div > ul > li"), path, expanded)
         }

         path .pop ()
      })
   }
}
