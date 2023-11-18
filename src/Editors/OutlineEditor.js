"use strict"

const
   $                 = require ("jquery"),
   electron          = require ("electron"),
   X3D               = require ("../X3D"),
   OutlineRouteGraph = require ("./OutlineRouteGraph"),
   Editor            = require ("../Undo/Editor"),
   UndoManager       = require ("../Undo/UndoManager"),
   _                 = require ("../Application/GetText")

module .exports = class OutlineEditor extends OutlineRouteGraph
{
   constructor (element)
   {
      super (element)

      element .on ("contextmenu", (event) => this .showContextMenu (event))

      electron .ipcRenderer .on ("outline-editor-menu", (event, key, ...args) => this [key] (...args))
      electron .ipcRenderer .on ("remove-empty-groups", (event) => this .removeEmptyGroups ())

      this .setup ()
   }

   updateComponents ()
   {
      super .updateComponents ()

      this .matrixNodes = new Set ([
         X3D .X3DConstants .Billboard,
         X3D .X3DConstants .CADPart,
         X3D .X3DConstants .GeoLocation,
         X3D .X3DConstants .GeoTransform,
         X3D .X3DConstants .HAnimHumanoid,
         X3D .X3DConstants .HAnimJoint,
         X3D .X3DConstants .HAnimSite,
         X3D .X3DConstants .LayoutGroup,
         X3D .X3DConstants .ScreenGroup,
         X3D .X3DConstants .Transform,
         X3D .X3DConstants .X3DNBodyCollidableNode,
      ])
   }

   showContextMenu (event)
   {
      const element = $(document .elementFromPoint (event .pageX, event .pageY))
         .closest ("li, #outline-editor", this .outlineEditor)

      if (!this .isEditable (element))
         return

      if (element .is (".externproto, .proto, .proto-scene, .node, .field"))
         this .selectPrimaryElement (element)

      const
         executionContextElement = element .closest (".scene"),
         executionContext        = this .getNode (executionContextElement) || this .executionContext,
         node                    = this .getNode (element)

      if (element .is (".field"))
      {
         const
            outerNode   = executionContext .getOuterNode (),
            field       = this .getField (element),
            userDefined = node .getUserDefinedFields () .has (field .getName ())

         const
            addReferences    = [ ],
            removeReferences = [ ]

         if (outerNode instanceof X3D .X3DProtoDeclaration && node .getType () .includes (X3D .X3DConstants .X3DNode))
         {
            const
               proto      = outerNode,
               references = [ ]

            for (const protoField of proto .getUserDefinedFields ())
            {
               if (protoField .getType () === field .getType () &&
                     protoField .isReference (field .getAccessType ()))
               {
                  references .push (protoField)
               }
            }

            if (references .length)
            {
               // Make menus.

               for (const reference of references)
               {
                  const menuItem = {
                     label: reference .getName (),
                     args: [proto .getId (), reference .getId (), node .getId (), field .getId ()],
                  }

                  if (field .getReferences () .has (reference))
                  {
                     menuItem .args .unshift ("removeReference")
                     removeReferences .push (menuItem)
                  }
                  else
                  {
                     menuItem .args .unshift ("addReference")
                     addReferences .push (menuItem)
                  }
               }
            }
         }

         var menu = [
            {
               label: "Add Node...",
               visible: field .getType () === X3D .X3DConstants .SFNode || field .getType () === X3D .X3DConstants .MFNode,
               args: ["openLibrary", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: "Paste",
               visible: field .getType () === X3D .X3DConstants .SFNode || field .getType () === X3D .X3DConstants .MFNode,
               args: ["pasteNodes", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: "Add Field...",
               visible: node .canUserDefinedFields (),
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: "Edit Field...",
               visible: node .canUserDefinedFields (),
               enabled: userDefined,
               args: ["editUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: "Delete Field",
               visible: node .canUserDefinedFields (),
               enabled: userDefined,
               args: ["deleteUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: "Add Reference To",
               submenu: addReferences,
               visible: !! addReferences .length,
            },
            {
               label: "Remove Reference To",
               submenu: removeReferences,
               visible: !! removeReferences .length,
            },
            { type: "separator" },
            {
               label: "Reset to Default Value",
               visible: field .getAccessType () !== X3D .X3DConstants .outputOnly,
               args: ["resetToDefaultValue", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: "Trigger Event",
               visible: field .getAccessType () !== X3D .X3DConstants .outputOnly,
               args: ["triggerEvent", element .attr ("id"), node .getId (), field .getId ()],
            },
         ]
      }

      else if (element .is (".node"))
      {
         const
            parentFieldElement = element .closest (".field, .scene", this .sceneGraph),
            parentNodeElement  = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph)

         var menu = [
            {
               label: "Rename Node...",
               args: ["renameNode", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            {
               label: "Add Node...",
               args: ["openLibrary", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: "Cut",
               args: ["cutNodes"],
            },
            {
               label: "Copy",
               args: ["copyNodes"],
            },
            {
               label: "Paste",
               args: ["pasteNodes", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            {
               label: "Delete",
               args: ["deleteNodes"],
            },
            {
               label: "Unlink Clone",
               enabled: node .getCloneCount () > 1,
               args: ["unlinkClone", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: "Add Field...",
               visible: node .canUserDefinedFields (),
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: "Add Parent Group",
               submenu: [
                  {
                     label: "Transform",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Transform", "children"],
                  },
                  {
                     label: "Group",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Group", "children"],
                  },
                  {
                     label: "StaticGroup",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "StaticGroup", "children"],
                  },
                  {
                     label: "Switch",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Switch", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "Billboard",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Billboard", "children"],
                  },
                  {
                     label: "Collision",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Collision", "children"],
                  },
                  {
                     label: "LOD",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "LOD", "children"],
                  },
                  {
                     label: "ViewpointGroup",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "ViewpointGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "Anchor",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Anchor", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "LayoutLayer",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layout", "LayoutLayer", "children"],
                  },
                  {
                     label: "ScreenGroup",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layout", "ScreenGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "GeoTransform",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Geospatial", "GeoTransform", "children"],
                  },
                  {
                     label: "GeoLocation",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Geospatial", "GeoLocation", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "CADAssembly",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADAssembly", "children"],
                  },
                  {
                     label: "CADFace",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADFace", "shape"],
                  },
                  {
                     label: "CADLayer",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADLayer", "children"],
                  },
                  {
                     label: "CADPart",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADPart", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "LayerSet",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "LayerSet", "layers"],
                  },
                  {
                     label: "Layer",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "Layer", "children"],
                  },
                  {
                     label: "Viewport",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "Viewport", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "PickableGroup",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Picking", "PickableGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "CollidableShape",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "RigidBodyPhysics", "CollidableShape", "shape"],
                  },
                  {
                     label: "CollidableOffset",
                     args:[ "addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "RigidBodyPhysics", "CollidableOffset", "collidable"],
                  },
               ],
            },
            {
               label: "Remove Parent",
               enabled: parentNodeElement .hasClass ("node"),
               args: ["removeParent", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
         ]
      }

      else if (element .is (".externproto, .proto"))
      {
         const
            protoNode = node,
            used      = Editor .isProtoNodeUsed (executionContext, protoNode),
            available = Editor .getNextAvailableProtoNode (executionContext, protoNode),
            proto     = protoNode .isExternProto && executionContext .protos .get (protoNode .getName ())

         var menu = [
            {
               label: "Add Prototype...",
               args: ["addPrototype", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: "Rename Prototype...",
               args: ["renamePrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            {
               label: "Delete Prototype",
               enabled: !used || !!available,
               args: ["deletePrototype", element .attr ("id"), executionContext .getId (), protoNode .getId (), used, available ? available .getId () : undefined],
            },
            { type: "separator" },
            {
               label: "Add Field...",
               visible: element .is (".proto"),
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            { type: "separator" },
            {
               label: "Load Now",
               visible: element .is (".externproto"),
               args: ["loadNow", element .attr ("id"), protoNode .getId ()],
            },
            {
               label: "Turn Into Extern Prototype...",
               visible: element .is (".proto"),
               args: ["turnIntoExternPrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            {
               label: "Turn Into Prototype",
               visible: element .is (".externproto"),
               enabled: element .is (".externproto") && protoNode .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE,
               args: ["turnIntoPrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            { type: "separator" },
            {
               label: "Add Instance",
               enabled: !proto,
               args: ["addInstance", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
         ]
      }
      else if (element .is ("#outline-editor, .proto-scene, .description.externprotos, .description.protos, .description.root-nodes, .description.empty-scene"))
      {
         var menu = [
            {
               label: "Add Node...",
               args: ["openLibrary", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: "Add Prototype...",
               args: ["addPrototype", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: "Paste",
               args: ["pasteNodes", element .attr ("id"), executionContext .getId ()],
            },
         ]
      }
      else
      {
         return
      }

      electron .ipcRenderer .send ("context-menu", "outline-editor-menu", menu)
   }

   addUserDefinedField (id, executionContextId, nodeId, fieldId)
   {
      require ("../Controls/EditUserDefinedFieldPopover")

      const
         element          = $(`#${id}`),
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId),
         index            = node .getUserDefinedFields () .indexOf (field);

      element .find ("> .item") .editUserDefinedFieldPopover (executionContext, node, index < 0 ? -1 : index + 1);
   }

   editUserDefinedField (id, executionContextId, nodeId, fieldId)
   {
      require ("../Controls/EditUserDefinedFieldPopover")

      const
         element          = $(`#${id}`),
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId);

      element .find ("> .item") .editUserDefinedFieldPopover (executionContext, node, field);
   }

   deleteUserDefinedField (id, executionContextId, nodeId, fieldId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId);

      Editor .removeUserDefinedField (executionContext, node, field);
   }

   addReference (protoId, protoFieldId, nodeId, fieldId)
   {
      const
         proto      = this .objects .get (protoId),
         protoField = this .objects .get (protoFieldId),
         node       = this .objects .get (nodeId),
         field      = this .objects .get (fieldId)

      Editor .addReference (proto, protoField, node, field)
   }

   removeReference (protoId, protoFieldId, nodeId, fieldId)
   {
      const
         proto      = this .objects .get (protoId),
         protoField = this .objects .get (protoFieldId),
         node       = this .objects .get (nodeId),
         field      = this .objects .get (fieldId)

      Editor .removeReference (proto, protoField, node, field)
   }

   resetToDefaultValue (id, executionContextId, nodeId, fieldId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId),
         fieldDefinition  = node .getFieldDefinitions () .get (field .getName ())

      if (node .canUserDefinedFields () && node .getUserDefinedFields () .has (field .getName ()))
         Editor .setFieldValue (executionContext, node, field, field .create ())
      else
         Editor .setFieldValue (executionContext, node, field, fieldDefinition .value)
   }

   triggerEvent (id, nodeId, fieldId)
   {
      const field = this .objects .get (fieldId)

      field .addEvent ()
   }

   renameNode (id, executionContextId, nodeId)
   {
      require ("../Controls/RenameNodePopover");

      const
         element = $(`#${id}`),
         node    = this .objects .get (nodeId);

      element .find ("> .item") .renameNodePopover (node);
   }

   openLibrary (id, executionContextId, nodeId, fieldId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId);

      require ("./Library") .open (executionContext, node, field);
   }

   cutNodes ()
   {
      UndoManager .shared .beginUndo (_ ("Cut Nodes"));

      this .copyNodes ();
      this .deleteNodes ();

      UndoManager .shared .endUndo ();
   }

   copyNodes ()
   {
      const
         primary     = $(".node.primary, .proto.primary, .externproto.primary"),
         selected    = this .sceneGraph .find (".node.manual.selected"),
         selection   = selected .filter (primary) .length ? selected : primary,
         ids         = selection .map (function () { return this .id }) .get (),
         elements    = ids .map (id => $(`#${id}`)),
         nodes       = elements .map (element => this .getNode (element)),
         undoManager = new UndoManager ();

      undoManager .beginUndo ();

      for (const element of elements)
      {
         const node = this .getNode (element);

         if (!node .getType () .includes (X3D .X3DConstants .X3DTransformNode))
            continue;

         Editor .setMatrixWithCenter (node, this .getModelMatrix (element), undefined, undoManager);
      }

      undoManager .endUndo ();

      const x3dSyntax = Editor .exportVRML (this .executionContext, nodes);

      //console .log (x3dSyntax)

      navigator .clipboard .writeText (x3dSyntax);

      undoManager .undo ();
   }

   async pasteNodes (id, executionContextId, nodeId, fieldId)
   {
      try
      {
         const
            primary                 = $(".node.primary"),
            executionContextElement = primary .closest (".scene", this .sceneGraph),
            executionContext        = this .objects .get (executionContextId) ?? this .getNode (executionContextElement) ?? this .executionContext,
            targetNode              = this .objects .get (nodeId) ?? this .getNode (primary),
            targetField             = this .objects .get (fieldId),
            numRootNodes            = executionContext .rootNodes .length,
            x3dSyntax               = await navigator .clipboard .readText ();

         UndoManager .shared .beginUndo (_ ("Paste Nodes"));

         const nodes = await Editor .importX3D (executionContext, x3dSyntax);

         for (const node of nodes)
         {
            const field = targetField ?? $.try (() => targetNode ?.getField (node .getContainerField ()));

            switch (field ?.getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  Editor .setFieldValue (executionContext, targetNode, field, node);
                  Editor .removeValueFromArray (executionContext, executionContext, executionContext .rootNodes, numRootNodes);
                  break;
               }
               case X3D .X3DConstants .MFNode:
               {
                  Editor .insertValueIntoArray (executionContext, targetNode, field, field .length, node);
                  Editor .removeValueFromArray (executionContext, executionContext, executionContext .rootNodes, numRootNodes);
                  break;
               }
            }
         }

         UndoManager .shared .endUndo ();

         for (const node of nodes)
            this .expandTo (node);
      }
      catch (error)
      {
         // Catch "Document is not focused." from navigator.clipboard.readText.
         console .error (`Paste failed: ${error .message}`);
      }
   }

   deleteNodes ()
   {
      const
         primary   = $(".node.primary"),
         selected  = this .sceneGraph .find (".node.manual.selected"),
         selection = selected .filter (primary) .length ? selected : primary,
         ids       = selection .map (function () { return this .id }) .get ();

      if (ids .length > 1)
         UndoManager .shared .beginUndo (_ ("Delete %s Nodes"), ids .length);
      else if (ids .length === 1)
         UndoManager .shared .beginUndo (_ ("Delete Node %s"), this .getNode ($(`#${ids [0]}`)) .getTypeName ());
      else
         return;

      const nodes = [ ];

      for (const id of ids .reverse ())
      {
         const
            element                 = $(`#${id}`),
            node                    = this .getNode (element),
            parentFieldElement      = element .closest (".field, .scene", this .sceneGraph),
            parentNodeElement       = parentFieldElement .closest (".node, .scene, .proto", this .sceneGraph),
            parentNode              = this .getNode (parentNodeElement),
            parentField             = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement),
            index                   = parseInt (element .attr ("index")),
            executionContextElement = element .closest (".scene", this .sceneGraph),
            executionContext        = this .getNode (executionContextElement);

         switch (parentField .getType ())
         {
            case X3D .X3DConstants .SFNode:
               Editor .setFieldValue (executionContext, parentNode, parentField, null);
               break;
            case X3D .X3DConstants .MFNode:
               Editor .removeValueFromArray (executionContext, parentNode, parentField, index);
               break;
         }

         nodes .push (node);
      }

      Editor .removeNodesFromExecutionContextIfNecessary (this .executionContext, nodes);

      UndoManager .shared .endUndo ();
   }

   unlinkClone (id, executionContextId, nodeId)
   {
      const
         element            = $(`#${id}`),
         executionContext   = this .objects .get (executionContextId),
         parentFieldElement = element .closest (".field, .scene", this .sceneGraph),
         parentNodeElement  = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parentNode         = this .getNode (parentNodeElement),
         parentField        = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement),
         node               = this .objects .get (nodeId),
         copy               = X3D .X3DBaseNode .prototype .copy .call (node, executionContext),
         index              = parseInt (element .attr ("index"));

      UndoManager .shared .beginUndo (_ ("Unlink Clone"));

      if (node .getName ())
         Editor .updateNamedNode (executionContext, executionContext .getUniqueName (node .getName ()), copy);

      switch (parentField .getType ())
      {
         case X3D .X3DConstants .SFNode:
         {
            Editor .setFieldValue (executionContext, parentNode, parentField, copy);
            break;
         }
         case X3D .X3DConstants .MFNode:
         {
            Editor .removeValueFromArray (executionContext, parentNode, parentField, index);
            Editor .insertValueIntoArray (executionContext, parentNode, parentField, index, copy);
            break;
         }
      }

      UndoManager .shared .endUndo ();
   }

   async addParentGroup (id, executionContextId, nodeId, component, typeName, fieldName)
   {
      const
         element                = $(`#${id}`),
         executionContext       = this .objects .get (executionContextId),
         childNode              = this .objects .get (nodeId),
         childIndex             = parseInt (element .attr ("index")),
         parentFieldElement     = element .closest (".field, .scene", this .sceneGraph),
         parentNodeElement      = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parentNode             = this .getNode (parentNodeElement),
         parentField            = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement);

      UndoManager .shared .beginUndo (_ ("Add Parent %s to Node %s"), typeName, childNode .getTypeName ());

      await Editor .addComponent (executionContext, component);

      const
         node  = executionContext .createNode (typeName) .getValue (),
         field = node .getField (fieldName);

      if (field .getType () === X3D .X3DConstants .MFNode)
         Editor .insertValueIntoArray (executionContext, node, field, 0, childNode);
      else
         Editor .setFieldValue (executionContext, node, field, childNode);

      switch (parentField .getType ())
      {
         case X3D .X3DConstants .SFNode:
            Editor .setFieldValue (executionContext, parentNode, parentField, node);
            break;
         case X3D .X3DConstants .MFNode:
            Editor .insertValueIntoArray (executionContext, parentNode, parentField, childIndex, node);
            Editor .removeValueFromArray (executionContext, parentNode, parentField, childIndex + 1);
            break;
      }

      if (field .getType () === X3D .X3DConstants .MFNode)
      {
         const
            selectedNodes          = Array .from (this .sceneGraph .find (".node.selected"), e => this .getNode ($(e))),
            selectedElements       = Array .from (this .sceneGraph .find (".node.selected:not(.primary)"), e => $(e)),
            destinationModelMatrix = this .getModelMatrix (parentNodeElement);

         // Add other selected nodes.

         for (const element of selectedElements .sort ((a, b) => b .attr ("index") - a .attr ("index")))
         {
            const
               childNode          = this .getNode (element),
               childIndex         = parseInt (element .attr ("index")),
               parentFieldElement = element .closest (".field, .scene", this .sceneGraph),
               parentNodeElement  = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
               parentNode         = this .getNode (parentNodeElement),
               parentField        = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement);

            // Adjust matrix.

            if (childNode .getType () .includes (X3D .X3DConstants .X3DTransformNode))
            {
               const
                  sourceModelMatrix = this .getModelMatrix (element),
                  matrix            = destinationModelMatrix .copy () .inverse () .multLeft (sourceModelMatrix);

               Editor .setMatrixWithCenter (childNode, matrix);
            }

            // Move node.

            Editor .insertValueIntoArray (executionContext, node, field, 1, childNode);

            switch (parentField .getType ())
            {
               case X3D .X3DConstants .SFNode:
                  Editor .setFieldValue (executionContext, parentNode, parentField, null);
                  break;
               case X3D .X3DConstants .MFNode:
                  Editor .removeValueFromArray (executionContext, parentNode, parentField, childIndex);
                  break;
            }
         }

         // Reorder nodes.

         Editor .setFieldValue (executionContext, node, field, selectedNodes);
      }

      UndoManager .shared .endUndo ();

      requestAnimationFrame (() => this .expandTo (node));
   }

   removeParent (id, executionContextId, nodeId)
   {
      const
         element             = $(`#${id}`),
         executionContext    = this .objects .get (executionContextId),
         childNode           = this .objects .get (nodeId),
         parentFieldElement  = element .closest (".field, .scene", this .sceneGraph),
         parentNodeElement   = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parentNode          = this .getNode (parentNodeElement),
         parentField         = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement),
         parentIndex         = parseInt (parentNodeElement .attr ("index")),
         parent2FieldElement = parentNodeElement .closest (".field, .scene", this .sceneGraph),
         parent2NodeElement  = parent2FieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parent2Node         = this .getNode (parent2NodeElement),
         parent2Field        = parent2FieldElement .hasClass ("scene") ? parent2Node .rootNodes : this .getField (parent2FieldElement);

      UndoManager .shared .beginUndo (_ ("Remove Parent of %s"), childNode .getTypeName ());

      if (parent2Field instanceof X3D .X3DArrayField)
      {
         if (parentField instanceof X3D .X3DArrayField)
         {
            const length = parentField .length;

            for (let i = 0; i < length; ++ i)
               Editor .insertValueIntoArray (executionContext, parent2Node, parent2Field, parentIndex + i, parentField [i]);

            Editor .removeValueFromArray (executionContext, parent2Node, parent2Field, parentIndex + length);
         }
         else
         {
            Editor .insertValueIntoArray (executionContext, parent2Node, parent2Field, parentIndex, childNode);
            Editor .removeValueFromArray (executionContext, parent2Node, parent2Field, parentIndex + 1);
         }
      }
      else
      {
         Editor .setFieldValue (executionContext, parent2Node, parent2Field, childNode);
      }

      if (parentField instanceof X3D .X3DArrayField)
         Editor .setFieldValue (executionContext, parentNode, parentField, new X3D .MFNode ());
      else
         Editor .setFieldValue (executionContext, parentNode, parentField, null);

      UndoManager .shared .endUndo ();
   }

   addPrototype (id, executionContextId)
   {
      require ("../Controls/AddPrototypePopover");

      let element = $(`#${id}`);

      const executionContext = this .objects .get (executionContextId);

      if (element .is ("#outline-editor"))
      {
         element = element .find (".scene-graph > div > ul > .externprotos, .scene-graph > div > ul > .protos, .scene-graph > div > ul > .root-nodes, .scene-graph > div > ul > .empty-scene") .first ();
      }

      if (element .is (".externprotos, .externproto"))
         element .addPrototypePopover (executionContext, "externproto");
      else if (element .is (".protos, .proto"))
         element .addPrototypePopover (executionContext, "proto");
      else
         element .addPrototypePopover (executionContext);
   }

   renamePrototype (id, executionContextId, protoNodeId)
   {
      require ("../Controls/RenameNodePopover");

      const
         element   = $(`#${id}`),
         protoNode = this .objects .get (protoNodeId);

      element .find ("> .item") .renameNodePopover (protoNode);
   }

   deletePrototype (id, executionContextId, protoNodeId, used, availableId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         protoNode        = this .objects .get (protoNodeId);

      if (protoNode .isExternProto)
      {
         UndoManager .shared .beginUndo (_ ("Remove Extern Prototype Declaration »%s«"), protoNode .getName ());
         Editor .removeExternProtoDeclaration (executionContext, protoNode .getName ());
      }
      else
      {
         UndoManager .shared .beginUndo (_ ("Remove Prototype Declaration »%s«"), protoNode .getName ());
         Editor .removeProtoDeclaration (executionContext, protoNode .getName ());
      }

      if (used)
         Editor .replaceProtoNodes (executionContext, protoNode, this .objects .get (availableId));

      UndoManager .shared .endUndo ();
   }

   loadNow (id, protoNodeId)
   {
      const externproto = this .objects .get (protoNodeId);

      externproto .loadNow () .catch (Function .prototype);
   }

   async turnIntoExternPrototype (id, executionContextId, protoNodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         proto            = this .objects .get (protoNodeId),
         response         = await electron .ipcRenderer .invoke ("file-path", proto .getName ());

      if (response .canceled)
         return;

      await Editor .turnIntoExternProto (executionContext, proto, response .filePath);
   }

   async turnIntoPrototype (id, executionContextId, protoNodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         externproto      = this .objects .get (protoNodeId);

      await Editor .turnIntoPrototype (executionContext, externproto);
   }

   toggleImportedNode (event, parent)
   {
      const
         img          = $(event .target),
         exportedNode = this .getExportedNode (img .closest (".exported-node", this .sceneGraph)),
         inlineNode   = this .getNode (parent .closest (".node", this .sceneGraph)),
         importedNode = this .executionContext .importedNodes .get (exportedNode .getExportedName ());

      if (importedNode)
      {
         if (importedNode .getInlineNode () !== inlineNode)
            return;

         Editor .removeImportedNode (this .executionContext, exportedNode .getExportedName ());

         img .attr ("src", `../images/OutlineEditor/Values/FALSE.svg`)
      }
      else
      {
         Editor .updateImportedNode (this .executionContext, inlineNode, exportedNode .getExportedName ());

         img .attr ("src", `../images/OutlineEditor/Values/TRUE.svg`)
      }
   }

   addInstance (id, executionContextId, protoNodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         protoNode        = this .objects .get (protoNodeId),
         instance         = executionContext .createProto (protoNode .getName ());

      UndoManager .shared .beginUndo (_ ("Add Instance of Type »%s«"), protoNode .getName ());

      Editor .appendValueToArray (executionContext, executionContext, executionContext .rootNodes, instance);

      UndoManager .shared .endUndo ();
   }

   addBooleanField (boolean)
   {
      const
         element  = boolean .closest (".field"),
         node     = this .getNode (element),
         field    = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      boolean .addClass ("pointer") .on ("click", () =>
      {
         Editor .setFieldValue (node .getExecutionContext (), node, field, !field .getValue ());
      });
   }

   addColorField (color)
   {
      //https://seballot.github.io/spectrum/#skinning-nonInput
      require ("spectrum-colorpicker2");

      const
         element  = color .closest (".field"),
         node     = this .getNode (element),
         field    = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      color .addClass ("pointer") .spectrum ({
         type: "color",
         showAlpha: field .getType () === X3D .X3DConstants .SFColorRGBA,
         showInitial: true,
         showInput: false,
			preferredFormat: "name",
         showButtons: false,
         allowEmpty: false,
      })
      .on ("beforeShow.spectrum", (event) =>
      {
         color .spectrum ("set", color .css ("background-color"));
      })
      .on("move.spectrum", (event, tinyColor) =>
      {
         const
            rgb   = tinyColor .toRgb (),
            value = field .copy ();

         value .r = rgb .r / 255;
         value .g = rgb .g / 255;
         value .b = rgb .b / 255;

			if (value .getType () === X3D .X3DConstants .SFColorRGBA)
            value .a = rgb .a;

         Editor .setFieldValue (node .getExecutionContext (), node, field, value);
      })
      .on ("dragstart.spectrum", (event, tinyColor) =>
      {
         UndoManager .shared .beginUndo (_ ("Change Field »%s.%s«"), node .getTypeName (), field .getName ());
      })
      .on ("dragstop.spectrum", (event, tinyColor) =>
      {
         UndoManager .shared .endUndo ();
      });
   }

	removeColorField (element)
	{
		element .spectrum ?.("destroy");
	}

   addTimeField (time)
   {
      const
         element  = time .closest (".field"),
         node     = this .getNode (element),
         field    = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      time .addClass ("pointer") .on ("click", () =>
      {
         Editor .setFieldValue (node .getExecutionContext (), node, field, Date .now () / 1000);
      });
   }

   /*
    * Change field value.
    */

   onFieldEdited (input, node, field)
   {
      try
      {
         if (field .getType () === X3D .X3DConstants .SFString)
            Editor .setFieldValue (node .getExecutionContext (), node, field, input .val ());
         else
            Editor .setFieldFromString (node .getExecutionContext (), node, field, input .val ());
      }
      catch
      {
         $ .beep ();
         input .highlight ();
      }
   }

   onArrayFieldEdited (textarea, node, field)
   {
      try
      {
         Editor .setFieldFromString (node .getExecutionContext (), node, field, "[" + textarea .val () + "]");
      }
      catch
      {
         $ .beep ();
         textarea .highlight ();
      }
   }

   /*
    *  Routing
    */

   clearConnectors ()
   {
      if (!this .connector)
         return;

      this .sceneGraph .find (".field .access-type img.active.activated")
         .removeClass ("activated");

      delete this .connector;
   }

   hoverInConnector (type, event)
   {
      // Hover in connector.

      const
         element          = $(event .currentTarget) .closest (".field", this .sceneGraph),
         field            = this .getField (element),
         sceneElement     = element .closest (".scene"),
         executionContext = this .getNode (sceneElement)

      if (!this .isEditable (element .parent ()))
         return

      if (this .connector)
      {
         if (this .connector .type === type)
            return

         if (this .connector .executionContext !== executionContext)
            return

         if (this .connector .field .getType () !== field .getType ())
            return
      }

      element .find ("> .item .access-type img.active." + type)
         .addClass ("activated")
   }

   hoverOutConnector (type, event)
   {
      // Hover out connector.

      const
         element = $(event .currentTarget) .closest (".field", this .sceneGraph),
         field   = this .getField (element)

      if (!this .isEditable (element .parent ()))
         return

      if (this .connector)
      {
         if (this .connector .type === type)
         {
            if (this .connector .field === field)
            	return
         }
      }

      element .find ("> .item .access-type img.active." + type)
         .removeClass ("activated")
   }

   hoverInSingleConnector (type, event)
   {
      const element = $(event .currentTarget) .closest (".route", this .sceneGraph)

      if (!this .isEditable (element .parent ()))
         return

      element .find (".access-type img")
         .addClass ("activated")
   }

   hoverOutSingleConnector (type, event)
   {
      const element = $(event .currentTarget) .closest (".route", this .sceneGraph)

      if (!this .isEditable (element .parent ()))
         return

      element .find (".access-type img")
         .removeClass ("activated")
   }

   selectConnector (type, event)
   {
      // Click on connector.

      const
         element = $(event .currentTarget) .closest (".field", this .sceneGraph),
         node    = this .getNode (element),
         field   = this .getField (element)

      // Block default href.
      event .preventDefault ()
      event .stopImmediatePropagation ()

      if (!this .isEditable (element .parent ()))
         return

      if (event .ctrlKey || event .metaKey)
      {
         switch (type)
         {
            case "input":
            {
            	const routes = field .getInputRoutes ()

            	switch (routes .size)
            	{
            		case 0:
            		{
            			break
            		}
            		case 1:
            		{
            			for (const route of routes)
            			{
            				// Delete route.

            				Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField)
            			}

            			break
            		}
            		default:
            		{
            			element .data ("full-expanded", true)
            			element .jstree ("open_node", element)
            			break
            		}
            	}

            	break
            }
            case "output":
            {
            	const routes = field .getOutputRoutes ()

            	switch (routes .size)
            	{
            		case 0:
            		{
            			break
            		}
            		case 1:
            		{
            			for (const route of routes)
            			{
            				// Delete route.

            				Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField)
            			}

            			break
            		}
            		default:
            		{
            			element .data ("full-expanded", true)
            			element .jstree ("open_node", element)
            			break
            		}
            	}

            	break
            }
         }
      }
      else
      {
         const
            sceneElement     = element .closest (".scene", this .sceneGraph),
            executionContext = this .getNode (sceneElement)

         switch (type)
         {
            case "input":
            {
            	if (this .connector)
            	{
            		if (this .connector .type === type)
            			break

            		if (this .connector .executionContext !== executionContext)
            			break

            		if (this .connector .field .getType () !== field .getType ())
            			break

            		// Add route.

            		Editor .addRoute (executionContext, this .connector .node, this .connector .field .getName (), node, field .getName ())

            		if (event .shiftKey)
            			break

            		this .connector .element .find (".access-type img.active.output.activated")
            			.removeClass ("activated")

            		delete this .connector
            	}
            	else
            	{
            		this .connector = { type: type, executionContext: executionContext, node: node, field: field, element: element }
            	}

            	break
            }
            case "output":
            {
            	if (this .connector)
            	{
            		if (this .connector .type === type)
            			break

            		if (this .connector .executionContext !== executionContext)
            			break

            		if (this .connector .field .getType () !== field .getType ())
            			break

            		// Add route.

            		Editor .addRoute (executionContext, node, field .getName (), this .connector .node, this .connector .field .getName ())

            		if (event .shiftKey)
            			break

            		this .connector .element .find (".access-type img.active.input.activated")
            			.removeClass ("activated")

            		delete this .connector
            	}
            	else
            	{
            		this .connector = { type: type, executionContext: executionContext, node: node, field: field, element: element }
            	}

            	break
            }
         }
      }
   }

   selectSingleConnector (type, event)
   {
      // Click on connector.

      const
         element = $(event .currentTarget) .closest (".route", this .sceneGraph),
         field   = this .getField (element)

      // Block default href.
      event .preventDefault ()
      event .stopImmediatePropagation ()

      if (!this .isEditable (element .parent ()))
         return

      if (!(event .ctrlKey || event .metaKey))
         return

      element .hide ()

      switch (type)
      {
         case "input":
         {
            const route = this .getRoute (element, field .getInputRoutes ())

            Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField)
            break
         }
         case "output":
         {
            const route = this .getRoute (element, field .getOutputRoutes ())

            Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField)
            break
         }
      }
   }

   /*
    *  Drag & Drop
    */

   onDragStartExternProto (event)
   {
      const
         element   = $(event .target) .closest (".externproto", this .sceneGraph),
         selected  = this .sceneGraph .find (".externproto.selected"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ()

      this .selectPrimaryElement (element)

      event .originalEvent .dataTransfer .setData ("sunrize/externproto", ids .join (","))
   }

   onDragStartProto (event)
   {
      const
         element   = $(event .target) .closest (".proto", this .sceneGraph),
         selected  = this .sceneGraph .find (".proto.selected"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ()

      this .selectPrimaryElement (element)

      event .originalEvent .dataTransfer .setData ("sunrize/proto", ids .join (","))
   }

   onDragStartNode (event)
   {
      const
         element   = $(event .target) .closest (".node", this .sceneGraph),
         selected  = this .sceneGraph .find (".node.manual.selected"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ()

      this .selectPrimaryElement (element)

      event .originalEvent .dataTransfer .setData ("sunrize/nodes", ids .join (","))
   }

   onDragStartField (event)
   {
      const
         element = $(event .target) .closest (".field", this .sceneGraph),
         node    = this .getNode (element),
         field   = this .getField (element)

      if (node .canUserDefinedFields () && node .getUserDefinedFields () .has (field .getName ()))
      {
         this .selectPrimaryElement (element)

         event .originalEvent .dataTransfer .setData ("sunrize/field", element .attr ("id"))
      }
      else
      {
         event .preventDefault ()
      }
   }

   onDragEnter (event)
   {
      event .preventDefault ()
      event .stopPropagation ()

      event .originalEvent .dataTransfer .dropEffect = "none"

      // Show drop indicator.

      const destinationElement = $(event .target) .closest ("li, .scene", this .sceneGraph)
         .removeClass (["drag-before", "drag-into", "drag-after"])

      if (this .isEditable (destinationElement))
      {
         if (event .originalEvent .dataTransfer .types .includes ("sunrize/externproto"))
         {
            const
               sourceElement                      = this .sceneGraph .find (".primary"),
               sourceExecutionContextElement      = sourceElement .closest (".scene", this .sceneGraph),
               destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext             = this .getNode (sourceExecutionContextElement),
               destinationExecutionContext        = this .getNode (destinationExecutionContextElement)

            if (sourceExecutionContext === destinationExecutionContext)
            {
               if (event .altKey)
                  event .originalEvent .dataTransfer .dropEffect = "copy"
               else
                  event .originalEvent .dataTransfer .dropEffect = "move"
            }
            else
            {
               event .originalEvent .dataTransfer .dropEffect = "copy"
            }

            if (destinationElement .is (".scene-graph"))
               destinationElement .addClass ("drag-after")
            else if (destinationElement .is (".scene, .externprotos"))
               destinationElement .addClass ("drag-into")
            else if (destinationElement .is (".externproto"))
            {
               const
                  item = destinationElement .find ("> .item"),
                  y    = event .pageY - destinationElement .offset () .top

               if (y < item .height () * 0.5)
                  destinationElement .data ("drag-type", "drag-before")
               else if (y > destinationElement .height () - item .height () * 0.5)
                  destinationElement .data ("drag-type", "drag-after")
               else
               {
                  destinationElement .data ("drag-type", "")
                  event .originalEvent .dataTransfer .dropEffect = "none"
               }

               item .addClass (destinationElement .data ("drag-type"))
            }
            else
               event .originalEvent .dataTransfer .dropEffect = "none"
         }
         else if (event .originalEvent .dataTransfer .types .includes ("sunrize/proto"))
         {
            const
               sourceElement                      = this .sceneGraph .find (".primary"),
               sourceExecutionContextElement      = sourceElement .closest (".scene", this .sceneGraph),
               destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext             = this .getNode (sourceExecutionContextElement),
               destinationExecutionContext        = this .getNode (destinationExecutionContextElement)

            if (sourceExecutionContext === destinationExecutionContext)
            {
               if (event .altKey)
               {
                  event .originalEvent .dataTransfer .dropEffect = "copy"
               }
               else
               {
                  const
                     sourceIndex       = parseInt (sourceElement .attr ("index")),
                     destinationIndex  = destinationElement .hasClass ("proto") ? parseInt (destinationElement .attr ("index")) : destinationExecutionContext .protos .length,
                     sourceProto       = this .getNode (sourceElement),
                     destinationProtos = destinationExecutionContext .protos

                  event .originalEvent .dataTransfer .dropEffect = "move"

                  if (sourceIndex == destinationIndex || sourceIndex + 1 == destinationIndex)
                  { }
                  else if (sourceIndex < destinationIndex)
                  {
                     for (let i = sourceIndex + 1; i < destinationIndex; ++ i)
                     {
                        if (Editor .protoIsUsedInProto (sourceProto, destinationProtos [i]))
                        {
                           event .originalEvent .dataTransfer .dropEffect = "none"
                           break
                        }
                     }
                  }
                  else if (sourceIndex > destinationIndex)
                  {
                     for (let i = destinationIndex; i < sourceIndex; ++ i)
                     {
                        if (Editor .protoIsUsedInProto (destinationProtos [i], sourceProto))
                        {
                           event .originalEvent .dataTransfer .dropEffect = "none"
                           break
                        }
                     }
                  }
               }
            }
            else
            {
               event .originalEvent .dataTransfer .dropEffect = "copy"
            }

            if (event .originalEvent .dataTransfer .dropEffect !== "none")
            {
               if (destinationElement .is (".scene-graph"))
                  destinationElement .addClass ("drag-after")
               else if (destinationElement .is (".scene, .protos"))
                  destinationElement .addClass ("drag-into")
               else if (destinationElement .is (".proto"))
               {
                  const
                     item = destinationElement .find ("> .item"),
                     y    = event .pageY - destinationElement .offset () .top

                  if (y < item .height () * 0.5)
                     destinationElement .data ("drag-type", "drag-before")
                  else if (y > destinationElement .height () - item .height () * 0.5)
                     destinationElement .data ("drag-type", "drag-after")
                  else
                  {
                     destinationElement .data ("drag-type", "")
                     event .originalEvent .dataTransfer .dropEffect = "none"
                  }

                  item .addClass (destinationElement .data ("drag-type"))
               }
               else
                  event .originalEvent .dataTransfer .dropEffect = "none"
            }
         }
         else if (event .originalEvent .dataTransfer .types .includes ("sunrize/nodes"))
         {
            if (event .altKey)
               event .originalEvent .dataTransfer .dropEffect = "copy"
            else if (event .ctrlKey)
               event .originalEvent .dataTransfer .dropEffect = "link"
            else
               event .originalEvent .dataTransfer .dropEffect = "move"

            if (destinationElement .is (".scene-graph"))
               destinationElement .addClass ("drag-after")
            else if (destinationElement .is (".scene, .root-nodes, .field[type-name*=Node]"))
               destinationElement .addClass ("drag-into")
            else if (destinationElement .is (".node"))
            {
               const
                  item = destinationElement .find ("> .item"),
                  y    = event .pageY - destinationElement .offset () .top

               if (y < item .height () * 0.25)
               {
                  destinationElement .data ("drag-type", "drag-before")
                  destinationElement .addClass ("drag-before")
               }
               else if (y > destinationElement .height () - item .height () * 0.25)
               {
                  destinationElement .data ("drag-type", "drag-after")
                  destinationElement .addClass ("drag-after")
               }
               else
               {
                  destinationElement .data ("drag-type", "drag-into")
                  destinationElement .addClass ("drag-into")
               }
            }
            else
               event .originalEvent .dataTransfer .dropEffect = "none"
         }
         else if (event .originalEvent .dataTransfer .types .includes ("sunrize/field"))
         {
            if (destinationElement .hasClass ("field"))
            {
               const
                  sourceElement = this .sceneGraph .find (".primary"),
                  sourceNode    = this .getNode (sourceElement)

               const
                  destinationNode  = this .getNode (destinationElement),
                  destinationField = this .getField (destinationElement),
                  userDefined      = destinationNode .getUserDefinedFields () .has (destinationField .getName ())

               if (destinationNode === sourceNode && userDefined)
               {
                  event .originalEvent .dataTransfer .dropEffect = "move"

                  const
                     item = destinationElement .find ("> .item"),
                     y    = event .pageY - destinationElement .offset () .top

                  if (y < item .height () * 0.5)
                  {
                     destinationElement .data ("drag-type", "drag-before")
                     destinationElement .addClass ("drag-before")
                  }
                  else if (y > destinationElement .height () - item .height () * 0.5)
                  {
                     destinationElement .data ("drag-type", "drag-after")
                     destinationElement .addClass ("drag-after")
                  }
                  else
                  {
                     event .originalEvent .dataTransfer .dropEffect = "none"
                  }
               }
            }
         }
      }

      destinationElement .data ("dropEffect", event .originalEvent .dataTransfer .dropEffect)
   }

   onDragLeave (event)
   {
      event .preventDefault ()
      event .stopPropagation ()

      // Hide drop indicator.

      const element = $(event .target)
         .closest ("li, .scene-graph", this .sceneGraph)

      element .find ("> .item") .addBack ()
         .removeClass (["drag-before", "drag-into", "drag-after"])
   }

   async onDrop (event)
   {
      // console .log ("onDrop")

      event .preventDefault ()
      event .stopPropagation ()

      if (event .originalEvent .dataTransfer .types .includes ("sunrize/externproto"))
      {
         const
            sourceElementId               = event .originalEvent .dataTransfer .getData ("sunrize/externproto"),
            sourceElement                 = $("#" + sourceElementId),
            sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
            sourceExecutionContext        = this .getNode (sourceExecutionContextElement),
            sourceIndex                   = parseInt (sourceElement .attr ("index"))

         let sourceExternProto = this .getNode (sourceElement)

         const
            destinationElement                 = $(event .target) .closest (".externproto, .externprotos, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement)

         let destinationIndex = destinationElement .hasClass ("externproto") ? parseInt (destinationElement .attr ("index")) : destinationExecutionContext .externprotos .length

         if (destinationElement .hasClass ("externproto") && destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex

         switch (destinationElement .data ("dropEffect"))
         {
            case "copy":
            {
               UndoManager .shared .beginUndo (_ ("Copy Extern Proto »%s«"), sourceExternProto .getName ())

               await Editor .importX3D (destinationExecutionContext, Editor .exportVRML (sourceExecutionContext, [sourceExternProto]))

               const
                  externprotos = Array .from (destinationExecutionContext .externprotos),
                  externproto  = externprotos .pop ()

               externprotos .splice (destinationIndex, 0, externproto)

               Editor .setExternProtoDeclarations (destinationExecutionContext, externprotos)

               if (Editor .isParentContext (sourceExecutionContext, destinationExecutionContext))
               {
                  if (!destinationExecutionContext .protos .get (externproto .getName ()))
                  {
                     const available = Editor .getNextAvailableProtoNode (destinationExecutionContext, externproto)

                     Editor .replaceProtoNodes (destinationExecutionContext, available, externproto)
                  }
               }

               UndoManager .shared .endUndo ()
               break
            }
            case "move":
            {
               if (sourceExecutionContext !== destinationExecutionContext)
                  break

               if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
                  break

               UndoManager .shared .beginUndo (_ ("Move Extern Proto »%s«"), sourceExternProto .getName ())

               const externprotos = Array .from (destinationExecutionContext .externprotos)

               if (sourceIndex < destinationIndex)
                  -- destinationIndex

               externprotos .splice (sourceIndex, 1)
               externprotos .splice (destinationIndex, 0, sourceExternProto)

               Editor .setExternProtoDeclarations (destinationExecutionContext, externprotos)
               UndoManager .shared .endUndo ()
               break
            }
         }
      }
      else if (event .originalEvent .dataTransfer .types .includes ("sunrize/proto"))
      {
         const
            sourceElementId               = event .originalEvent .dataTransfer .getData ("sunrize/proto"),
            sourceElement                 = $("#" + sourceElementId),
            sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
            sourceExecutionContext        = this .getNode (sourceExecutionContextElement),
            sourceIndex                   = parseInt (sourceElement .attr ("index"))

         let sourceProto = this .getNode (sourceElement)

         const
            destinationElement                 = $(event .target) .closest (".proto, .protos, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement)

         let destinationIndex = destinationElement .hasClass ("proto") ? parseInt (destinationElement .attr ("index")) : destinationExecutionContext .protos .length

         if (destinationElement .hasClass ("proto") && destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex

         switch (destinationElement .data ("dropEffect"))
         {
            case "copy":
            {
               UndoManager .shared .beginUndo (_ ("Copy Prototype »%s«"), sourceProto .getName ())
               await Editor .importX3D (destinationExecutionContext, Editor .exportVRML (sourceExecutionContext, [sourceProto]))

               const
                  protos = Array .from (destinationExecutionContext .protos),
                  proto  = protos .pop ()

               protos .splice (destinationIndex, 0, proto)

               Editor .setProtoDeclarations (destinationExecutionContext, protos)

               if (Editor .isParentContext (sourceExecutionContext, destinationExecutionContext))
               {
                  const available = Editor .getNextAvailableProtoNode (destinationExecutionContext, proto)

                  Editor .replaceProtoNodes (destinationExecutionContext, available, proto)
               }

               UndoManager .shared .endUndo ()
               break
            }
            case "move":
            {
               if (sourceExecutionContext !== destinationExecutionContext)
                  break

               if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
                  break

               UndoManager .shared .beginUndo (_ ("Move Prototype »%s«"), sourceProto .getName ())

               const protos = Array .from (destinationExecutionContext .protos)

               if (sourceIndex < destinationIndex)
                  -- destinationIndex

               protos .splice (sourceIndex, 1)
               protos .splice (destinationIndex, 0, sourceProto)

               Editor .setProtoDeclarations (destinationExecutionContext, protos)
               UndoManager .shared .endUndo ()
               break
            }
         }
      }
      else if (event .originalEvent .dataTransfer .types .includes ("sunrize/nodes"))
      {
         const sourceElementsIds = event .originalEvent .dataTransfer .getData ("sunrize/nodes") .split (",")

         const
            destinationElement                 = $(event .target) .closest ("li, .scene", this .sceneGraph),
            destinationParentFieldElement      = destinationElement .closest (".field, .scene", this .sceneGraph),
            destinationParentNodeElement       = destinationParentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement)

         let
            destinationParentNode  = this .getNode (destinationParentNodeElement),
            destinationParentField = destinationParentFieldElement .hasClass ("scene") ? destinationParentNode .rootNodes : this .getField (destinationParentFieldElement),
            destinationIndex       = parseInt (destinationElement .attr ("index"))

         if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-after")
            ++ destinationIndex

         if (destinationElement .attr ("node-id") !== "NULL")
         {
            if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-into")
            {
               destinationParentNode = this .getNode (destinationElement)
            }
         }

         // Begin undo.

         if (sourceElementsIds .length === 1)
         {
            const
               sourceElement = $("#" + sourceElementsIds [0]),
               sourceNode    = this .getNode (sourceElement)

            UndoManager .shared .beginUndo (this .getUndoDescriptionForNode (destinationElement .data ("dropEffect"), sourceNode), sourceNode .getTypeName (), sourceNode .getDisplayName ())
         }
         else
         {
            UndoManager .shared .beginUndo (this .getUndoDescriptionForNode (destinationElement .data ("dropEffect"), sourceElementsIds), sourceElementsIds .length)
         }

         // Copy source nodes if needed.

         const sourceNodes = [ ]

         for (const sourceElementId of sourceElementsIds)
         {
            const
               sourceElement                 = $("#" + sourceElementId),
               sourceNode                    = this .getNode (sourceElement),
               sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext        = this .getNode (sourceExecutionContextElement)

            if (destinationElement .data ("dropEffect") === "copy" || sourceExecutionContext !== destinationExecutionContext)
            {
               sourceNodes .push (sourceNode)
            }
         }

         const copiedNodes = sourceNodes .length
            ? await Editor .importX3D (destinationExecutionContext, Editor .exportVRML (this .executionContext, sourceNodes))
            : [ ]

         if (copiedNodes .length)
            destinationExecutionContext .rootNodes .length -= copiedNodes .length

         // Move, copy, link nodes.

         const sourceIndexOffsets = new Map ()

         for (const sourceElementId of sourceElementsIds)
         {
            const
               sourceElement                 = $("#" + sourceElementId),
               sourceParentFieldElement      = sourceElement .closest (".field, .scene", this .sceneGraph),
               sourceParentNodeElement       = sourceParentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
               sourceParentNode              = this .getNode (sourceParentNodeElement),
               sourceParentField             = sourceParentFieldElement .hasClass ("scene") ? sourceParentNode .rootNodes : this .getField (sourceParentFieldElement),
               sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext        = this .getNode (sourceExecutionContextElement)

            let
               sourceNode  = this .getNode (sourceElement),
               sourceIndex = parseInt (sourceElement .attr ("index"))

            if (destinationElement .attr ("node-id") !== "NULL")
            {
               if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-into")
               {
                  try
                  {
                     if (destinationParentNode === sourceNode)
                        continue

                     destinationParentField = destinationParentNode .getField (sourceNode .getContainerField ())
                  }
                  catch
                  {
                     for (const field of destinationParentNode .getFields () .reverse ())
                     {
                        if (!field .isInitializable ())
                           continue

                        if (field .getType () !== X3D .X3DConstants .SFNode && field .getType () !== X3D .X3DConstants .MFNode)
                           continue

                        destinationParentField = field
                        break
                     }
                  }
               }
            }

            // Adjust source index.

            if (sourceIndexOffsets .has (sourceParentField))
            {
               if (sourceParentField !== destinationParentField || destinationIndex > sourceIndex || isNaN (destinationIndex))
                  sourceIndexOffsets .set (sourceParentField, sourceIndexOffsets .get (sourceParentField) - 1)
            }
            else
            {
               sourceIndexOffsets .set (sourceParentField, 0)
            }

            sourceIndex += sourceIndexOffsets .get (sourceParentField)

            // If source equal destination, continue.

            if (sourceParentField === destinationParentField && (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex || isNaN (sourceIndex) && isNaN (destinationIndex)) && destinationElement .data ("dropEffect") === "move")
            {
               continue
            }

            // Remove source node.

            if (destinationElement .data ("dropEffect") === "move")
            {
               switch (sourceParentField .getType ())
               {
                  case X3D .X3DConstants .SFNode:
                  {
                     Editor .setFieldValue (sourceExecutionContext, sourceParentNode, sourceParentField, null)
                     break
                  }
                  case X3D .X3DConstants .MFNode:
                  {
                     if (sourceParentField === destinationParentField && destinationIndex >= sourceIndex)
                        -- destinationIndex

                     Editor .removeValueFromArray (sourceExecutionContext, sourceParentNode, sourceParentField, sourceIndex)
                     break
                  }
               }
            }

            // Copy source node if needed.

            if (destinationElement .data ("dropEffect") === "copy" || sourceExecutionContext !== destinationExecutionContext)
            {
               sourceNode = copiedNodes .shift ()
            }

            // Adjust matrix.

            if (destinationElement .data ("dropEffect") ?.match (/copy|move/))
            {
               if (sourceNode .getType () .includes (X3D .X3DConstants .X3DTransformNode))
               {
                  const
                     sourceModelMatrix      = this .getModelMatrix (sourceElement),
                     destinationModelMatrix = this .getModelMatrix (destinationParentNodeElement)

                  destinationModelMatrix .inverse () .multLeft (sourceModelMatrix)
                  Editor .setMatrixWithCenter (sourceNode, destinationModelMatrix)
               }
            }

            // Insert source node.

            switch (destinationParentField .getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  Editor .setFieldValue (destinationExecutionContext, destinationParentNode, destinationParentField, sourceNode)
                  break
               }
               case X3D .X3DConstants .MFNode:
               {
                  Editor .insertValueIntoArray (destinationExecutionContext, destinationParentNode, destinationParentField, isNaN (destinationIndex) ? destinationParentField .length : destinationIndex, sourceNode)
                  break
               }
            }

            // End.

            ++ destinationIndex
         }

         // End undo.

         UndoManager .shared .endUndo ()
      }
      if (event .originalEvent .dataTransfer .types .includes ("sunrize/field"))
      {
         const
            sourceElementId               = event .originalEvent .dataTransfer .getData ("sunrize/field"),
            sourceElement                 = $(`#${sourceElementId}`),
            sourceNode                    = this .getNode (sourceElement),
            sourceFields                  = Array .from (sourceNode .getUserDefinedFields ()),
            sourceField                   = this .getField (sourceElement),
            sourceIndex                   = sourceFields .indexOf (sourceField),
            sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
            sourceExecutionContext        = this .getNode (sourceExecutionContextElement)

         const
            destinationElement = $(event .target) .closest (".field", this .sceneGraph),
            destinationField   = this .getField (destinationElement)

         let destinationIndex = sourceFields .indexOf (destinationField)

         if (destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex

         if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
            return

         sourceFields .splice (sourceIndex, 1)
         sourceFields .splice (sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex, 0, sourceField)

         UndoManager .shared .beginUndo (_ ("Move Field »%s«"), sourceField .getName ())
         Editor .setUserDefinedFields (sourceExecutionContext, sourceNode, sourceFields)
         UndoManager .shared .endUndo ()
      }
   }

   onDragEnd ()
   {
      // console .log ("onDragEnd")
   }

   getUndoDescriptionForNode (dropEffect, node)
   {
      if (Array .isArray (node))
      {
         switch (dropEffect)
         {
            case "copy": return _ ("Copy %s Nodes", node .length)
            case "link": return _ ("Link %s Nodes", node .length)
            case "move": return _ ("Move %s Nodes", node .length)
         }
      }
      else
      {
         if (node .getDisplayName ())
         {
            switch (dropEffect)
            {
               case "copy": return _ ("Copy Node %s »%s«")
               case "link": return _ ("Link Node %s »%s«")
               case "move": return _ ("Move Node %s »%s«")
            }
         }
         else
         {
            switch (dropEffect)
            {
               case "copy": return _ ("Copy Node %s")
               case "link": return _ ("Link Node %s")
               case "move": return _ ("Move Node %s")
            }
         }
      }
   }

   getModelMatrix (nodeElement, self = true)
   {
      if (!nodeElement .length)
         return new X3D .Matrix4 ()

      const
         node        = this .getNode (nodeElement),
         modelMatrix = this .getModelMatrix (nodeElement .parent () .closest (".node", this .sceneGraph))

      if (self)
      {
         if (node .getType () .some (Set .prototype .has, this .matrixNodes))
            modelMatrix .multLeft (node .getMatrix ())
      }

      return modelMatrix
   }

   removeEmptyGroups ()
   {
      const
         selection = this .sceneGraph .find (".node.primary, .node.manual.selected"),
         ids       = selection .map (function () { return this .id }) .get (),
         nodes     = ids .length ? ids .map (id => this .getNode ($(`#${id}`))) : this .executionContext .rootNodes

      Editor .removeEmptyGroups (this .executionContext, nodes)
   }
}
