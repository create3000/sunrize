"use strict";

const
   $                 = require ("jquery"),
   electron          = require ("electron"),
   path              = require ("path"),
   url               = require ("url"),
   X3D               = require ("../X3D"),
   OutlineRouteGraph = require ("./OutlineRouteGraph"),
   Editor            = require ("../Undo/Editor"),
   UndoManager       = require ("../Undo/UndoManager"),
   _                 = require ("../Application/GetText");

module .exports = class OutlineEditor extends OutlineRouteGraph
{
   constructor (element)
   {
      super (element);

      element .on ("contextmenu", (event) => this .showContextMenu (event));

      electron .ipcRenderer .on ("outline-editor", (event, key, ...args) => this [key] (...args));
      electron .ipcRenderer .on ("transform-to-zero", (event) => this .transformToZero ());
      electron .ipcRenderer .on ("remove-empty-groups", (event) => this .removeEmptyGroups ());

      this .setup ();
   }

   updateComponents ()
   {
      super .updateComponents ();

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
      ]);
   }

   transformToZero ()
   {
      const
         selection = this .sceneGraph .find (".node.primary, .node.manually"),
         ids       = selection .map (function () { return this .id }) .get (),
         nodes     = ids .length ? ids .map (id => this .getNode ($(`#${id}`))) : this .executionContext .rootNodes;

      Editor .transformToZero (this .executionContext, nodes);
   }

   removeEmptyGroups ()
   {
      const
         selection = this .sceneGraph .find (".node.primary, .node.manually"),
         ids       = selection .map (function () { return this .id }) .get (),
         nodes     = ids .length ? ids .map (id => this .getNode ($(`#${id}`))) : this .executionContext .rootNodes;

      Editor .removeEmptyGroups (this .executionContext, nodes);
   }

   showContextMenu (event)
   {
      const element = $(document .elementFromPoint (event .pageX, event .pageY))
         .closest ("li, #outline-editor", this .outlineEditor);

      if (!(this .isEditable (element) || element .is (".exported-node")))
         return;

      if (element .attr ("node-id") === "NULL")
         return;

      if (!element .is (".manually"))
         this .sceneGraph .find (".manually") .removeClass ("manually");

      if (element .is (".externproto, .proto, .proto-scene, .node, .field") && !element .is (".manually"))
         this .selectPrimaryElement (element);

      const
         executionContextElement = element .closest (".scene"),
         executionContext        = this .getNode (executionContextElement) ?? this .executionContext,
         node                    = this .getNode (element);

      if (element .is (".field"))
      {
         const
            outerNode   = executionContext .getOuterNode (),
            field       = this .getField (element),
            userDefined = node .getUserDefinedFields () .has (field .getName ());

         const
            addReferences    = [ ],
            removeReferences = [ ];

         if (outerNode instanceof X3D .X3DProtoDeclaration && node .getType () .includes (X3D .X3DConstants .X3DNode))
         {
            const
               proto      = outerNode,
               references = [ ];

            for (const protoField of proto .getUserDefinedFields ())
            {
               if (protoField .getType () !== field .getType ())
                  continue;

               if (!protoField .isReference (field .getAccessType ()))
                  continue;

               references .push (protoField);
            }

            // Make menus.

            for (const reference of references)
            {
               const menuItem = {
                  label: reference .getName (),
                  args: [proto .getId (), reference .getId (), node .getId (), field .getId ()],
               };

               if (field .getReferences () .has (reference))
               {
                  menuItem .args .unshift ("removeReference");
                  removeReferences .push (menuItem);
               }
               else
               {
                  menuItem .args .unshift ("addReference");
                  addReferences .push (menuItem);
               }
            }
         }

         var menu = [
            {
               label: _("Add Node..."),
               visible: field .getType () === X3D .X3DConstants .SFNode || field .getType () === X3D .X3DConstants .MFNode,
               args: ["openLibrary", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: _("Paste"),
               visible: field .getType () === X3D .X3DConstants .SFNode || field .getType () === X3D .X3DConstants .MFNode,
               args: ["pasteNodes", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: _("Add Field..."),
               visible: node .canUserDefinedFields (),
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: _("Edit Field..."),
               visible: node .canUserDefinedFields (),
               enabled: userDefined,
               args: ["editUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: _("Delete Field"),
               visible: node .canUserDefinedFields (),
               enabled: userDefined,
               args: ["deleteUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            { type: "separator" },
            {
               label: _("Add Reference to"),
               submenu: addReferences,
               visible: !! addReferences .length,
            },
            {
               label: _("Remove Reference to"),
               submenu: removeReferences,
               visible: !! removeReferences .length,
            },
            { type: "separator" },
            {
               label: _("Reset to Default Value"),
               visible: field .getAccessType () !== X3D .X3DConstants .outputOnly,
               args: ["resetToDefaultValue", element .attr ("id"), executionContext .getId (), node .getId (), field .getId ()],
            },
            {
               label: _("Trigger Event"),
               visible: field .getAccessType () !== X3D .X3DConstants .outputOnly,
               args: ["triggerEvent", element .attr ("id"), node .getId (), field .getId ()],
            },
         ];
      }

      else if (element .is (".node"))
      {
         const
            parentFieldElement = element .closest (".field, .scene", this .sceneGraph),
            parentNodeElement  = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph);

         var menu = [
            {
               label: _("Rename Node..."),
               args: ["renameNode", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            {
               label: _("Export Node..."),
               enabled: executionContext === this .executionContext,
               args: ["addExportedNode", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            {
               label: _("Add Node..."),
               args: ["openLibrary", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: _("Cut"),
               args: ["cutNodes"],
            },
            {
               label: _("Copy"),
               args: ["copyNodes"],
            },
            {
               label: _("Paste"),
               args: ["pasteNodes", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            {
               label: _("Delete"),
               args: ["deleteNodes"],
            },
            {
               label: _("Unlink Clone"),
               enabled: node .getCloneCount () > 1,
               args: ["unlinkClone", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: _("Add Field..."),
               visible: node .canUserDefinedFields (),
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
            {
               label: _("Add Parent Group"),
               submenu: [
                  {
                     label: "Transform",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Transform", "children"],
                  },
                  {
                     label: "Group",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Group", "children"],
                  },
                  {
                     label: "StaticGroup",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "StaticGroup", "children"],
                  },
                  {
                     label: "Switch",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Grouping", "Switch", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "Billboard",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Billboard", "children"],
                  },
                  {
                     label: "Collision",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Collision", "children"],
                  },
                  {
                     label: "LOD",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "LOD", "children"],
                  },
                  {
                     label: "ViewpointGroup",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "ViewpointGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "Anchor",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Navigation", "Anchor", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "LayoutLayer",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layout", "LayoutLayer", "children"],
                  },
                  {
                     label: "ScreenGroup",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layout", "ScreenGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "GeoTransform",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Geospatial", "GeoTransform", "children"],
                  },
                  {
                     label: "GeoLocation",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Geospatial", "GeoLocation", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "CADLayer",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADLayer", "children"],
                  },
                  {
                     label: "CADAssembly",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADAssembly", "children"],
                  },
                  {
                     label: "CADPart",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADPart", "children"],
                  },
                  {
                     label: "CADFace",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "CADGeometry", "CADFace", "shape"],
                  },
                  { type: "separator" },
                  {
                     label: "LayerSet",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "LayerSet", "layers"],
                  },
                  {
                     label: "Layer",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "Layer", "children"],
                  },
                  {
                     label: "Viewport",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Layering", "Viewport", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "PickableGroup",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "Picking", "PickableGroup", "children"],
                  },
                  { type: "separator" },
                  {
                     label: "CollidableOffset",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "RigidBodyPhysics", "CollidableOffset", "collidable"],
                  },
                  {
                     label: "CollidableShape",
                     args: ["addParentGroup", element .attr ("id"), executionContext .getId (), node .getId (), "RigidBodyPhysics", "CollidableShape", "shape"],
                  },
               ],
            },
            {
               label: _("Remove Parent"),
               enabled: parentNodeElement .hasClass ("node"),
               args: ["removeParent", element .attr ("id"), executionContext .getId (), node .getId ()],
            },
            { type: "separator" },
         ];

         for (const type of node .getType () .toReversed ())
         {
            switch (type)
            {
               case X3D .X3DConstants .IndexedFaceSet:
               {
                  if (node ._normal .getValue ())
                  {
                     menu .push ({
                        label: _("Remove Normals"),
                        args: ["removeNormalsFromGeometry", element .attr ("id"), executionContext .getId (), node .getId ()],
                     });
                  }
                  else
                  {
                     menu .push ({
                        label: _("Add Normals"),
                        args: ["addNormalsToGeometry", element .attr ("id"), executionContext .getId (), node .getId ()],
                     });
                  }

                  continue;
               }
               case X3D .X3DConstants .Inline:
               {
                  menu .push ({
                     label: _("Open Inline Scene in New Tab"),
                     enabled: node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE,
                     args: ["openFileInNewTab", node .getInternalScene () ?.worldURL],
                  },
                  {
                     label: _("Fold Inline Back into Scene"),
                     enabled: node .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE,
                     args: ["foldInlineBackIntoScene", element .attr ("id"), executionContext .getId (), node .getId ()],
                  });

                  continue;
               }
               case X3D .X3DConstants .X3DPrototypeInstance:
               {
                  if (!$.try (() => node .getInnerNode () .getType () .includes (X3D .X3DConstants .X3DChildNode)))
                     continue;

                  // Proceed with next case:
               }
               case X3D .X3DConstants .X3DChildNode:
               {
                  menu .push ({
                     label: _("Convert Node to Inline File..."),
                     args: ["convertNodeToInlineFile", element .attr ("id"), executionContext .getId (), node .getId ()],
                  });

                  continue;
               }
               case X3D .X3DConstants .X3DBoundedObject:
               {
                  menu .push ({
                     label: _("Determine Bounding Box from Scratch"),
                     args: ["determineBoundingBoxFromScratch", element .attr ("id"), executionContext .getId (), node .getId ()],
                  });

                  continue;
               }
               case X3D .X3DConstants .X3DViewpointNode:
               {
                  menu .push ({
                     label: _("Move Viewpoint to Camera"),
                     args: ["moveViewpointToCamera", element .attr ("id"), executionContext .getId (), node .getId ()],
                  });

                  continue;
               }
            }

            break;
         }
      }

      else if (element .is (".exported-node"))
      {
         const exportedNode = this .objects .get (parseInt (element .attr ("exported-node-id")));

         var menu = [
            {
               label: _("Rename Exported Node..."),
               visible: exportedNode .getExecutionContext () === this .executionContext,
               args: ["renameExportedNode", element .attr ("id")],
            },
            {
               label: _("Remove Exported Node"),
               visible: exportedNode .getExecutionContext () === this .executionContext,
               args: ["removeExportedNode", element .attr ("id")],
            },
            {
               label: _("Import Node..."),
               visible: executionContext !== this .executionContext && !element .closest (".instance-scene") .length,
               args: ["addImportedNode", element .attr ("id")],
            },
         ];
      }

      else if (element .is (".imported-node"))
      {
         const importedNode = this .objects .get (parseInt (element .attr ("imported-node-id")));

         var menu = [
            {
               label: _("Rename Imported Node..."),
               visible: Editor .getScene (importedNode .getExecutionContext ()) === this .executionContext,
               args: ["renameImportedNode", element .attr ("id")],
            },
            {
               label: _("Remove Imported Node"),
               visible: Editor .getScene (importedNode .getExecutionContext ()) === this .executionContext,
               args: ["removeImportedNode", element .attr ("id")],
            },
         ];
      }

      else if (element .is (".externproto, .proto"))
      {
         const
            protoNode = node,
            used      = Editor .isProtoNodeUsed (executionContext, protoNode),
            available = Editor .getNextAvailableProtoNode (executionContext, protoNode);

         var menu = [
            {
               label: _("Add Prototype..."),
               args: ["addPrototype", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: _("Rename Prototype..."),
               args: ["renamePrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            {
               label: _("Delete Prototype"),
               enabled: !used || !!available,
               args: ["deletePrototype", element .attr ("id"), executionContext .getId (), protoNode .getId (), used, available ?.getId ()],
            },
            { type: "separator" },
            {
               label: _("Copy"),
               args: ["copyNodes"],
            },
            {
               label: _("Copy Extern Prototype"),
               visible: !protoNode .isExternProto,
               enabled: executionContext instanceof X3D .X3DScene,
               args: ["copyExternPrototype"],
            },
            { type: "separator" },
            {
               label: _("Add Field..."),
               visible: !protoNode .isExternProto,
               args: ["addUserDefinedField", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            { type: "separator" },
            {
               label: _("Open Extern Prototype Scene in New Tab"),
               visible: protoNode .isExternProto,
               enabled: protoNode .isExternProto && protoNode .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE,
               args: ["openFileInNewTab", protoNode .getInternalScene ?.() ?.worldURL],
            },
            {
               label: _("Turn into Extern Prototype..."),
               visible: !protoNode .isExternProto,
               args: ["turnIntoExternPrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            {
               label: _("Turn into Prototype"),
               visible: protoNode .isExternProto,
               enabled: protoNode .isExternProto && protoNode .checkLoadState () === X3D .X3DConstants .COMPLETE_STATE,
               args: ["turnIntoPrototype", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
            { type: "separator" },
            {
               label: _("Add Instance"),
               enabled: !(protoNode .isExternProto && executionContext .protos .get (protoNode .getName ())),
               args: ["addInstance", element .attr ("id"), executionContext .getId (), protoNode .getId ()],
            },
         ]
      }

      else if (element .is ("#outline-editor, .proto-scene, .description.externprotos, .description.protos, .description.root-nodes, .description.empty-scene"))
      {
         var menu = [
            {
               label: _("Add Node..."),
               args: ["openLibrary", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: _("Add Prototype..."),
               args: ["addPrototype", element .attr ("id"), executionContext .getId ()],
            },
            {
               label: _("Paste"),
               args: ["pasteNodes", element .attr ("id"), executionContext .getId ()],
            },
         ];
      }
      else
      {
         return;
      }

      electron .ipcRenderer .send ("context-menu", "outline-editor", menu);
   }

   addUserDefinedField (id, executionContextId, nodeId, fieldId)
   {
      require ("../Controls/EditUserDefinedFieldPopover");

      const
         element          = $(`#${id}`),
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId),
         field            = this .objects .get (fieldId),
         index            = node .getUserDefinedFields () .indexOf (field);

      element .find ("> .item") .editUserDefinedFieldPopover (executionContext, node, index < 0 ? 0 : index + 1);
   }

   editUserDefinedField (id, executionContextId, nodeId, fieldId)
   {
      require ("../Controls/EditUserDefinedFieldPopover");

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
         field            = this .objects .get (fieldId);

      this .beginUndoSetFieldValue (node, field);

      Editor .resetToDefaultValue (executionContext, node, field);

      this .endUndoSetFieldValue (node, field);
   }

   triggerEvent (id, nodeId, fieldId)
   {
      const field = this .objects .get (fieldId);

      field .addEvent ();
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

   addExportedNode (id, executionContextId, nodeId)
   {
      require ("../Controls/ExportNodePopover");

      const
         element = $(`#${id}`),
         node    = this .objects .get (nodeId);

      element .find ("> .item") .exportNodePopover (node);
   }

   renameExportedNode (id)
   {
      require ("../Controls/ExportNodePopover");

      const
         element      = $(`#${id}`),
         exportedNode = this .objects .get (parseInt (element .attr ("exported-node-id")));

      element .find ("> .item") .exportNodePopover (exportedNode .getLocalNode (), exportedNode .getExportedName ());
   }

   removeExportedNode (id)
   {
      const
         element      = $(`#${id}`),
         exportedNode = this .objects .get (parseInt (element .attr ("exported-node-id")));

      Editor .removeExportedNode (exportedNode .getExecutionContext (), exportedNode .getExportedName ());
   }

   addImportedNode (id)
   {
      require ("../Controls/ImportNodePopover");

      const
         element      = $(`#${id}`),
         exportedNode = this .objects .get (parseInt (element .attr ("exported-node-id"))),
         inlineNode   = this .getNode (element .closest (".node", this .sceneGraph));

      element .find ("> .item") .importNodePopover (inlineNode, exportedNode .getExportedName ());
   }

   renameImportedNode (id)
   {
      require ("../Controls/ImportNodePopover");

      const
         element      = $(`#${id}`),
         importedNode = this .objects .get (parseInt (element .attr ("imported-node-id")));

      element .find ("> .item") .importNodePopover (importedNode .getInlineNode (), importedNode .getExportedName (), importedNode .getImportedName ());
   }

   removeImportedNode (id)
   {
      const
         element      = $(`#${id}`),
         importedNode = this .objects .get (parseInt (element .attr ("imported-node-id")));

      Editor .removeImportedNode (importedNode .getExecutionContext (), importedNode .getImportedName ());
   }

   cutNodes ()
   {
      UndoManager .shared .beginUndo (_("Cut Nodes"));

      this .copyNodes ();
      this .deleteNodes ();

      UndoManager .shared .endUndo ();
   }

   copyNodes ()
   {
      const
         primary     = $(".node.primary, .proto.primary, .externproto.primary"),
         selected    = this .sceneGraph .find (".node.manually, .proto.manually, .externproto.manually"),
         selection   = selected .filter (primary) .length ? selected : primary,
         ids         = selection .map (function () { return this .id }) .get (),
         elements    = ids .map (id => $(`#${id}`)),
         nodes       = elements .map (element => this .getNode ($(element))),
         undoManager = new UndoManager ();

      undoManager .beginUndo ();

      for (const element of elements)
      {
         const node = this .getNode ($(element));

         if (!node .getType () .includes (X3D .X3DConstants .X3DTransformNode))
            continue;

         Editor .setMatrixWithCenter (node, this .getModelMatrix (element), undefined, undoManager);
      }

      undoManager .endUndo ();

      const x3dSyntax = Editor .exportX3D (this .executionContext, nodes, { importedNodes: true });

      //console .log (x3dSyntax)

      navigator .clipboard .writeText (x3dSyntax);

      undoManager .undo ();
   }

   copyExternPrototype ()
   {
      const
         elements = $(".proto.primary, .proto.manually"),
         protos   = [... elements] .map (element => this .getNode ($(element)));

      const
         browser  = this .executionContext .getBrowser (),
         scene    = browser .createScene (),
         worldURL = new URL (this .executionContext .worldURL),
         basename = path .basename (worldURL .pathname);

      scene .setMetaData ("base", this .executionContext .worldURL);

      for (const proto of protos)
      {
         const
            url         = `${basename}#${proto .getName ()}`,
            externproto = new X3D .X3DExternProtoDeclaration (scene, new X3D .MFString (url));

         scene .addExternProtoDeclaration (proto .getName (), externproto);
      }

      navigator .clipboard .writeText (scene .toXMLString ());
   }

   async pasteNodes (id, executionContextId, nodeId, fieldId)
   {
      try
      {
         // if there is a selected field or node, update nodeId and fieldId.

         const
            primary                 = $(".primary"),
            executionContextElement = primary .closest (".scene", this .sceneGraph),
            executionContext        = this .objects .get (executionContextId) ?? this .getNode (executionContextElement) ?? this .executionContext,
            targetNode              = this .objects .get (nodeId) ?? this .getNode (primary),
            targetField             = this .objects .get (fieldId) ?? this .getField (primary),
            numRootNodes            = executionContext .rootNodes .length,
            x3dSyntax               = await navigator .clipboard .readText (),
            destinationModelMatrix  = nodeId !== undefined ? this .getModelMatrix ($(`.node[node-id=${nodeId}]`)) : new X3D .Matrix4 ();

         UndoManager .shared .beginUndo (_("Paste Nodes"));

         const nodes = await Editor .importX3D (executionContext, x3dSyntax);

         for (const node of nodes)
         {
            const
               containerField = $.try (() => node .getInnerNode () .getContainerField ()) ?? node .getContainerField (),
               field          = targetField ?? $.try (() => targetNode ?.getField (containerField));

            if (!field)
               continue;

            // Adjust matrix.

            if (node .getType () .includes (X3D .X3DConstants .X3DTransformNode))
            {
               const
                  sourceModelMatrix = node .getMatrix (),
                  matrix            = destinationModelMatrix .copy () .inverse () .multLeft (sourceModelMatrix);

               Editor .setMatrixWithCenter (node, matrix);
            }

            // Move node.

            switch (field .getType ())
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

         requestAnimationFrame (() =>
         {
            for (const node of nodes)
               this .expandTo (node);
         });
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
         selected  = this .sceneGraph .find (".node.manually"),
         selection = !primary .length || selected .filter (primary) .length ? selected : primary,
         ids       = selection .map (function () { return this .id }) .get ();

      if (ids .length > 1)
         UndoManager .shared .beginUndo (_("Delete %s Nodes"), ids .length);
      else if (ids .length === 1)
         UndoManager .shared .beginUndo (_("Delete Node %s"), this .getNode ($(`#${ids [0]}`)) .getTypeName ());
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

      UndoManager .shared .beginUndo (_("Unlink Clone"));

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

      UndoManager .shared .beginUndo (_("Add Parent %s to Node %s"), typeName, childNode .getTypeName ());

      await Editor .addComponent (executionContext, component);

      // Create new parent node.

      const
         node  = executionContext .createNode (typeName) .getValue (),
         field = node .getField (fieldName);

      switch (typeName)
      {
         case "Switch":
         {
            node ._whichChoice = 0;
            break;
         }
      }

      // Add primary node to new parent node.

      if (field .getType () === X3D .X3DConstants .MFNode)
         Editor .insertValueIntoArray (executionContext, node, field, 0, childNode);
      else
         Editor .setFieldValue (executionContext, node, field, childNode);

      // Insert new parent node.

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
            selectedNodes          = Array .from (this .sceneGraph .find (".node.manually,.node.primary"), e => this .getNode ($(e))),
            selectedElements       = Array .from (this .sceneGraph .find (".node.manually"), e => $(e)),
            destinationModelMatrix = this .getModelMatrix (parentNodeElement);

         // Add other selected nodes.

         const otherElements = selectedElements
            .filter (e => e [0] !== element [0])
            .sort ((a, b) => b .attr ("index") - a .attr ("index"));

         for (const otherElement of otherElements)
         {
            const
               otherChildNode          = this .getNode (otherElement),
               otherChildIndex         = parseInt (otherElement .attr ("index")),
               otherParentFieldElement = otherElement .closest (".field, .scene", this .sceneGraph),
               otherParentNodeElement  = otherParentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
               otherParentNode         = this .getNode (otherParentNodeElement),
               otherParentField        = otherParentFieldElement .hasClass ("scene") ? otherParentNode .rootNodes : this .getField (otherParentFieldElement);

            // Adjust matrix.

            if (otherParentField !== parentField)
            {
               if (otherChildNode .getType () .includes (X3D .X3DConstants .X3DTransformNode))
               {
                  const
                     sourceModelMatrix = this .getModelMatrix (otherElement),
                     matrix            = destinationModelMatrix .copy () .inverse () .multLeft (sourceModelMatrix);

                  Editor .setMatrixWithCenter (otherChildNode, matrix);
               }
            }

            // Move node.

            Editor .insertValueIntoArray (executionContext, node, field, 1, otherChildNode);

            switch (otherParentField .getType ())
            {
               case X3D .X3DConstants .SFNode:
                  Editor .setFieldValue (executionContext, otherParentNode, otherParentField, null);
                  break;
               case X3D .X3DConstants .MFNode:
                  Editor .removeValueFromArray (executionContext, otherParentNode, otherParentField, otherChildIndex);
                  break;
            }
         }

         // Reorder nodes.

         Editor .setFieldValue (executionContext, node, field, selectedNodes);
      }

      UndoManager .shared .endUndo ();

      requestAnimationFrame (() => this .expandTo (node, true));
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

      UndoManager .shared .beginUndo (_("Remove Parent of %s"), childNode .getTypeName ());

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

   openFileInNewTab (fileURL)
   {
      electron .ipcRenderer .invoke ("open-files", [fileURL]);
   }

   async foldInlineBackIntoScene (id, executionContextId, nodeId)
   {
      const
         element                = $(`#${id}`),
         executionContext       = this .objects .get (executionContextId),
         inlineNode             = this .objects .get (nodeId),
         childIndex             = parseInt (element .attr ("index")),
         parentFieldElement     = element .closest (".field, .scene", this .sceneGraph),
         parentNodeElement      = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parentNode             = this .getNode (parentNodeElement),
         parentField            = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement);

      if (inlineNode .getInternalScene () .rootNodes .length === 0)
         return;

      UndoManager .shared .beginUndo (_("Fold Inline Back into Scene"));

      const
         rootNodes     = executionContext .rootNodes .copy (),
         nodesToImport = [... inlineNode .getInternalScene () .rootNodes] .map (node => node .getValue ()),
         x3dSyntax     = Editor .exportX3D (inlineNode .getInternalScene (), nodesToImport, { importedNodes: true }),
         nodes         = await Editor .importX3D (executionContext, x3dSyntax);

      // Remove imported nodes from root nodes.

      Editor .setFieldValue (executionContext, executionContext, executionContext .rootNodes, rootNodes);

      // Create Inline node.

      switch (nodes .length)
      {
         case 1:
         {
            var childNode = nodes [0];
            break;
         }
         default:
         {
            await Editor .addComponent (executionContext, "Grouping");

            var childNode = executionContext .createNode ("Group") .getValue ();

            childNode ._children = nodes;

            if (inlineNode .getName ())
               Editor .updateNamedNode (executionContext, inlineNode .getName (), childNode);

            break;
         }
      }

      // Insert Inline node.

      switch (parentField .getType ())
      {
         case X3D .X3DConstants .SFNode:
            Editor .setFieldValue (executionContext, parentNode, parentField, childNode);
            break;
         case X3D .X3DConstants .MFNode:
            Editor .insertValueIntoArray (executionContext, parentNode, parentField, childIndex, childNode);
            Editor .removeValueFromArray (executionContext, parentNode, parentField, childIndex + 1);
            break;
      }

      UndoManager .shared .endUndo ();

      if (nodes .length > 1)
         requestAnimationFrame (() => this .expandTo (childNode, true));
   }

   moveViewpointToCamera (id, executionContextId, nodeId)
   {
      const
         layerNode        = this .getLayer ($(`#${id}`)),
         activeViewpoint  = layerNode .getViewpoint (),
         viewpointNode    = this .objects .get (nodeId),
         position         = activeViewpoint .getUserPosition (),
         orientation      = activeViewpoint .getUserOrientation (),
         centerOfRotation = activeViewpoint .getUserCenterOfRotation (),
         fieldOfView      = activeViewpoint .getUserFieldOfView ();

      Editor .moveViewpoint (viewpointNode, position, orientation, centerOfRotation, fieldOfView);
   }

   determineBoundingBoxFromScratch (id, executionContextId, nodeId)
   {
      const node = this .objects .get (nodeId);

      UndoManager .shared .beginUndo (_("Determine Bounding Box From Scratch"));

      Editor .setFieldValue (node .getExecutionContext (), node, node ._bboxSize,   new X3D .Vector3 (-1, -1, -1));
      Editor .setFieldValue (node .getExecutionContext (), node, node ._bboxCenter, new X3D .Vector3 ());

      const bbox = node .getBBox (new X3D .Box3 ());

      Editor .setFieldValue (node .getExecutionContext (), node, node ._bboxSize,   bbox .size);
      Editor .setFieldValue (node .getExecutionContext (), node, node ._bboxCenter, bbox .center);

      UndoManager .shared .endUndo ();
   }

   async convertNodeToInlineFile (id, executionContextId, nodeId)
   {
      const
         element                = $(`#${id}`),
         executionContext       = this .objects .get (executionContextId),
         childNode              = this .objects .get (nodeId),
         childIndex             = parseInt (element .attr ("index")),
         parentFieldElement     = element .closest (".field, .scene", this .sceneGraph),
         parentNodeElement      = parentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
         parentNode             = this .getNode (parentNodeElement),
         parentField            = parentFieldElement .hasClass ("scene") ? parentNode .rootNodes : this .getField (parentFieldElement),
         response               = await electron .ipcRenderer .invoke ("file-path", { type: "save", defaultPath: childNode .getName () });

      if (response .canceled)
         return;

      UndoManager .shared .beginUndo (_("Convert Node to Inline File"));

      // Create inline file.

      await Editor .convertNodesToInlineFile (executionContext, [childNode], response .filePath);

      // Create Inline node.

      await Editor .addComponent (executionContext, "Networking");

      const inlineNode = executionContext .createNode ("Inline") .getValue ();

      inlineNode ._url = [
         $.try (() => path .relative (path .dirname (url .fileURLToPath (executionContext .getWorldURL ())), response .filePath))
            ?? url .pathToFileURL (response .filePath)
      ];

      if (childNode .getName ())
         Editor .updateNamedNode (executionContext, childNode .getName (), inlineNode);

      // Insert Inline node.

      switch (parentField .getType ())
      {
         case X3D .X3DConstants .SFNode:
            Editor .setFieldValue (executionContext, parentNode, parentField, inlineNode);
            break;
         case X3D .X3DConstants .MFNode:
            Editor .insertValueIntoArray (executionContext, parentNode, parentField, childIndex, inlineNode);
            Editor .removeValueFromArray (executionContext, parentNode, parentField, childIndex + 1);
            break;
      }

      UndoManager .shared .endUndo ();

      requestAnimationFrame (() => this .expandTo (inlineNode));
   }

   addNormalsToGeometry (id, executionContextId, nodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId);

      UndoManager .shared .beginUndo (_("Add Normals to %s"), node .getTypeName ());

      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .IndexedFaceSet:
            {
               const
                  polygons    = node .triangulate (),
                  normals     = node .createNormals (polygons),
                  normalIndex = new X3D .MFInt32 (),
                  normalNode  = executionContext .createNode ("Normal") .getValue ();

               for (let i = 0, length = node ._coordIndex .length; i < length; ++ i)
               {
                  const index = node ._coordIndex [i];

                  if (index < 0)
                  {
                     normalIndex .push (-1);
                  }
                  else
                  {
                     normalIndex .push (normalNode ._vector .length);
                     normalNode ._vector .push (normals [i]);
                  }
               }

               Editor .setFieldValue (executionContext, node, node ._normalPerVertex, true);
               Editor .setFieldValue (executionContext, node, node ._normalIndex,     normalIndex);
               Editor .setFieldValue (executionContext, node, node ._normal,          normalNode);
               break;
            }
         }

         break;
      }

      UndoManager .shared .endUndo ();
   }

   removeNormalsFromGeometry (id, executionContextId, nodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         node             = this .objects .get (nodeId);

      UndoManager .shared .beginUndo (_("Remove Normals from %s"), node .getTypeName ());

      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .IndexedFaceSet:
            {
               Editor .resetToDefaultValue (executionContext, node, node ._normalPerVertex);
               Editor .resetToDefaultValue (executionContext, node, node ._normalIndex);
               Editor .resetToDefaultValue (executionContext, node, node ._normal);
               break;
            }
         }

         break;
      }

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
         UndoManager .shared .beginUndo (_("Remove Extern Prototype Declaration »%s«"), protoNode .getName ());
         Editor .removeExternProtoDeclaration (executionContext, protoNode .getName ());
      }
      else
      {
         UndoManager .shared .beginUndo (_("Remove Prototype Declaration »%s«"), protoNode .getName ());
         Editor .removeProtoDeclaration (executionContext, protoNode .getName ());
      }

      if (used)
         Editor .replaceProtoNodes (executionContext, protoNode, this .objects .get (availableId));

      UndoManager .shared .endUndo ();
   }

   async turnIntoExternPrototype (id, executionContextId, protoNodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         proto            = this .objects .get (protoNodeId),
         response         = await electron .ipcRenderer .invoke ("file-path", { type: "save", defaultPath: proto .getName () });

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

   addInstance (id, executionContextId, protoNodeId)
   {
      const
         executionContext = this .objects .get (executionContextId),
         protoNode        = this .objects .get (protoNodeId),
         instance         = executionContext .createProto (protoNode .getName ());

      UndoManager .shared .beginUndo (_("Add Instance of Type »%s«"), protoNode .getName ());

      Editor .appendValueToArray (executionContext, executionContext, executionContext .rootNodes, instance);

      UndoManager .shared .endUndo ();
   }

   activateLayer (event)
   {
      event .preventDefault ();
      event .stopImmediatePropagation ();

      const
         target    = $(event .target),
         element   = target .closest (".node", this .sceneGraph),
         layerNode = this .getNode (element),
         layerSet  = this .browser .getWorld () .getLayerSet (),
         index     = layerSet ._layers .findIndex (node => node ?.getValue () .valueOf () === layerNode);

      if (index < 0)
         return;

      if (layerSet ._activeLayer .getValue () === index + 1)
         Editor .setFieldValue (this .browser .currentScene, layerSet, layerSet ._activeLayer, -1);
      else
         Editor .setFieldValue (this .browser .currentScene, layerSet, layerSet ._activeLayer, index + 1);
   }

   addBooleanField (button)
   {
      const
         element = button .closest (".field"),
         node    = this .getNode (element),
         field   = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      button .addClass ("pointer") .on ("click", event =>
      {
         event .preventDefault ();
         event .stopImmediatePropagation ();

         Editor .setFieldValue (node .getExecutionContext (), node, field, !field .getValue ());
      });
   }

   addColorField (button)
   {
      //https://seballot.github.io/spectrum/#skinning-nonInput
      require ("spectrum-colorpicker2");

      const
         element = button .closest (".field"),
         node    = this .getNode (element),
         field   = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      button .addClass ("pointer") .spectrum ({
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
         button .spectrum ("set", button .css ("background-color"));
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
         if (node .getDisplayName ())
            UndoManager .shared .beginUndo (_("Change Field »%s« of Node %s »%s«"), field .getName (), node .getTypeName (), node .getDisplayName ());
         else
            UndoManager .shared .beginUndo (_("Change Field »%s« of Node %s"), field .getName (), node .getTypeName ());
      })
      .on ("dragstop.spectrum", (event, tinyColor) =>
      {
         UndoManager .shared .endUndo ();
      });
   }

   removeColorField (button)
   {
      button .spectrum ?.("destroy");
   }

   addTimeField (button)
   {
      const
         element  = button .closest (".field"),
         node     = this .getNode (element),
         field    = this .getField (element);

      if (field .getAccessType () === X3D .X3DConstants .outputOnly)
         return;

      button .addClass ("pointer") .on ("click", event =>
      {
         event .preventDefault ();
         event .stopImmediatePropagation ();

         Editor .setFieldValue (node .getExecutionContext (), node, field, Date .now () / 1000);
      });
   }

   addUrlField (button)
   {
      const
         element  = button .closest (".field, .special"),
         node     = this .getNode (element),
         field    = this .getField (element);

      button .addClass ("pointer") .on ("click", async event =>
      {
         event .preventDefault ();
         event .stopImmediatePropagation ();

         switch (node .getTypeName ())
         {
            case "X3DExternProtoDeclaration":
            case "Inline":
            {
               var filters = undefined;
               break;
            }
            default:
            {
               var filters = [
                  { name: _("All Files"), extensions: ["*"] },
               ];

               break;
            }
         }

         const response = await electron .ipcRenderer .invoke ("file-path",
         {
            type: "open",
            filters: filters,
         });

         if (response .canceled)
            return;

         const
            worldURL = node .getExecutionContext () .getWorldURL (),
            value    = field .copy ();

         for (const filePath of response .filePaths .reverse ())
         {
            try
            {
               value .unshift (path .relative (path .dirname (url .fileURLToPath (worldURL)), filePath));
            }
            catch
            {
               value .unshift (url .pathToFileURL (filePath));
            }
         }

         Editor .setFieldValue (node .getExecutionContext (), node, field, value);
      });
   }

   /*
    * Change field value.
    */

   onFieldEdited (input, node, field)
   {
      try
      {
         this .beginUndoSetFieldValue (node, field);

         if (field .getType () === X3D .X3DConstants .SFString)
            Editor .setFieldValue (node .getExecutionContext (), node, field, input .val ());
         else
            Editor .setFieldFromString (node .getExecutionContext (), node, field, input .val ());
      }
      catch
      {
         electron .shell .beep ();
         input .highlight ();
      }
      finally
      {
         this .endUndoSetFieldValue (node, field);
      }
   }

   beginUndoSetFieldValue (node, field)
   {
      const toolNode = node .getTool ?.();

      if (!toolNode ?.tool ?.undo)
         return;

      if (node .getDisplayName ())
         UndoManager .shared .beginUndo (_("Change Field »%s« of Node %s »%s«"), field .getName (), node .getTypeName (), node .getDisplayName ());
      else
         UndoManager .shared .beginUndo (_("Change Field »%s« of Node %s"), field .getName (), node .getTypeName ());

      switch (node .getTypeName ())
      {
         case "Arc2D":
         case "ArcClose2D":
         case "Circle2D":
         case "Rectangle2D":
         case "Box":
         case "Cone":
         case "Cylinder":
         case "Sphere":
         {
            toolNode .getTransformTool () .tool .getField ("active") .setValue (true);
            break;
         }
         case "Disk2D":
         {
            if (field .getName () === "innerRadius")
            {
               toolNode .tool .group = `${node .getTypeName ()}.innerRadius`;
               toolNode .getInnerRadiusTransformTool () .tool .getField ("active") .setValue (true);
            }

            if (field .getName () === "outerRadius")
            {
               toolNode .tool .group = `${node .getTypeName ()}.outerRadius`;
               toolNode .getOuterRadiusTransformTool () .tool .getField ("active") .setValue (true);
            }

            break;
         }
         default:
         {
            if (toolNode .tool .group !== "Transform")
               break;

            const innerTool = toolNode .tool .transformTool ?.getValue () .getTool ();

            if (innerTool)
               innerTool .tool .getField ("active") .setValue (true);
            else
               toolNode .tool .getField ("active") .setValue (true);

            break;
         }
      }

      toolNode .handleUndo (new X3D .SFBool (true));
   }

   #endUndoSetFieldValueSymbol = Symbol ();

   endUndoSetFieldValue (node, field)
   {
      const toolNode = node .getTool ?.();

      if (!toolNode ?.tool ?.undo)
         return;

      switch (node .getTypeName ())
      {
         case "Arc2D":
         case "ArcClose2D":
         case "Circle2D":
         case "Rectangle2D":
         case "Box":
         case "Cone":
         case "Cylinder":
         case "Sphere":
         {
            this .browser .finishedEvents () .addFieldCallback (this .#endUndoSetFieldValueSymbol, () =>
            {
               this .browser .finishedEvents () .removeFieldCallback (this .#endUndoSetFieldValueSymbol);

               toolNode .getTransformTool () .transformGroups ();
               toolNode .handleUndo (new X3D .SFBool ());
               toolNode .getTransformTool () .tool .getField ("active") .setValue (false);

               UndoManager .shared .endUndo ();
            });

            break;
         }
         case "Disk2D":
         {
            this .browser .finishedEvents () .addFieldCallback (this .#endUndoSetFieldValueSymbol, () =>
            {
               this .browser .finishedEvents () .removeFieldCallback (this .#endUndoSetFieldValueSymbol);

               if (field .getName () === "innerRadius")
                  toolNode .getInnerRadiusTransformTool () .transformGroups ();

               if (field .getName () === "outerRadius")
                  toolNode .getOuterRadiusTransformTool () .transformGroups ();

               toolNode .handleUndo (new X3D .SFBool ());

               if (field .getName () === "innerRadius")
                  toolNode .getInnerRadiusTransformTool () .tool .getField ("active") .setValue (false);

               if (field .getName () === "outerRadius")
                  toolNode .getOuterRadiusTransformTool () .tool .getField ("active") .setValue (false);

               UndoManager .shared .endUndo ();
            });

            break;
         }
         default:
         {
            if (toolNode .tool .group !== "Transform")
               break;

            const innerTool = toolNode .tool .transformTool ?.getValue () .getTool ();

            if (innerTool)
            {
               // Sound, X3DEnvironmentalSensorNode, ...

               this .browser .finishedEvents () .addFieldCallback (this .#endUndoSetFieldValueSymbol, () =>
               {
                  this .browser .finishedEvents () .removeFieldCallback (this .#endUndoSetFieldValueSymbol);

                  innerTool .transformGroups ();
                  toolNode .handleUndo (new X3D .SFBool ());
                  innerTool .tool .getField ("active") .setValue (false);

                  UndoManager .shared .endUndo ();
               });
            }
            else
            {
               // TransformTool

               toolNode .transformGroups ();
               toolNode .handleUndo (new X3D .SFBool ());
               toolNode .tool .getField ("active") .setValue (true);

               UndoManager .shared .endUndo ();
            }

            break;
         }
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
         electron .shell .beep ();
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
         field   = this .getField (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      if (!this .isEditable (element .parent ()))
         return;

      if (event .ctrlKey || event .metaKey)
      {
         switch (type)
         {
            case "input":
            {
               const routes = field .getInputRoutes ();

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

                        Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);
                     }

                     break;
                  }
                  default:
                  {
                     element .data ("full-expanded", true);
                     element .jstree ("open_node", element);
                     break;
                  }
               }

               break
            }
            case "output":
            {
               const routes = field .getOutputRoutes ();

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

                        Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);
                     }

                     break;
                  }
                  default:
                  {
                     element .data ("full-expanded", true);
                     element .jstree ("open_node", element);
                     break;
                  }
               }

               break;
            }
         }
      }
      else
      {
         const
            sceneElement     = element .closest (".scene", this .sceneGraph),
            executionContext = this .getNode (sceneElement);

         switch (type)
         {
            case "input":
            {
               if (this .connector)
               {
                  if (this .connector .type === type)
                     break;

                  if (this .connector .executionContext !== executionContext)
                     break;

                  if (this .connector .field .getType () !== field .getType ())
                     break;

                  if (this .connector .node .getField (this .connector .field .getName ()) .getFieldInterests () .has (node .getField (field .getName ())))
                     break;

                  // Add route.

                  Editor .addRoute (executionContext, this .connector .node, this .connector .field .getName (), node, field .getName ());

                  if (event .shiftKey)
                     break;

                  this .connector .element .find (".access-type img.active.output.activated")
                     .removeClass ("activated");

                  delete this .connector;
               }
               else
               {
                  this .connector = { type, executionContext, node, field, element };
               }

               break
            }
            case "output":
            {
               if (this .connector)
               {
                  if (this .connector .type === type)
                     break;

                  if (this .connector .executionContext !== executionContext)
                     break;

                  if (this .connector .field .getType () !== field .getType ())
                     break;

                  if (node .getField (field .getName ()) .getFieldInterests () .has (this .connector .node .getField (this .connector .field .getName ())))
                     break;

                  // Add route.

                  Editor .addRoute (executionContext, node, field .getName (), this .connector .node, this .connector .field .getName ());

                  if (event .shiftKey)
                     break;

                  this .connector .element .find (".access-type img.active.input.activated")
                     .removeClass ("activated");

                  delete this .connector;
               }
               else
               {
                  this .connector = { type, executionContext, node, field, element };
               }

               break;
            }
         }
      }
   }

   selectSingleConnector (type, event)
   {
      // Click on connector.

      const
         element = $(event .currentTarget) .closest (".route", this .sceneGraph),
         field   = this .getField (element);

      event .preventDefault ();
      event .stopImmediatePropagation ();

      if (!this .isEditable (element .parent ()))
         return;

      if (!(event .ctrlKey || event .metaKey))
         return;

      element .hide ();

      switch (type)
      {
         case "input":
         {
            const route = this .getRoute (element, field .getInputRoutes ())

            Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);
            break;
         }
         case "output":
         {
            const route = this .getRoute (element, field .getOutputRoutes ());

            Editor .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField);
            break;
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
         selected  = this .sceneGraph .find (".externproto.manually"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ();

      this .selectPrimaryElement (element);

      event .originalEvent .dataTransfer .setData ("sunrize/externproto", ids .join (","));
   }

   onDragStartProto (event)
   {
      const
         element   = $(event .target) .closest (".proto", this .sceneGraph),
         selected  = this .sceneGraph .find (".proto.manually"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ();

      this .selectPrimaryElement (element);

      event .originalEvent .dataTransfer .setData ("sunrize/proto", ids .join (","));
   }

   onDragStartNode (event)
   {
      const
         element   = $(event .target) .closest (".node", this .sceneGraph),
         selected  = this .sceneGraph .find (".node.manually"),
         selection = selected .filter (element) .length ? selected : element,
         ids       = selection .map (function () { return this .id }) .get ();

      this .selectPrimaryElement (element);

      event .originalEvent .dataTransfer .setData ("sunrize/nodes", ids .join (","));
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
      event .preventDefault ();
      event .stopPropagation ();

      // Hide drop indicator.

      const element = $(event .target)
         .closest ("li, .scene-graph", this .sceneGraph);

      element .find ("> .item") .addBack ()
         .removeClass (["drag-before", "drag-into", "drag-after"]);
   }

   async onDrop (event)
   {
      // console .log ("onDrop");

      event .preventDefault ();
      event .stopPropagation ();

      if (event .originalEvent .dataTransfer .types .includes ("sunrize/externproto"))
      {
         const
            sourceElementId               = event .originalEvent .dataTransfer .getData ("sunrize/externproto"),
            sourceElement                 = $("#" + sourceElementId),
            sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
            sourceExecutionContext        = this .getNode (sourceExecutionContextElement),
            sourceIndex                   = parseInt (sourceElement .attr ("index"));

         let sourceExternProto = this .getNode (sourceElement);

         const
            destinationElement                 = $(event .target) .closest (".externproto, .externprotos, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement);

         let destinationIndex = destinationElement .hasClass ("externproto") ? parseInt (destinationElement .attr ("index")) : destinationExecutionContext .externprotos .length;

         if (destinationElement .hasClass ("externproto") && destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex;

         switch (destinationElement .data ("dropEffect"))
         {
            case "copy":
            {
               UndoManager .shared .beginUndo (_("Copy Extern Proto »%s«"), sourceExternProto .getName ());

               await Editor .importX3D (destinationExecutionContext, Editor .exportX3D (sourceExecutionContext, [sourceExternProto]));

               const
                  externprotos = Array .from (destinationExecutionContext .externprotos),
                  externproto  = externprotos .pop ();

               externprotos .splice (destinationIndex, 0, externproto);

               Editor .setExternProtoDeclarations (destinationExecutionContext, externprotos);

               if (Editor .isParentContext (sourceExecutionContext, destinationExecutionContext))
               {
                  if (!destinationExecutionContext .protos .get (externproto .getName ()))
                  {
                     const available = Editor .getNextAvailableProtoNode (destinationExecutionContext, externproto);

                     Editor .replaceProtoNodes (destinationExecutionContext, available, externproto);
                  }
               }

               UndoManager .shared .endUndo ();
               break;
            }
            case "move":
            {
               if (sourceExecutionContext !== destinationExecutionContext)
                  break;

               if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
                  break;

               UndoManager .shared .beginUndo (_("Move Extern Proto »%s«"), sourceExternProto .getName ());

               const externprotos = Array .from (destinationExecutionContext .externprotos);

               if (sourceIndex < destinationIndex)
                  -- destinationIndex;

               externprotos .splice (sourceIndex, 1);
               externprotos .splice (destinationIndex, 0, sourceExternProto);

               Editor .setExternProtoDeclarations (destinationExecutionContext, externprotos);
               UndoManager .shared .endUndo ();
               break;
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
            sourceIndex                   = parseInt (sourceElement .attr ("index"));

         let sourceProto = this .getNode (sourceElement);

         const
            destinationElement                 = $(event .target) .closest (".proto, .protos, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement);

         let destinationIndex = destinationElement .hasClass ("proto") ? parseInt (destinationElement .attr ("index")) : destinationExecutionContext .protos .length;

         if (destinationElement .hasClass ("proto") && destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex;

         switch (destinationElement .data ("dropEffect"))
         {
            case "copy":
            {
               UndoManager .shared .beginUndo (_("Copy Prototype »%s«"), sourceProto .getName ());

               await Editor .importX3D (destinationExecutionContext, Editor .exportX3D (sourceExecutionContext, [sourceProto]));

               const
                  protos = Array .from (destinationExecutionContext .protos),
                  proto  = protos .pop ();

               protos .splice (destinationIndex, 0, proto);

               Editor .setProtoDeclarations (destinationExecutionContext, protos);

               if (Editor .isParentContext (sourceExecutionContext, destinationExecutionContext))
               {
                  const available = Editor .getNextAvailableProtoNode (destinationExecutionContext, proto);

                  Editor .replaceProtoNodes (destinationExecutionContext, available, proto);
               }

               UndoManager .shared .endUndo ();
               break;
            }
            case "move":
            {
               if (sourceExecutionContext !== destinationExecutionContext)
                  break;

               if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
                  break;

               UndoManager .shared .beginUndo (_("Move Prototype »%s«"), sourceProto .getName ());

               const protos = Array .from (destinationExecutionContext .protos);

               if (sourceIndex < destinationIndex)
                  -- destinationIndex;

               protos .splice (sourceIndex, 1);
               protos .splice (destinationIndex, 0, sourceProto);

               Editor .setProtoDeclarations (destinationExecutionContext, protos);
               UndoManager .shared .endUndo ();
               break;
            }
         }
      }
      else if (event .originalEvent .dataTransfer .types .includes ("sunrize/nodes"))
      {
         const sourceElementsIds = event .originalEvent .dataTransfer .getData ("sunrize/nodes") .split (",");

         const
            destinationElement                 = $(event .target) .closest ("li, .scene", this .sceneGraph),
            destinationParentFieldElement      = destinationElement .closest (".field, .scene", this .sceneGraph),
            destinationParentNodeElement       = destinationParentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
            destinationExecutionContextElement = destinationElement .closest (".scene", this .sceneGraph),
            destinationExecutionContext        = this .getNode (destinationExecutionContextElement);

         let
            destinationParentNode  = this .getNode (destinationParentNodeElement),
            destinationParentField = destinationParentFieldElement .hasClass ("scene") ? destinationParentNode .rootNodes : this .getField (destinationParentFieldElement),
            destinationIndex       = parseInt (destinationElement .attr ("index"));

         if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-after")
            ++ destinationIndex;

         if (destinationElement .attr ("node-id") !== "NULL")
         {
            if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-into")
            {
               destinationParentNode = this .getNode (destinationElement);
            }
         }

         // Begin undo.

         if (sourceElementsIds .length === 1)
         {
            const
               sourceElement = $("#" + sourceElementsIds [0]),
               sourceNode    = this .getNode (sourceElement) .getTool () ?? this .getNode (sourceElement);

            UndoManager .shared .beginUndo (this .getUndoDescriptionForNode (destinationElement .data ("dropEffect"), sourceNode), sourceNode .getTypeName (), sourceNode .getDisplayName ());
         }
         else
         {
            UndoManager .shared .beginUndo (this .getUndoDescriptionForNode (destinationElement .data ("dropEffect"), sourceElementsIds), sourceElementsIds .length);
         }

         // Copy source nodes if needed.

         const sourceNodes = [ ];

         for (const sourceElementId of sourceElementsIds)
         {
            const
               sourceElement                 = $("#" + sourceElementId),
               sourceNode                    = this .getNode (sourceElement) .getTool () ?? this .getNode (sourceElement),
               sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext        = this .getNode (sourceExecutionContextElement);

            if (destinationElement .data ("dropEffect") === "copy" || sourceExecutionContext !== destinationExecutionContext)
            {
               sourceNodes .push (sourceNode);
            }
         }

         const copiedNodes = sourceNodes .length
            ? await Editor .importX3D (destinationExecutionContext, Editor .exportX3D (this .executionContext, sourceNodes, { importedNodes: true }))
            : [ ];

         if (copiedNodes .length)
            destinationExecutionContext .rootNodes .length -= copiedNodes .length;

         // Move, copy, link nodes.

         const sourceIndexOffsets = new Map ();

         for (const sourceElementId of sourceElementsIds)
         {
            const
               sourceElement                 = $("#" + sourceElementId),
               sourceParentFieldElement      = sourceElement .closest (".field, .scene", this .sceneGraph),
               sourceParentNodeElement       = sourceParentFieldElement .closest (".node, .proto, .scene", this .sceneGraph),
               sourceParentNode              = this .getNode (sourceParentNodeElement),
               sourceParentField             = sourceParentFieldElement .hasClass ("scene") ? sourceParentNode .rootNodes : this .getField (sourceParentFieldElement),
               sourceExecutionContextElement = sourceElement .closest (".scene", this .sceneGraph),
               sourceExecutionContext        = this .getNode (sourceExecutionContextElement);

            let
               sourceNode  = this .getNode (sourceElement) .getTool () ?? this .getNode (sourceElement),
               sourceIndex = parseInt (sourceElement .attr ("index"));

            if (destinationElement .attr ("node-id") !== "NULL")
            {
               if (destinationElement .hasClass ("node") && destinationElement .data ("drag-type") === "drag-into")
               {
                  if (destinationParentNode === sourceNode)
                     continue;

                  const containerField = $.try (() => sourceNode .getInnerNode () .getContainerField ())
                     ?? sourceNode .getContainerField ();

                  if (containerField)
                     destinationParentField = $.try (() => destinationParentNode .getField (containerField));

                  if (!destinationParentField)
                  {
                     for (const field of destinationParentNode .getFields () .reverse ())
                     {
                        if (!field .isInitializable ())
                           continue;

                        if (field .getType () !== X3D .X3DConstants .SFNode && field .getType () !== X3D .X3DConstants .MFNode)
                           continue;

                        destinationParentField = field;
                        break;
                     }
                  }
               }
            }

            // Adjust source index.

            if (sourceIndexOffsets .has (sourceParentField))
            {
               if (sourceParentField !== destinationParentField || destinationIndex > sourceIndex || isNaN (destinationIndex))
                  sourceIndexOffsets .set (sourceParentField, sourceIndexOffsets .get (sourceParentField) - 1);
            }
            else
            {
               sourceIndexOffsets .set (sourceParentField, 0);
            }

            sourceIndex += sourceIndexOffsets .get (sourceParentField);

            // If source equal destination, continue.

            if (sourceParentField === destinationParentField && (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex || isNaN (sourceIndex) && isNaN (destinationIndex)) && destinationElement .data ("dropEffect") === "move")
            {
               continue;
            }

            // Remove source node.

            if (destinationElement .data ("dropEffect") === "move")
            {
               switch (sourceParentField .getType ())
               {
                  case X3D .X3DConstants .SFNode:
                  {
                     Editor .setFieldValue (sourceExecutionContext, sourceParentNode, sourceParentField, null);
                     break;
                  }
                  case X3D .X3DConstants .MFNode:
                  {
                     if (sourceParentField === destinationParentField && destinationIndex >= sourceIndex)
                        -- destinationIndex;

                     Editor .removeValueFromArray (sourceExecutionContext, sourceParentNode, sourceParentField, sourceIndex);
                     break;
                  }
               }
            }

            // Copy source node if needed.

            if (destinationElement .data ("dropEffect") === "copy" || sourceExecutionContext !== destinationExecutionContext)
            {
               sourceNode = copiedNodes .shift ();
            }

            // Adjust matrix.

            if (destinationElement .data ("dropEffect") ?.match (/copy|move/))
            {
               if (sourceNode .getType () .includes (X3D .X3DConstants .X3DTransformNode))
               {
                  const
                     sourceModelMatrix      = this .getModelMatrix (sourceElement),
                     destinationModelMatrix = this .getModelMatrix (destinationParentNodeElement);

                  destinationModelMatrix .inverse () .multLeft (sourceModelMatrix);
                  Editor .setMatrixWithCenter (sourceNode, destinationModelMatrix);
               }
            }

            // Insert source node.

            switch (destinationParentField .getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  Editor .setFieldValue (destinationExecutionContext, destinationParentNode, destinationParentField, sourceNode);
                  break;
               }
               case X3D .X3DConstants .MFNode:
               {
                  Editor .insertValueIntoArray (destinationExecutionContext, destinationParentNode, destinationParentField, isNaN (destinationIndex) ? destinationParentField .length : destinationIndex, sourceNode);
                  break;
               }
            }

            // End.

            ++ destinationIndex;
         }

         // End undo.

         UndoManager .shared .endUndo ();
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
            sourceExecutionContext        = this .getNode (sourceExecutionContextElement);

         const
            destinationElement = $(event .target) .closest (".field", this .sceneGraph),
            destinationField   = this .getField (destinationElement);

         let destinationIndex = sourceFields .indexOf (destinationField)

         if (destinationElement .data ("drag-type") ==="drag-after")
            ++ destinationIndex;

         if (sourceIndex === destinationIndex || sourceIndex + 1 === destinationIndex)
            return;

         sourceFields .splice (sourceIndex, 1);
         sourceFields .splice (sourceIndex < destinationIndex ? destinationIndex - 1 : destinationIndex, 0, sourceField);

         UndoManager .shared .beginUndo (_("Move Field »%s«"), sourceField .getName ());
         Editor .setUserDefinedFields (sourceExecutionContext, sourceNode, sourceFields);
         UndoManager .shared .endUndo ();
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
            case "copy": return _("Copy %s Nodes");
            case "link": return _("Link %s Nodes");
            case "move": return _("Move %s Nodes");
         }
      }
      else
      {
         if (node .getDisplayName ())
         {
            switch (dropEffect)
            {
               case "copy": return _("Copy Node %s »%s«");
               case "link": return _("Link Node %s »%s«");
               case "move": return _("Move Node %s »%s«");
            }
         }
         else
         {
            switch (dropEffect)
            {
               case "copy": return _("Copy Node %s");
               case "link": return _("Link Node %s");
               case "move": return _("Move Node %s");
            }
         }
      }
   }

   getModelMatrix (nodeElement, self = true)
   {
      if (!nodeElement .length)
         return new X3D .Matrix4 ();

      const
         node        = this .getNode (nodeElement),
         modelMatrix = this .getModelMatrix (nodeElement .parent () .closest (".node", this .sceneGraph));

      if (self)
      {
         if (node .getType () .some (Set .prototype .has, this .matrixNodes))
            modelMatrix .multLeft (node .getMatrix ());
      }

      return modelMatrix;
   }
}
