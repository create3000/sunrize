"use strict"

const
   path        = require ("path"),
   url         = require ("url"),
   fs          = require ("fs"),
   zlib        = require ("zlib"),
   X3D         = require ("../X3D"),
   Traverse    = require ("../Application/Traverse"),
   UndoManager = require ("./UndoManager"),
   _           = require ("../Application/GetText")

module .exports = class Editor
{
   /**
    * X3D Id
    */
   static Id = /(?:^[^\x30-\x39\x00-\x20\x22\x23\x27\x2b\x2c\x2d\x2e\x5b\x5c\x5d\x7b\x7d\x7f]{1}[^\x00-\x20\x22\x23\x27\x2c\x2e\x5b\x5c\x5d\x7b\x7d\x7f]*$|^$)/

   /**
    *
    * @param {X3DExecutionContext} executionContext source execution context
    * @param {Array<X3DNode|X3DExternProtoDeclaration|X3DProtoDeclaration>} objects objects to export
    * @returns {string} x3dSyntax
    */
   static exportVRML (executionContext, objects = [ ])
   {
      const
         externprotos = new Set (objects .filter (o => o instanceof X3D .X3DExternProtoDeclaration)),
         protos       = new Set (objects .filter (o => o instanceof X3D .X3DProtoDeclaration)),
         nodes        = new X3D .MFNode (... objects .filter (o => o .getType () .includes (X3D .X3DConstants .X3DNode)))

      const
         browser = executionContext .getBrowser (),
         scene   = browser .createScene ()

      // Determine protos.

      const protoNodes = new Set ()

      Traverse .traverse (objects, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES | Traverse .PROTOTYPE_INSTANCES, (node) =>
      {
         if (node instanceof X3D .X3DProtoDeclarationNode)
            protoNodes .add (node)
         else if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            protoNodes .add (node .getProtoNode ())
      })

      for (const protoNode of protoNodes)
      {
         if (protoNode .getExecutionContext () !== executionContext)
            protoNodes .delete (protoNode)
      }

      for (const protoNode of protoNodes)
      {
         if (protoNode .isExternProto)
            externprotos .add (protoNode)
         else
            protos .add (protoNode)
      }

      // Determine components and routes.

      const
         components  = new Set (),
         children    = new Set (),
         childRoutes = new Set ()

      Traverse .traverse (nodes, 0, node =>
      {
         components .add (node .getComponentName ())
         children .add (node)

         for (const field of node .getFields ())
         {
            for (const route of field .getInputRoutes ())
               childRoutes .add (route)

            for (const route of field .getOutputRoutes ())
               childRoutes .add (route)
         }
      })

      const routes = [... childRoutes] .filter (route => children .has (route .getSourceNode ()) && children .has (route .getDestinationNode ()))

      // Store world url.

      scene .setMetaData ("base", executionContext .worldURL)

      // Add protos.

      for (const externproto of externprotos)
         scene .externprotos .add (externproto .getName (), externproto)

      for (const proto of protos)
         scene .protos .add (proto .getName (), proto)

      // Add components.

      for (const name of components)
         scene .addComponent (browser .getComponent (name))

      // Set nodes.

      scene .rootNodes = nodes

      for (const route of routes)
         scene .routes .add (X3D .X3DRoute .getId (route .getSourceField (), route .getDestinationField ()), route)

      // Return VRML string.

      const x3dSyntax = scene .toVRMLString ()

      scene .dispose ()
      nodes .dispose ()

      return x3dSyntax
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} x3dSyntax
    * @param {UndoManager} undoManager
    * @returns {Promise<Array<X3DNode>>}
    */
   static async importX3D (executionContext, x3dSyntax, undoManager = UndoManager .shared)
   {
      // Parse string.

      const
         scene        = executionContext instanceof X3D .X3DScene ? executionContext : executionContext .getScene (),
         externprotos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p])),
         protos       = new Map (Array .from (executionContext .protos,       p => [p .getName (), p])),
         rootNodes    = executionContext .rootNodes .copy ()

      try
      {
         const
            GoldenGate = X3D .require ("x_ite/Parser/GoldenGate"),
            parser     = new GoldenGate (scene)

         parser .pushExecutionContext (executionContext)
         await new Promise ((resolve, reject) => parser .parseIntoScene (x3dSyntax, resolve, reject))
      }
      catch (error)
      {
         console .error (error)
         return [ ]
      }

      undoManager .beginUndo (_ ("Import X3D"))

      // Undo.

      undoManager .registerUndo (() =>
      {
         // Restore ExternProtos.
         this .setExternProtoDeclarations (executionContext, externprotos, undoManager)

         // Restore Protos.
         this .setProtoDeclarations (executionContext, protos, undoManager)

         // Restore Root Nodes.
         this .setFieldValue (executionContext, executionContext, executionContext .rootNodes, rootNodes, undoManager)
      })

      // Remove protos that already exists in context.

      const
         nodes               = [... executionContext .rootNodes] .slice (rootNodes .length) .map (n => n .getValue ()),
         newProtos           = [... executionContext .protos] .slice (protos .length),
         updatedExternProtos = new Map (),
         updatedProtos       = new Map (),
         removedProtoNodes   = new Set ()

      Traverse .traverse ([...newProtos, ...nodes], Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
      {
         if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            return

         if (node .getProtoNode () .getExecutionContext () !== executionContext)
            return

         const proto = protos .get (node .getTypeName ())

         if (proto)
         {
            updatedProtos .set (node .getTypeName (), proto)
            this .setProtoNode (executionContext, node, proto, undoManager)
            return
         }

         const externproto = externprotos .get (node .getTypeName ())

         if (externproto)
         {
            updatedExternProtos .set (node .getTypeName (), externproto)
            this .setProtoNode (executionContext, node, externproto, undoManager)
            return
         }

         const available = this .getNextAvailableProtoNode (executionContext, node .getTypeName ())

         if (available)
         {
            removedProtoNodes .add (node .getProtoNode ())
            this .setProtoNode (executionContext, node, available, undoManager)
            return
         }
      })

      for (const [name, externproto] of updatedExternProtos)
         this .updateExternProtoDeclaration (executionContext, name, externproto, undoManager)

      for (const [name, proto] of updatedProtos)
         this .updateProtoDeclaration (executionContext, name, proto, undoManager)

      for (const protoNode of removedProtoNodes)
      {
         if (protoNode .isExternProto)
            this .removeExternProtoDeclaration (executionContext, protoNode .getName (), undoManager)
         else
            this .removeProtoDeclaration (executionContext, protoNode .getName (), undoManager)
      }

      const oldWorldURL = scene .getMetaData ("base")

      if (oldWorldURL)
         this .rewriteURLs (executionContext, [...newProtos, ...nodes], oldWorldURL [0], executionContext .worldURL, undoManager)

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()

      return nodes
   }

   /**
    *
    * @param {X3DScene} scene a scene
    * @param {string=} type default is ".x3d"
    * @returns {string}
    */
   static getContents (scene, type)
   {
      switch (type)
      {
         case ".x3d":
         default:
            return scene .toXMLString ()
         case ".x3dz":
            return zlib .gzipSync (scene .toXMLString ({ style: "CLEAN" }))
         case ".x3dv":
            return scene .toVRMLString ()
         case ".x3dvz":
            return zlib .gzipSync (scene .toVRMLString ({ style: "CLEAN" }))
         case ".x3dj":
            return scene .toJSONString ()
         case ".x3djz":
            return zlib .gzipSync (scene .toJSONString ({ style: "CLEAN" }))
         case ".html":
            return this .getHTML (scene)
      }
   }

   /**
    *
    * @param {X3DScene} scene a scene
    * @returns {string}
    */
   static getHTML (scene)
   {
      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script src="https://create3000.github.io/code/x_ite/latest/x_ite.min.js"></script>
    <style>
body {
  background-color: rgb(21, 22, 24);
  color: rgb(108, 110, 113);
}

a {
  color: rgb(106, 140, 191);
}

x3d-canvas {
  width: 768px;
  height: 432px;
}
    </style>
  </head>
  <body>
    <h1>${path .basename (url .fileURLToPath (scene .worldURL))}</h1>
    <x3d-canvas>
${scene .toXMLString ({ html: true, indent: " " .repeat (6) })}
    </x3d-canvas>
    <p>Made with <a href="https://create3000.github.io/sunrize/" target="_blank">Sunrize X3D Editor.</a></p>
  </body>
</html>`
   }

   static absoluteURL = new RegExp ("^(?:[a-z]+:|//)", "i")
   static fontFamilies = new Set (["SERIF", "SANS", "TYPEWRITER"])

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DExecutionContext|Array<X3DNode|X3DProtoDeclaration>} objects
    * @param {string} oldWorldURL
    * @param {string} newWorldURL
    * @param {UndoManager} undoManager
    */
   static rewriteURLs (executionContext, objects, oldWorldURL, newWorldURL, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Rewrite URLs"))

      Traverse .traverse (objects, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
      {
         const
            urlObject     = node .getType () .includes (X3D .X3DConstants .X3DUrlObject),
            fontStyleNode = node .getType () .includes (X3D .X3DConstants .X3DFontStyleNode)

         if (!(urlObject || fontStyleNode))
            return

         const newUrl = new X3D .MFString ()

         for (const URL of node ._url)
         {
            if (this .absoluteURL .test (URL) || (fontStyleNode && this .fontFamilies .has (URL)))
            {
               newUrl .push (URL)
            }
            else
            {
               const
                  filePath     = path .resolve (path .dirname (url .fileURLToPath (oldWorldURL)), URL),
                  relativePath = path .relative (path .dirname (url .fileURLToPath (newWorldURL)), filePath)

               newUrl .push (relativePath)
            }
         }

         this .setFieldValue (executionContext, node, node ._url, newUrl, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} parentContext
    * @param {X3DExecutionContext} childContext
    * @returns {boolean}
    */
   static isParentContext (parentContext, childContext)
   {
      if (parentContext === childContext)
         return false

      let executionContext = childContext

      while (!(executionContext instanceof X3D .X3DScene))
      {
         if (executionContext === parentContext)
            return true

         executionContext = executionContext .getExecutionContext ()
      }

      return executionContext === parentContext
   }

   static nodesToRemove = new Map ()

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DNode|SFNode>|MFNode} nodes
    * @param {UndoManager} undoManager
    */
   static removeNodesFromExecutionContextIfNecessary (executionContext, nodes, undoManager = UndoManager .shared)
   {
      if (!nodes .length)
         return

      if (!this .nodesToRemove .has (executionContext))
         this .nodesToRemove .set (executionContext, [ ])

      const nodesToRemove = this .nodesToRemove .get (executionContext)

      for (const node of nodes)
         nodesToRemove .push (node)

      if (undoManager .defer ("removeNodesFromExecutionContextIfNecessary"))
         return

      undoManager .defer ("removeNodesFromExecutionContextIfNecessary", () =>
      {
         for (const [executionContext, nodesToRemove] of this .nodesToRemove)
         {
            // Add nodes and child nodes.

            const children = new Set ()

            Traverse .traverse (nodesToRemove, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY, node => { children .add (node) })

            // Remove nodes still in scene graph.

            Traverse .traverse (executionContext, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY, node => { children .delete (node) })

            if (children .size === 0)
               continue

            undoManager .beginUndo (_ ("Remove %s Nodes from Execution Context"), children .size)

            for (const node of children)
            {
               // Remove named nodes.

               if (node .getName ())
                  this .removeNamedNode (executionContext, node, undoManager)

               // Remove imported nodes if node is an Inline node.

               for (const importedNode of executionContext .getImportedNodes ())
               {
                  if (importedNode .getInlineNode () === node)
                     this .removeImportedNode (executionContext, importedNode .getImportedName (), undoManager)
               }

               // Remove exported nodes.

               if (executionContext instanceof X3D .X3DScene)
               {
                  for (const exportedNode of executionContext .getExportedNodes ())
                  {
                     if (exportedNode .getLocalNode () === node)
                        this .removeExportedNode (executionContext, exportedNode .getExportedName (), undoManager)
                  }
               }

               // Remove routes.

               for (const field of node .getFields ())
               {
                  for (const route of field .getInputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                  }

                  for (const route of field .getOutputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                  }
               }

               if (node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
               {
                  if (node ._isBound .getValue ())
                  {
                     // Rebind X3DBindableNode nodes.
                     undoManager .registerUndo (() =>
                     {
                        this .setFieldValue (executionContext, node, node ._set_bind, true, undoManager)
                     })
                  }
               }

               // Clear fields, to get right clone count.

               for (const field of node .getFields ())
               {
                  switch (field .getType ())
                  {
                     case X3D .X3DConstants .SFNode:
                     {
                        this .setFieldValue (executionContext, node, field, null, undoManager)
                        break
                     }
                     case X3D .X3DConstants .MFNode:
                     {
                        this .setFieldValue (executionContext, node, field, new X3D .MFNode (), undoManager)
                        break
                     }
                  }
               }

               this .#setLive (node, false)
            }

            this .requestUpdateInstances (executionContext, undoManager)

            undoManager .endUndo ()
         }

         this .nodesToRemove .clear ()
      })
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {boolean} value
    */
   static #setLive (node, value, undoManager = UndoManager .shared)
   {
      const oldValue = node .isLive ()

      undoManager .beginUndo (_ ("Set live state to »%s«"), value)

      node .setLive (value)

      undoManager .registerUndo (() =>
      {
         this .#setLive (node, oldValue, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {UndoManager} undoManager
    */
   static inferProfileAndComponents (scene, undoManager = UndoManager .shared)
   {
      const
         browser              = scene .getBrowser (),
         usedComponents       = this .getUsedComponents (scene),
         profileAndComponents = this .getProfileAndComponentsFromUsedComponents (browser, usedComponents)

      undoManager .beginUndo (_ ("Infer Profile and Components from Source"))

      this .setProfile    (scene, profileAndComponents .profile,    undoManager)
      this .setComponents (scene, profileAndComponents .components, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @returns {Array<ComponentInfo>}
    */
   static getUsedComponents (scene)
   {
      const components = new Set ()

      Traverse .traverse (scene, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES | Traverse .PROTOTYPE_INSTANCES, (node) =>
      {
         if (!node .getType () .includes (X3D .X3DConstants .X3DNode))
            return

         if (node .getScene () !== scene)
            return

         components .add (node .getComponentName ())
      })

      return components
   }

   static getProfileAndComponentsFromUsedComponents (browser, usedComponents)
   {
      const profiles = ["Interactive", "Interchange", "Immersive"] .map (name =>
      {
         return { profile: browser .getProfile (name), components: new Set (usedComponents) }
      })

      profiles .forEach (object =>
      {
         for (const component of object .profile .components)
            object .components .delete (component .name)
      })

      const min = profiles .reduce ((min, object) =>
      {
         const count = object .profile .components .length + object .components .size

         return min .count < count ? min : {
            count: count,
            object: object,
         }
      },
      { count: Number .POSITIVE_INFINITY })

      return {
         profile: min .object .profile,
         components: Array .from (min .object .components) .sort () .map (name => browser .getSupportedComponents () .get (name)),
      }
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {ProfileInfo} profile
    * @param {UndoManager} undoManager
    */
   static setProfile (scene, profile, undoManager = UndoManager .shared)
   {
      const oldProfile = scene .getProfile ()

      if ((profile && oldProfile && profile .name === oldProfile .name) || (profile === oldProfile))
         return

      const browser = scene .getBrowser ()

      undoManager .beginUndo (_ ("Set Profile to »%s«"), profile ? profile .title : "Full")

      browser .loadComponents (profile)
      scene .setProfile (profile)

      undoManager .registerUndo (() =>
      {
         this .setProfile (scene, oldProfile, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {Array<ComponentInfo>} components
    * @param {UndoManager} undoManager
    */
   static setComponents (scene, components, undoManager = UndoManager .shared)
   {
      const
         browser       = scene .getBrowser (),
         oldComponents = Array .from (scene .getComponents ())

      undoManager .beginUndo (_ ("Set Components of Scene"))

      browser .loadComponents (... components .map (component => component .name))

      for (const { name } of oldComponents)
         scene .removeComponent (name)

      for (const component of components)
         scene .addComponent (component)

      undoManager .registerUndo (() =>
      {
         this .setComponents (scene, oldComponents, undoManager)
      })

      undoManager .endUndo ()
   }

   static addComponent (scene, name, undoManager = UndoManager .shared)
   {
      if (scene .hasComponent (name))
         return

      const browser = scene .getBrowser ()

      undoManager .beginUndo (_ ("Add Component %s"), name)

      browser .loadComponents (name)
      scene .addComponent (browser .getComponent (name))

      undoManager .registerUndo (() =>
      {
         this .removeComponent (scene, name, undoManager)
      })

      undoManager .endUndo ()
   }

   static removeComponent (scene, name, undoManager = UndoManager .shared)
   {
      if (!scene .hasComponent (name))
         return

      undoManager .beginUndo (_ ("Remove Component %s"), name)

      scene .removeComponent (name)

      undoManager .registerUndo (() =>
      {
         this .addComponent (scene, name, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {string} category
    * @param {string} name
    * @param {number} conversionFactor
    * @param {UndoManager} undoManager
    */
   static updateUnit (scene, category, name, conversionFactor, undoManager = UndoManager .shared)
   {
      const
         unit                = scene .getUnit (category),
         oldName             = unit .name,
         oldConversionFactor = unit .conversionFactor

      undoManager .beginUndo (_ ("Update Unit Category »%s«"), category)

      scene .updateUnit (category, name, conversionFactor)

      undoManager .registerUndo (() =>
      {
         this .updateUnit (scene, category, oldName, oldConversionFactor, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {Array<[string,string]>} entries
    * @param {UndoManager} undoManager
    */
   static setMetaData (scene, entries, undoManager = UndoManager .shared)
   {
      const oldEntries = [ ]

      for (const [key, values] of scene .getMetaDatas ())
      {
         for (const value of values)
            oldEntries .push (key, value)
      }

      undoManager .beginUndo (_ ("Change Meta Data"))

      for (const key of [... scene .getMetaDatas () .keys ()])
         scene .removeMetaData (key)

      for (const [key, value] of entries)
         scene .addMetaData (key, value)

      undoManager .registerUndo (() =>
      {
         this .setMetaData (scene, oldEntries, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {X3DNode} node
    * @param {UndoManager} undoManager
    */
   static updateNamedNode (executionContext, name, node, undoManager = UndoManager .shared)
   {
      const oldName = node .getName ()

      undoManager .beginUndo (_ ("Rename Node to »%s«"), name)

      executionContext .updateNamedNode (name, node .valueOf ())

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateNamedNode (executionContext, oldName, node, undoManager)
         else
            this .removeNamedNode (executionContext, node, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {UndoManager} undoManager
    */
   static removeNamedNode (executionContext, node, undoManager = UndoManager .shared)
   {
      const oldName = node .getName ()

      undoManager .beginUndo (_ ("Remove Node Name »%s«"), oldName)

      executionContext .removeNamedNode (oldName)

      undoManager .registerUndo (() =>
      {
         this .updateNamedNode (executionContext, oldName, node, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} inlineNode
    * @param {string} exportedName
    * @param {string} importedName
    * @param {UndoManager} undoManager
    */
   static updateImportedNode (executionContext, inlineNode, exportedName, importedName, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Update Imported Node »%s«"), importedName)

      executionContext .updateImportedNode (inlineNode .valueOf (), exportedName, importedName)

      undoManager .registerUndo (() =>
      {
         this .removeImportedNode (executionContext, importedName, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} importedName
    * @param {UndoManager} undoManager
    */
   static removeImportedNode (executionContext, importedName, undoManager = UndoManager .shared)
   {
      const
         importedNode = executionContext .getImportedNodes () .get (importedName),
         inlineNode   = importedNode .getInlineNode (),
         exportedName = importedNode .getExportedName ()

      undoManager .beginUndo (_ ("Remove Imported Node »%s«"), importedName)

      executionContext .removeImportedNode (importedName)

      undoManager .registerUndo (() =>
      {
         this .updateImportedNode (executionContext, inlineNode, exportedName, importedName, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {string} exportedName
    * @param {X3DNode} node
    * @param {UndoManager} undoManager
    */
   static updateExportedNode (scene, exportedName, node, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Update Exported Node »%s«"), exportedName)

      scene .updateExportedNode (exportedName, node .valueOf ())

      undoManager .registerUndo (() =>
      {
         this .removeExportedNode (scene, exportedName, undoManager)
      })

      this .requestUpdateInstances (scene, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {string} exportedName
    * @param {UndoManager} undoManager
    */
   static removeExportedNode (scene, exportedName, undoManager = UndoManager .shared)
   {
      const
         exportedNode = scene .getExportedNodes () .get (exportedName),
         node         = exportedNode .getLocalNode ()

      undoManager .beginUndo (_ ("Remove Exported Node »%s«"), exportedName)

      scene .removeExportedNode (exportedName)

      undoManager .registerUndo (() =>
      {
         this .updateExportedNode (scene, exportedName, node, undoManager)
      })

      this .requestUpdateInstances (scene, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {UndoManager} undoManager
    * @returns {X3DProtoDeclaration}
    */
   static addProtoDeclaration (executionContext, name, undoManager = UndoManager .shared)
   {
      const
         oldProtos = new Map (Array .from (executionContext .protos, p => [p .getName (), p])),
         proto     = new X3D .X3DProtoDeclaration (executionContext)

      undoManager .beginUndo (_ ("Add Proto Declaration »%s«"), name)

      proto .setup ()
      executionContext .updateProtoDeclaration (name, proto)

      undoManager .registerUndo (() =>
      {
          this .setProtoDeclarations (executionContext, oldProtos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()

      return proto
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {X3DProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static updateProtoDeclaration (executionContext, name, proto, undoManager = UndoManager .shared)
   {
      const oldName = proto .getName ()

      undoManager .beginUndo (_ ("Update Proto Declaration »%s«"), name)

      executionContext .updateProtoDeclaration (name, proto)

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateProtoDeclaration (executionContext, oldName, proto, undoManager)
         else
            this .removeProtoDeclaration (executionContext, name, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {UndoManager} undoManager
    */
   static removeProtoDeclaration (executionContext, name, undoManager = UndoManager .shared)
   {
      const oldProtos = new Map (Array .from (executionContext .protos, p => [p .getName (), p]))

      undoManager .beginUndo (_ ("Remove Proto Declaration »%s«"), name)

      executionContext .removeProtoDeclaration (name)

      undoManager .registerUndo (() =>
      {
         this .setProtoDeclarations (executionContext, oldProtos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DProtoDeclaration} protos
    * @param {UndoManager} undoManager
    */
   static setProtoDeclarations (executionContext, protos, undoManager = UndoManager .shared)
   {
      const oldProtos = new Map (Array .from (executionContext .protos, p => [p .getName (), p]))

      undoManager .beginUndo (_ ("Update Proto Declarations"))

      for (const name of oldProtos .keys ())
         executionContext .removeProtoDeclaration (name)

      if (Array .isArray (protos))
      {
         for (const proto of protos)
            executionContext .updateProtoDeclaration (proto .getName (), proto)
      }
      else
      {
         for (const [name, proto] of protos)
            executionContext .updateProtoDeclaration (name, proto)
      }

      undoManager .registerUndo (() =>
      {
         this .setProtoDeclarations (executionContext, oldProtos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DProtoDeclaration} protos
    * @param {string} filePath
    * @param {UndoManager} undoManager
    * @returns {Promise<void>}
    */
   static async turnIntoExternProto (executionContext, proto, filePath, undoManager = UndoManager .shared)
   {
      const
         browser   = executionContext .getBrowser (),
         scene     = browser .createScene (),
         x3dSyntax = this .exportVRML (executionContext, [proto])

      undoManager .beginUndo (_ ("Turn Prototype »%s« into Extern Prototype"), proto .getName ())

      await this .importX3D (scene, x3dSyntax, new UndoManager ())
      this .rewriteURLs (scene, scene, executionContext .worldURL, url .pathToFileURL (filePath) .href, new UndoManager ())

      fs .writeFileSync (filePath, this .getContents (scene, path .extname (filePath)))

      const
         name         = executionContext .getUniqueExternProtoName (proto .getName ()),
         externproto  = this .addExternProtoDeclaration (executionContext, name, undoManager),
         relativePath = path .relative (path .dirname (url .fileURLToPath (executionContext .worldURL)), filePath),
         absolutePath = url .pathToFileURL (filePath) .href,
         hash         = "#" + proto .getName ()

      externproto ._url = new X3D .MFString (relativePath + hash, absolutePath + hash)

      this .replaceProtoNodes (executionContext, proto, externproto, undoManager)
      this .removeProtoDeclaration (executionContext, proto .getName (), undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DProtoDeclaration} proto
    * @param {X3DProtoDeclaration} parent
    * @returns
    */
   static protoIsUsedInProto (proto, parent)
   {
      return ! Traverse .traverse (parent, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
      {
         if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            return node .getProtoNode () !== proto
      })
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {UndoManager} undoManager
    * @returns {X3DExternProtoDeclaration}
    */
   static addExternProtoDeclaration (executionContext, name, undoManager = UndoManager .shared)
   {
      const
         oldExternprotos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p])),
         externproto     = new X3D .X3DExternProtoDeclaration (executionContext, new X3D .MFString ())

      undoManager .beginUndo (_ ("Add Extern Prototype Declaration »%s«"), name)

      externproto .setup ()
      executionContext .updateExternProtoDeclaration (name, externproto)

      undoManager .registerUndo (() =>
      {
          this .setExternProtoDeclarations (executionContext, oldExternprotos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()

      return externproto
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {X3DExternProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static updateExternProtoDeclaration (executionContext, name, externproto, undoManager = UndoManager .shared)
   {
      const oldName = externproto .getName ()

      undoManager .beginUndo (_ ("Update Extern Prototype Declaration »%s«"), name)

      executionContext .updateExternProtoDeclaration (name, externproto)

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateExternProtoDeclaration (executionContext, oldName, externproto, undoManager)
         else
            this .removeExternProtoDeclaration (executionContext, name, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {UndoManager} undoManager
    */
   static removeExternProtoDeclaration (executionContext, name, undoManager = UndoManager .shared)
   {
      const oldExternProtos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p]))

      undoManager .beginUndo (_ ("Remove Extern Prototype Declaration »%s«"), name)

      executionContext .removeExternProtoDeclaration (name)

      undoManager .registerUndo (() =>
      {
         this .setExternProtoDeclarations (executionContext, oldExternProtos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DExternProtoDeclaration>|Map<string,X3DExternProtoDeclaration>} externprotos
    * @param {UndoManager} undoManager
    */
   static setExternProtoDeclarations (executionContext, externprotos, undoManager = UndoManager .shared)
   {
      const oldExternProtos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p]))

      undoManager .beginUndo (_ ("Update Extern Prototype Declarations"))

      for (const name of oldExternProtos .keys ())
         executionContext .removeExternProtoDeclaration (name)

      if (Array .isArray (externprotos))
      {
         for (const externproto of externprotos)
            executionContext .updateExternProtoDeclaration (externproto .getName (), externproto)
      }
      else
      {
         for (const [name, externproto] of externprotos)
            executionContext .updateExternProtoDeclaration (name, externproto)
      }

      undoManager .registerUndo (() =>
      {
         this .setExternProtoDeclarations (executionContext, oldExternProtos, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DExternProtoDeclaration} externproto
    * @param {UndoManager} undoManager
    * @returns {Promise<void>}
    */
   static async turnIntoPrototype (executionContext, externproto, undoManager = UndoManager .shared)
   {
      const
         browser   = executionContext .getBrowser (),
         numProtos = executionContext .protos .length,
         x3dSyntax = this .exportVRML (externproto .getInternalScene (), [externproto .getProtoDeclaration ()])

      undoManager .beginUndo (_ ("Turn Extern Prototype »%s« into Prototype"), externproto .getName ())

      await this .importX3D (executionContext, x3dSyntax, undoManager)

      const
         protos         = Array .from (executionContext .protos),
         importedProtos = protos .splice (numProtos, protos .length - numProtos),
         proto          = importedProtos .at (-1)

      for (const proto of importedProtos .reverse ())
      {
         protos .unshift (proto)
         this .rewriteURLs (executionContext, proto, externproto .getInternalScene () .worldURL, executionContext .worldURL, new UndoManager ())
      }

      this .setProtoDeclarations (executionContext, protos, undoManager)
      this .replaceProtoNodes (executionContext, externproto, proto, undoManager)
      this .removeExternProtoDeclaration (executionContext, externproto .getName (), undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DProtoDeclarationNode} protoNode
    * @returns
    */
    static isProtoNodeUsed (executionContext, protoNode)
    {
       return ! Traverse .traverse (executionContext, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY, (node) =>
       {
          if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
             return node .getProtoNode () !== protoNode
       })
    }

   /**
    *
    * @param {X3DExecutionContext} executionContext execution context, mostly from proto node argument
    * @param {X3DProtoDeclarationNode} protoNode from which the next proto node with the same name is available.
    * @returns {X3DProtoDeclarationNode|null}
    */
   static getNextAvailableProtoNode (executionContext, protoNode)
   {
      const name = protoNode instanceof X3D .X3DProtoDeclarationNode ? protoNode .getName () : protoNode

      if (protoNode instanceof X3D .X3DProtoDeclaration)
      {
         const externproto = executionContext .externprotos .get (name)

         if (externproto)
            return externproto
      }

      const proto = executionContext .getOuterNode ()

      if (!(proto instanceof X3D .X3DProtoDeclaration))
         return null

      executionContext = proto .getExecutionContext ()

      const index = executionContext .protos .indexOf (proto)

      for (let i = 0; i < index; ++ i)
      {
         const proto = executionContext .protos [i]

         if (proto .getName () === name)
            return proto
      }

      const externproto = executionContext .externprotos .get (name)

      if (externproto)
         return externproto

      return this .getNextAvailableProtoNode (executionContext, name)
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DPrototypeInstance} instance
    * @param {X3DProtoDeclarationNode} protoNode
    * @param {UndoManager} undoManager
    */
   static setProtoNode (executionContext, instance, protoNode, undoManager = UndoManager .shared)
   {
      const oldProtoNode = instance .getProtoNode ()

      undoManager .beginUndo (_ ("Set Proto Node of Instance to %s"), protoNode .getName ())

      const outerNode = executionContext .getOuterNode ()

      // Remove references from instance.

      const references = new Map ()

      if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
      {
         const proto = outerNode

         for (const field of instance .getPredefinedFields ())
         {
            references .set (field .getName (), new Set (field .getReferences ()))

            for (const reference of field .getReferences ())
               this .removeReference (proto, reference, instance, field, undoManager)
         }
      }

      // Remove routes from instance.

      const
         inputRoutes  = new Map (),
         outputRoutes = new Map ()

      for (const field of instance .getPredefinedFields ())
      {
         inputRoutes  .set (field .getName (), new Set (field .getInputRoutes ()))
         outputRoutes .set (field .getName (), new Set (field .getOutputRoutes ()))

         for (const route of field .getInputRoutes ())
         {
            this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
         }

         for (const route of field .getOutputRoutes ())
         {
            this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
         }
      }

      // Set proto node.

      instance .setProtoNode (protoNode)

      // Restore references.

      if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
      {
         const proto = outerNode

         for (const field of instance .getPredefinedFields ())
         {
            const oldReferences = references .get (field .getName ())

            if (oldReferences)
            {
               for (const oldReference of oldReferences)
               {
                  const reference = proto .getUserDefinedFields () .get (oldReference .getName ())

                  if (!reference)
                     continue

                  if (reference .getType () !== field .getType ())
                     continue

                  if (!reference .isReference (field .getAccessType ()))
                     continue

                  this .addReference (proto, reference, instance, field, undoManager)
               }
            }
         }
      }

      // Restore routes.

      for (const field of instance .getPredefinedFields ())
      {
         const
            oldInputRoutes = inputRoutes   .get (field .getName ()),
            oldOutputRoutes = outputRoutes .get (field .getName ())

         if (oldInputRoutes)
         {
            for (const route of oldInputRoutes)
            {
               this .addRoute (executionContext, route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
            }
         }

         if (oldOutputRoutes)
         {
            for (const route of oldOutputRoutes)
            {
               this .addRoute (executionContext, route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
            }
         }
      }

      undoManager .registerUndo (() =>
      {
         this .setProtoNode (executionContext, instance, oldProtoNode, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    * Replaces in X3DPrototypeInstance nodes protoNode by other proto node.
    * @param {X3DExecutionContext} executionContext
    * @param {X3DProtoDeclarationNode} protoNode
    * @param {X3DProtoDeclarationNode} by
    */
   static replaceProtoNodes (executionContext, protoNode, by, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Replace Proto Node %s"), protoNode .getName ())

      Traverse .traverse (executionContext, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY, (node) =>
      {
         if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
         {
            if (node .getProtoNode () === protoNode)
               this .setProtoNode (node .getExecutionContext (), node, by, undoManager)
         }
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DNode|X3DExecutionContext|X3DProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static requestUpdateInstances (proto, undoManager = UndoManager .shared)
   {
      if (proto .getType () .includes (X3D .X3DConstants .X3DNode))
         proto = proto .getExecutionContext ()

      if (proto .getType () .includes (X3D .X3DConstants .X3DExecutionContext))
         proto = proto .getOuterNode ()

      if (!proto)
         return

      if (!proto .getType () .includes (X3D .X3DConstants .X3DProtoDeclaration))
         return

      proto .requestUpdateInstances ()

      undoManager .registerUndo (() =>
      {
        this .requestUpdateInstances (proto, undoManager)
      })
   }

   /**
    *
    * @param {X3DNode|X3DExecutionContext|X3DProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static updateInstances (proto, undoManager = UndoManager .shared)
   {
      if (proto .getType () .includes (X3D .X3DConstants .X3DNode))
         proto = proto .getExecutionContext ()

      if (proto .getType () .includes (X3D .X3DConstants .X3DExecutionContext))
         proto = proto .getOuterNode ()

      if (!proto)
         return

      if (!proto .getType () .includes (X3D .X3DConstants .X3DProtoDeclaration))
         return

      proto .updateInstances ()

      undoManager .registerUndo (() =>
      {
         this .updateInstances (proto, undoManager)
      })
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} sourceNode
    * @param {string} sourceField
    * @param {X3DNode} destinationNode
    * @param {string} destinationField
    * @param {UndoManager} undoManager
    */
   static addRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Add Route From %s »%s« TO %s »%s«"), sourceNode .getTypeName (), sourceField, destinationNode .getTypeName (), destinationField)

      try
      {
         executionContext .addRoute (sourceNode .valueOf (), sourceField, destinationNode .valueOf (), destinationField)
      }
      catch (error)
      {
         console .error (error)
      }

      undoManager .registerUndo (() =>
      {
         this .deleteRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {SFNode} sourceNode
    * @param {string} sourceField
    * @param {SFNode} destinationNode
    * @param {string} destinationField
    * @param {UndoManager} undoManager
    */
   static deleteRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Delete Route From %s »%s« TO %s »%s«"), sourceNode .getTypeName (), sourceField, destinationNode .getTypeName (), destinationField)

      executionContext .deleteRoute (sourceNode .valueOf (), sourceField, destinationNode .valueOf (), destinationField)

      undoManager .registerUndo (() =>
      {
         this .addRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager)
      })

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {WorldInfo} worldInfo
    * @param {UndoManger} undoManager
    */
   static #addWorldInfo (executionContext, worldInfo, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Add World Info"))

      executionContext .addWorldInfo (worldInfo)

      undoManager .registerUndo (() =>
      {
         this .#removeWorldInfo (executionContext, worldInfo, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {WorldInfo} worldInfo
    * @param {UndoManger} undoManager
    */
    static #removeWorldInfo (executionContext, worldInfo, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Remove World Info"))

      executionContext .removeWorldInfo (worldInfo)

      undoManager .registerUndo (() =>
      {
         this .#addWorldInfo (executionContext, worldInfo, undoManager)
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {WorldInfo} worldInfo
    * @param {UndoManager} undoManager
    */
   static removeWorldInfo (executionContext, worldInfo, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Remove World Info"))

      this .removeNode (executionContext, worldInfo, undoManager)
      this .#removeWorldInfo (executionContext, worldInfo, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} remove
    * @param {UndoManager} undoManager
    */
   static removeNode (executionContext, remove, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Remove Node"))

      Traverse .traverse (executionContext, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
      {
         if (node instanceof X3D .X3DExecutionContext)
         {
            for (let i = node .rootNodes .length - 1; i >= 0; -- i)
            {
               if (node .rootNodes [i] ?.getValue () === remove)
                  this .removeValueFromArray (node, node, node .rootNodes, i, undoManager)
            }
         }
         else
         {
            for (const field of node .getFields ())
            {
               switch (field .getType ())
               {
                  case X3D .X3DConstants .SFNode:
                  {
                     if (field .getValue () === remove)
                        this .setFieldValue (node .getExecutionContext (), node, field, null, undoManager)

                     break
                  }
                  case X3D .X3DConstants .MFNode:
                  {
                     for (let i = field .length - 1; i >= 0; -- i)
                     {
                        if (field [i] ?.getValue () === remove)
                           this .removeValueFromArray (node .getExecutionContext (), node, field, i, undoManager)
                     }

                     break
                  }
               }
            }
         }
      })

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static addUserDefinedField (executionContext, node, field, undoManager = UndoManager .shared)
   {
      const fields = Array .from (node .getUserDefinedFields ())

      undoManager .beginUndo (_ ("Add Field »%s«"), field .getName ())

      fields .push (field)

      this .setUserDefinedFields (executionContext, node, fields, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static updateUserDefinedField (executionContext, node, field, accessType, name, undoManager = UndoManager .shared)
   {
      const
         oldAccessType = field .getAccessType (),
         oldName       = field .getName (),
         fields        = Array .from (node .getUserDefinedFields ())

      undoManager .beginUndo (_ ("Update Fields of Node %s"), node .getTypeName ())

      for (const field of fields)
         node .removeUserDefinedField (field .getName ())

      field .setAccessType (accessType)
      field .setName (name)

      for (const field of fields)
         node .addUserDefinedField (field .getAccessType (), field .getName (), field)

      if (accessType !== oldAccessType)
      {
         if (node instanceof X3D .X3DProtoDeclaration)
         {
            const
               proto        = node,
               updatedField = field

            Traverse .traverse (proto, Traverse .PROTO_DECLARATION | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
            {
               for (const field of node .getFields ())
               {
                  // Remove references.

                  if (field .getReferences () .has (updatedField))
                  {
                     if (!updatedField .isReference (field .getAccessType ()))
                        this .removeReference (proto, updatedField, node, field, undoManager)
                  }
               }
            })

            // Remove routes.

            Traverse .traverse (executionContext, Traverse .PROTO_DECLARATION | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
            {
               if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance) && node .getProtoNode () === proto)
               {
                  const field = node .getField (oldName)

                  if (! updatedField .isInput ())
                  {
                     for (const route of field .getInputRoutes ())
                     {
                        this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                     }
                  }

                  if (! updatedField .isOutput ())
                  {
                     for (const route of field .getOutputRoutes ())
                     {
                        this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                     }
                  }
               }
            })

            this .updateInstances (proto, undoManager)
         }
         else
         {
            // Remove References.

            for (const reference of field .getReferences ())
            {
               if (!reference .isReference (field .getAccessType ()))
                  this .removeReference (proto, reference, node, field, undoManager)
            }

            // Remove routes.

            if (!field .isInput ())
            {
               for (const route of field .getInputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
               }
            }

            if (!field .isOutput ())
            {
               for (const route of field .getOutputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
               }
            }
         }
      }

      undoManager .registerUndo (() =>
      {
         this .updateUserDefinedField (executionContext, node, field, oldAccessType, oldName, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static removeUserDefinedField (executionContext, node, field, undoManager = UndoManager .shared)
   {
      const fields = [... node .getUserDefinedFields ()] .filter (f => f !== field)

      undoManager .beginUndo (_ ("Remove Field »%s«"), field .getName ())

      this .setUserDefinedFields (executionContext, node, fields, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {Array<X3DField>} fields
    * @param {UndoManager} undoManager
    */
   static setUserDefinedFields (executionContext, node, fields, undoManager = UndoManager .shared)
   {
      const
         oldFields     = Array .from (node .getUserDefinedFields ()),
         removedFields = oldFields .filter (f => !fields .includes (f))

      undoManager .beginUndo (_ ("Update Fields of Node %s"), node .getTypeName ())

      if (removedFields .length)
      {
         if (node instanceof X3D .X3DProtoDeclaration)
         {
            const proto = node

            // Remove references.

            Traverse .traverse (proto, Traverse .PROTO_DECLARATION | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
            {
               for (const field of node .getFields ())
               {
                  for (const removedField of removedFields)
                  {
                     if (field .getReferences () .has (removedField))
                        this .removeReference (proto, removedField, node, field, undoManager)
                  }

                  for (const reference of field .getReferences ())
                  {
                     if (! reference .isReference (field .getAccessType ()))
                        this .removeReference (proto, reference, node, field, undoManager)
                  }
               }
            })

            // Remove routes, and undo set value.

            Traverse .traverse (executionContext, Traverse .PROTO_DECLARATION | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES, (node) =>
            {
               if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance) && node .getProtoNode () === proto)
               {
                  for (const removedField of removedFields)
                  {
                     const field = node .getField (removedField .getName ())

                     if (field .isInitializable ())
                     {
                        const
                           name     = field .getName (),
                           oldValue = field .copy ()

                        undoManager .registerUndo (() =>
                        {
                           this .setFieldValue (node .getExecutionContext (), node, name, oldValue, undoManager)
                        })
                     }

                     for (const route of field .getInputRoutes ())
                     {
                        this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                     }

                     for (const route of field .getOutputRoutes ())
                     {
                        this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
                     }
                  }
               }
            })

            this .updateInstances (proto, undoManager)
         }
         else
         {
            // Remove references.

            const outerNode = executionContext .getOuterNode ()

            if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
            {
               const proto = outerNode

               for (const removedField of removedFields)
               {
                  for (const reference of removedField .getReferences ())
                     this .removeReference (proto, reference, node, removedField, undoManager)
               }
            }

            // Remove routes.

            for (const removedField of removedFields)
            {
               for (const route of removedField .getInputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
               }

               for (const route of removedField .getOutputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager)
               }
            }
         }
      }

      // Set new fields, to make delete route work.

      for (const field of oldFields)
         node .removeUserDefinedField (field .getName ())

      for (const field of fields)
         node .addUserDefinedField (field .getAccessType (), field .getName (), field)

      //

      undoManager .registerUndo (() =>
      {
         this .setUserDefinedFields (executionContext, node, oldFields, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DProtoDeclaration} proto
    * @param {X3DField} protoField
    * @param {X3DField} field
    * @param {UndoManger} undoManager
    */
   static addReference (proto, protoField, node, field, undoManager = UndoManager .shared)
   {
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName ()

      undoManager .beginUndo (_ ("Add Reference from »%s« to »%s«"), protoField .getName (), field .getName ())

      field .addReference (protoField)

      undoManager .registerUndo (() =>
      {
         this .removeReference (proto, protoField, node, instance ? name : field, undoManager)
      })

      this .requestUpdateInstances (proto, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DProtoDeclaration} proto
    * @param {X3DField} protoField
    * @param {X3DField} field
    * @param {UndoManger} undoManager
    */
   static removeReference (proto, protoField, node, field, undoManager = UndoManager .shared)
   {
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName ()

      undoManager .beginUndo (_ ("Remove Reference from »%s« to »%s«"), protoField .getName (), field .getName ())

      field .removeReference (protoField)

      undoManager .registerUndo (() =>
      {
         this .addReference (proto, protoField, node, instance ? name : field, undoManager)
      })

      this .requestUpdateInstances (proto, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DNode} node
    * @param {Matrix4} matrix
    * @param {Vector3} center
    * @param {UndoManager} undoManager
    */
   static setMatrixWithCenter (node, matrix, center = undefined, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Set Transformation Matrix of %s"), node .getTypeName ())

      const
         oldMatrix = node .getMatrix () .copy (),
         oldCenter = node ._center .getValue () .copy ()

      const
         Vector3   = X3D .require ("standard/Math/Numbers/Vector3"),
         Rotation4 = X3D .require ("standard/Math/Numbers/Rotation4")

      const
         translation      = new Vector3 (0, 0, 0),
         rotation         = new Rotation4 (0, 0, 1, 0),
         scale            = new Vector3 (1, 1, 1),
         scaleOrientation = new Rotation4 (0, 0, 1, 0)

      matrix .get (translation,
                   rotation,
                   scale,
                   scaleOrientation,
                   center ?? node ._center .getValue ())

      node ._translation      = translation
      node ._rotation         = rotation
      node ._scale            = scale
      node ._scaleOrientation = scaleOrientation
      node ._center           = center ?? node ._center .getValue ()

      undoManager .registerUndo (() =>
      {
         this .setMatrixWithCenter (node, oldMatrix, oldCenter, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField} field
    * @param {string} string
    * @param {UndoManager} undoManager
    */
   static setFieldFromString (executionContext, node, field, string, undoManager = UndoManager .shared)
   {
		const
         instance  = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name      = field .getName (),
         auxillary = field .create ()

      auxillary .setUnit (field .getUnit ())
      auxillary .fromString (string, executionContext)

		if (auxillary .equals (field))
      {
         field .addEvent ()
         return
      }

      const oldValue = field .copy ()

      undoManager .beginUndo (_ ("Change Field %s »%s«"), node .getTypeName (), field .getName ())

      field .assign (auxillary)

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField|string} field
    * @param {any} value
    * @param {UndoManager} undoManager
    */
   static setFieldValue (executionContext, node, field, value, undoManager = UndoManager .shared)
   {
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance  = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name      = field .getName (),
         auxillary = field .create ()

      auxillary .setValue (value)

		if (auxillary .equals (field))
      {
         field .addEvent ()
         return
      }

      const oldValue = field .copy ()

      undoManager .beginUndo (_ ("Change Field %s »%s«"), node .getTypeName (), field .getName ())

      field .assign (auxillary)

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
            this .removeNodesFromExecutionContextIfNecessary (executionContext, [oldValue], undoManager)
            break
         case X3D .X3DConstants .MFNode:
            this .removeNodesFromExecutionContextIfNecessary (executionContext, oldValue, undoManager)
            break
      }

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField} field
    * @param {number} index
    * @param {any} value
    * @param {UndoManager} undoManager
    */
   static insertValueIntoArray (executionContext, node, field, index, value, undoManager = UndoManager .shared)
   {
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName (),
         oldValue = field .copy ()

      undoManager .beginUndo (_ ("Insert Value into %s »%s«"), node .getTypeName (), field .getName ())

      field .splice (index, 0, value)

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField} field
    * @param {any} value
    * @param {UndoManager} undoManager
    */
   static appendValueToArray (executionContext, node, field, value, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Append Value to %s »%s«"), node .getTypeName (), field .getName ())

      this .insertValueIntoArray (executionContext, node, field, field .length, value, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField} field
    * @param {number} index
    * @param {UndoManager} undoManager
    */
   static removeValueFromArray (executionContext, node, field, index, undoManager = UndoManager .shared)
   {
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName (),
         oldValue = field .copy ()

      undoManager .beginUndo (_ ("Remove Value from %s »%s«"), node .getTypeName (), field .getName ())

      this .removeNodesFromExecutionContextIfNecessary (executionContext, field .splice (index, 1), undoManager)

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager)
      })

      this .requestUpdateInstances (node, undoManager)

      undoManager .endUndo ()
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {MFNode|Array<X3DNode>} nodes
    * @param {UndoManager} undoManager
    */
   static removeEmptyGroups (executionContext, nodes, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_ ("Remove Empty Groups"))

      if (nodes instanceof X3D .MFNode)
      {
         this .#removeEmptyGroupsFromArray (executionContext, nodes, undoManager)
      }
      else
      {
         for (const node of nodes)
            this .#removeEmptyGroupsFromNode (node, undoManager)
      }

      undoManager .endUndo ()
   }

   static #removeEmptyGroupsFromArray (node, field, undoManager = UndoManager .shared)
   {
      for (let index = field .length - 1; index >= 0; -- index)
      {
         const value = field [index]

         if (!this .#removeEmptyGroupsFromNode (value ? value .getValue () : null, undoManager))
            continue

         this .removeValueFromArray (node .getExecutionContext (), node, field, index, undoManager)
      }

      return field .length === 0
   }

   static #removeEmptyGroupsFromNode (node, undoManager = UndoManager .shared)
   {
      if (!node)
         return true

      return node .getFields () .every (field =>
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               return !field .getValue ()
            }
            case X3D .X3DConstants .MFNode:
            {
               return this .#removeEmptyGroupsFromArray (node, field, undoManager)
            }
            default:
               return true
         }
      })
   }
}
