"use strict"

const
   $           = require ("jquery"),
   path        = require ("path"),
   url         = require ("url"),
   fs          = require ("fs"),
   zlib        = require ("zlib"),
   X3D         = require ("../X3D"),
   Traverse    = require ("x3d-traverse") (X3D),
   UndoManager = require ("./UndoManager"),
   _           = require ("../Application/GetText")

module .exports = class Editor
{
   /**
    * Shard UndoManager
    */
   static get undoManager () { return UndoManager .shared; }

   /**
    * X3D Id
    */
   static Id = /(?:^[^\x30-\x39\x00-\x20\x22\x23\x27\x2b\x2c\x2d\x2e\x5b\x5c\x5d\x7b\x7d\x7f]{1}[^\x00-\x20\x22\x23\x27\x2c\x2e\x5b\x5c\x5d\x7b\x7d\x7f]*$|^$)/

   /**
    *
    * @param {X3DExecutionContext} executionContext source execution context
    * @param {string} filePath file path
    * @returns {string} URI encoded relative path
    */
   static relativePath (executionContext, filePath)
   {
      try
      {
         return encodeURI (path .relative (path .dirname (url .fileURLToPath (executionContext .getWorldURL ())), filePath));
      }
      catch
      {
         return url .pathToFileURL (filePath);
      }
   }

   static #specialChars = new Map ("\t\n\r \"[]{}" .split ("") .map (c => [encodeURIComponent (c), c]));
   static #specialCharsRegExp = new RegExp ([... this .#specialChars .keys ()] .join ("|"), "ig");

   static decodeURI (uri)
   {
      if (uri .match (/^\s*(?:ecmascript|javascript|vrmlscript):/s))
         return uri;

      return $.try (() => decodeURI (uri)) ?? uri;
   }

   static encodeURI (uri)
   {
      if (uri .match (/^\s*(?:ecmascript|javascript|vrmlscript):/s))
         return uri;

      if (uri .match (/^\s*data:/s))
         return encodeURI (uri) .replace (this .#specialCharsRegExp, c => this .#specialChars .get (c .toUpperCase ()));

      return encodeURI (uri);
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext source execution context
    * @param {Array<X3DNode|X3DExternProtoDeclaration|X3DProtoDeclaration>} objects objects to export
    * @param {Object} options
    * @returns {string} x3dSyntax
    */
   static async exportX3D (executionContext, objects = [ ], { type = "x3d", importedNodes = false, exportedNodes = false } = { })
   {
      const
         externprotos = new Set (),
         protos       = new Set (),
         nodes        = new X3D .MFNode (... objects .filter (o => o ?.getType () .includes (X3D .X3DConstants .X3DNode) ?? true));

      const
         browser = executionContext .getBrowser (),
         scene   = await browser .createScene (browser .getProfile ("Core"));

      // Determine protos.

      const protoNodes = new Set ()

      for (const object of Traverse .traverse (objects, Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES | Traverse .PROTOTYPE_INSTANCES))
      {
         if (object instanceof X3D .X3DProtoDeclarationNode)
         {
            protoNodes .add (object);
         }
         else if (object instanceof X3D .SFNode)
         {
            const node = object .getValue ();

            if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
               protoNodes .add (node .getProtoNode ());
         }
      }

      for (const protoNode of protoNodes)
      {
         if (protoNode .getExecutionContext () === executionContext)
            continue;

         if (objects .includes (protoNode))
            continue;

         protoNodes .delete (protoNode);
      }

      for (const protoNode of protoNodes)
      {
         if (protoNode .isExternProto)
            externprotos .add (protoNode);
         else
            protos .add (protoNode);
      }

      // Determine components, imported nodes and routes.

      const
         componentNames = new Set (),
         children       = new Set (),
         childRoutes    = new Set (),
         inlineNodes    = new Set ();

      for (const object of nodes .traverse (Traverse .ROOT_NODES))
      {
         const node = object .getValue ();

         componentNames .add (node .getComponentInfo () .name);
         children .add (node .valueOf ());

         for (const field of node .getFields ())
         {
            for (const route of field .getInputRoutes ())
               childRoutes .add (route);

            for (const route of field .getOutputRoutes ())
               childRoutes .add (route);
         }

         if (node .getType () .includes (X3D .X3DConstants .Inline))
            inlineNodes .add (node .valueOf ());
      }

      // Add exported nodes.

      if (exportedNodes && (executionContext instanceof X3D .X3DScene))
      {
         for (const exportedNode of executionContext .exportedNodes)
         {
            if (!children .has (exportedNode .getLocalNode () .valueOf ()))
               continue;

            scene .exportedNodes .add (exportedNode .getExportedName (), exportedNode);
         }
      }

      // Add imported nodes.

      if (importedNodes)
      {
         for (const importedNode of executionContext .importedNodes)
         {
            if (!inlineNodes .has (importedNode .getInlineNode () .valueOf ()))
               continue;

            children .add (importedNode);
            scene .importedNodes .add (importedNode .getImportedName (), importedNode);
         }
      }

      // Filter out routes.

      const routes = [... childRoutes] .filter (route => children .has (route .getSourceNode () .valueOf ()) && children .has (route .getDestinationNode () .valueOf ()));

      // Store world url.

      if (!executionContext .worldURL .startsWith ("data:"))
         scene .setMetaData ("base", executionContext .worldURL);

      // Add protos.

      for (const externproto of externprotos)
         scene .externprotos .add (externproto .getName (), externproto);

      for (const proto of protos)
         scene .protos .add (proto .getName (), proto);

      // Set profile and components.

      scene .setProfile (browser .getProfile ("Core"));

      for (const name of componentNames)
         scene .addComponent (browser .getComponent (name));

      // Add nodes.

      scene .rootNodes = nodes;

      // Add routes.

      for (const route of routes)
         scene .routes .add (route .getRouteId (), route);

      // Return XML string.

      this .inferProfileAndComponents (scene, new UndoManager ());

      const x3dSyntax = this .getContents (scene, type);

      // Dispose scene.

      scene .routes .clear ();
      scene .dispose ();
      nodes .dispose ();

      return x3dSyntax;
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
         browser        = executionContext .getBrowser (),
         scene          = executionContext .getLocalScene (),
         profile        = scene .getProfile (),
         x_ite          = scene .hasComponent ("X_ITE"),
         externprotos   = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p])),
         protos         = new Map (Array .from (executionContext .protos,       p => [p .getName (), p])),
         rootNodes      = executionContext .rootNodes .copy (),
         tempScene      = await browser .createScene (browser .getProfile ("Core"));

      scene .setProfile (browser .getProfile ("Full"));
      scene .updateComponent (browser .getComponent ("X_ITE"));

      try
      {
         const parser = new X3D .GoldenGate (tempScene);

         parser .pushExecutionContext (executionContext);

         await new Promise ((resolve, reject) => parser .parseIntoScene (x3dSyntax, resolve, reject));
      }
      catch (error)
      {
         console .error (error);
         return [ ];
      }
      finally
      {
         // Restore profile and components.

         scene .setProfile (profile);

         if (!x_ite)
            scene .removeComponent ("X_ITE");
      }

      // Undo.

      undoManager .beginUndo (_("Import X3D"));

      undoManager .registerUndo (() =>
      {
         // Restore ExternProtos.
         this .setExternProtoDeclarations (executionContext, externprotos, undoManager);

         // Restore Protos.
         this .setProtoDeclarations (executionContext, protos, undoManager);

         // Restore Root Nodes.
         this .setFieldValue (executionContext, executionContext, executionContext .rootNodes, rootNodes, undoManager);
      });

      // Add components.

      await Promise .all ([... tempScene .getProfile () .components, ... tempScene .getComponents ()]
         .map (component => this .addComponent (scene, component, undoManager)));

      // Remove protos that already exists in context.

      const
         nodes               = [... executionContext .rootNodes] .slice (rootNodes .length) .map (n => n ?.getValue ()),
         newExternProtos     = [... executionContext .externprotos] .slice (externprotos .size),
         newProtos           = [... executionContext .protos] .slice (protos .size),
         updatedExternProtos = new Map (),
         updatedProtos       = new Map (),
         removedProtoNodes   = new Set ();

      for (const object of Traverse .traverse ([... newProtos, ... nodes], Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            continue;

         if (node .getProtoNode () .getExecutionContext () !== executionContext)
            continue;

         const proto = protos .get (node .getTypeName ());

         if (proto)
         {
            updatedProtos .set (node .getTypeName (), proto);
            this .setProtoNode (executionContext, node, proto, undoManager);
            continue;
         }

         const externproto = externprotos .get (node .getTypeName ());

         if (externproto)
         {
            updatedExternProtos .set (node .getTypeName (), externproto);
            this .setProtoNode (executionContext, node, externproto, undoManager);
            continue;
         }

         const available = this .getNextAvailableProtoNode (executionContext, node .getTypeName ());

         if (available)
         {
            removedProtoNodes .add (node .getProtoNode ());
            this .setProtoNode (executionContext, node, available, undoManager);
            continue;
         }
      }

      for (const [name, externproto] of updatedExternProtos)
         this .updateExternProtoDeclaration (executionContext, name, externproto, undoManager);

      for (const [name, proto] of updatedProtos)
         this .updateProtoDeclaration (executionContext, name, proto, undoManager);

      for (const protoNode of removedProtoNodes)
      {
         if (protoNode .isExternProto)
            this .removeExternProtoDeclaration (executionContext, protoNode .getName (), undoManager);
         else
            this .removeProtoDeclaration (executionContext, protoNode .getName (), undoManager);
      }

      const oldWorldURL = tempScene .getMetaData ("base");

      if (oldWorldURL)
      {
         for (const objects of [newExternProtos, newProtos, nodes])
            this .rewriteURLs (executionContext, objects, oldWorldURL [0], executionContext .worldURL, new UndoManager ());
      }

      // Add exported nodes.

      if (executionContext instanceof X3D .X3DScene)
      {
         for (const exportedNode of tempScene .exportedNodes)
         {
            this .updateExportedNode (executionContext, executionContext .getUniqueExportName (exportedNode .getExportedName ()), "", exportedNode .getLocalNode (), undoManager);
         }
      }

      tempScene .dispose ();

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();

      return nodes;
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DNode>} nodes
    * @param {string} filePath
    * @param {UndoManager} undoManager
    * @returns {Promise<void>}
    */
   static async convertNodesToInlineFile (executionContext, nodes, filePath)
   {
      const
         browser        = executionContext .getBrowser (),
         scene          = await browser .createScene (browser .getProfile ("Core")),
         x3dSyntax      = await this .exportX3D (executionContext, nodes, { importedNodes: true, exportedNodes: true }),
         loadUrlObjects = browser .getBrowserOption ("LoadUrlObjects");

      browser .setBrowserOption ("LoadUrlObjects", false);

      scene .setWorldURL (url .pathToFileURL (filePath));

      await this .importX3D (scene, x3dSyntax, new UndoManager ());

      this .rewriteURLs (scene, scene, executionContext .worldURL, scene .worldURL, new UndoManager ());
      this .inferProfileAndComponents (scene, new UndoManager ());

      fs .writeFileSync (filePath, this .getContents (scene, path .extname (filePath)));

      for (const object of scene .traverse (Traverse .ROOT_NODES | Traverse .PROTOTYPE_INSTANCES))
         object .dispose ();

      browser .setBrowserOption ("LoadUrlObjects", loadUrlObjects);
   }

   /**
    *
    * @param {X3DScene} scene a scene
    * @param {string=} type default is ".x3d"
    * @returns {string}
    */
   static getContents (scene, type)
   {
      switch (type ?.toLowerCase ())
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
      return /* html */ `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/x_ite@latest/dist/x_ite.min.js"></script>
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
${scene .toXMLString ({ html: true, indent: " " .repeat (6) }) .trimEnd () }
    </x3d-canvas>
    <p>Made with <a href="https://create3000.github.io/sunrize/" target="_blank">Sunrize X3D Editor.</a></p>
  </body>
</html>`
   }

   static absoluteURL = new RegExp ("^(?:[a-z]+:|//)", "i");
   static fontFamilies = new Set (["SERIF", "SANS", "TYPEWRITER"]);

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
      undoManager .beginUndo (_("Rewrite URLs"))

      for (const object of Traverse .traverse (objects, Traverse .EXTERNPROTO_DECLARATIONS | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         const
            node          = object instanceof X3D .SFNode ? object .getValue () : object,
            urlObject     = node .getType () .includes (X3D .X3DConstants .X3DUrlObject),
            fontStyleNode = node .getType () .includes (X3D .X3DConstants .X3DFontStyleNode);

         if (!(urlObject || fontStyleNode))
            continue;

         const newURL = new X3D .MFString ();

         for (const fileURL of node ._url)
         {
            if (fontStyleNode && this .fontFamilies .has (fileURL))
            {
               newURL .push (fileURL);
               continue;
            }
            else if (this .absoluteURL .test (fileURL))
            {
               try
               {
                  const filePath = url .fileURLToPath (new URL (fileURL, oldWorldURL));

                  let relativePath = path .relative (path .dirname (url .fileURLToPath (newWorldURL)), filePath);

                  relativePath += new URL (fileURL) .search;
                  relativePath += new URL (fileURL) .hash;

                  // Add new relative file URL.

                  newURL .push (encodeURI (relativePath));
                  continue;
               }
               catch (error)
               {
                  // console .log (error)
               }

               newURL .push (fileURL);
            }
            else
            {
               try
               {
                  const
                     filePath     = path .resolve  (path .dirname (url .fileURLToPath (oldWorldURL)), fileURL),
                     relativePath = path .relative (path .dirname (url .fileURLToPath (newWorldURL)), filePath);

                  // Add new relative file URL.
                  newURL .push (encodeURI (relativePath));
                  continue;
               }
               catch
               { }

               try
               {
                  // Add absolute URL.
                  newURL .push (new URL (fileURL, oldWorldURL));
                  continue;
               }
               catch
               { }

               // Fallback, use original URL.
               newURL .push (fileURL);
            }
         }

         const uniqueURL = new X3D .MFString (... new Set (newURL));

         this .setFieldValue (executionContext, node, node ._url, uniqueURL, undoManager);
      }

      undoManager .endUndo ();
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
         profileAndComponents = this .getProfileAndComponentsFromUsedComponents (browser, usedComponents);

      undoManager .beginUndo (_("Infer Profile and Components from Source"));

      this .setProfile    (scene, profileAndComponents .profile,    undoManager);
      this .setComponents (scene, profileAndComponents .components, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DScene} scene
    * @returns {Array<ComponentInfo>}
    */
   static getUsedComponents (scene)
   {
      const components = new Set ();

      for (const object of scene .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES | Traverse .PROTOTYPE_INSTANCES))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         components .add (node .getComponentInfo () .name);
      }

      return components;
   }

   static getProfileAndComponentsFromUsedComponents (browser, usedComponents)
   {
      const profiles = ["Interactive", "Interchange", "Immersive"] .map (name =>
      {
         return { profile: browser .getProfile (name), components: new Set (usedComponents) };
      });

      profiles .forEach (object =>
      {
         for (const component of object .profile .components)
            object .components .delete (component .name);
      });

      const min = profiles .reduce ((min, object) =>
      {
         const count = object .profile .components .length + object .components .size;

         return min .count < count ? min : {
            count: count,
            object: object,
         };
      },
      { count: Number .POSITIVE_INFINITY });

      return {
         profile: min .object .profile,
         components: Array .from (min .object .components) .sort () .map (name => browser .getSupportedComponents () .get (name)),
      };
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {ProfileInfo} profile
    * @param {UndoManager} undoManager
    */
   static setProfile (scene, profile, undoManager = UndoManager .shared)
   {
      const oldProfile = scene .getProfile ();

      if ((profile && oldProfile && profile .name === oldProfile .name) || (profile === oldProfile))
         return;

      const browser = scene .getBrowser ();

      undoManager .beginUndo (_("Set Profile to »%s«"), profile ? profile .title : "Full");

      scene .setProfile (profile);

      undoManager .registerUndo (() =>
      {
         this .setProfile (scene, oldProfile, undoManager);
      });

      undoManager .endUndo ();
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
         oldComponents = Array .from (scene .getComponents ());

      undoManager .beginUndo (_("Set Components of Scene"));

      for (const { name } of oldComponents)
         scene .removeComponent (name);

      for (const component of components)
         scene .addComponent (component);

      undoManager .registerUndo (() =>
      {
         this .setComponents (scene, oldComponents, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} scene
    * @param {string|ComponentInfo} name
    * @param {UndoManager} undoManager
    */
   static addComponent (scene, name, undoManager = UndoManager .shared)
   {
      scene = scene .getLocalScene ();
      name  = name instanceof X3D .ComponentInfo ? name .name : name;

      if (scene .hasComponent (name))
         return;

      const browser = scene .getBrowser ();

      undoManager .beginUndo (_("Add Component %s"), name);

      scene .addComponent (browser .getComponent (name));

      undoManager .registerUndo (() =>
      {
         this .removeComponent (scene, name, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} scene
    * @param {string|ComponentInfo} name
    * @param {UndoManager} undoManager
    */
   static removeComponent (scene, name, undoManager = UndoManager .shared)
   {
      scene = scene .getLocalScene ();
      name  = name instanceof X3D .ComponentInfo ? name .name : name;

      if (!scene .hasComponent (name))
         return;

      undoManager .beginUndo (_("Remove Component %s"), name);

      scene .removeComponent (name);

      undoManager .registerUndo (() =>
      {
         this .addComponent (scene, name, undoManager);
      });

      undoManager .endUndo ();
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

      undoManager .beginUndo (_("Update Unit Category »%s«"), category)

      scene .updateUnit (category, name, conversionFactor)

      undoManager .registerUndo (() =>
      {
         this .updateUnit (scene, category, oldName, oldConversionFactor, undoManager)
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {Array<[string,string]>} entries
    * @param {UndoManager} undoManager
    */
   static setMetaData (scene, entries, undoManager = UndoManager .shared)
   {
      const oldEntries = [ ];

      for (const [key, values] of scene .getMetaDatas ())
      {
         for (const value of values)
            oldEntries .push ([key, value]);
      }

      undoManager .beginUndo (_("Change Meta Data"));

      for (const key of Array .from (scene .getMetaDatas () .keys ()))
         scene .removeMetaData (key);

      for (const [key, value] of entries)
         scene .addMetaData (key, value);

      undoManager .registerUndo (() =>
      {
         this .setMetaData (scene, oldEntries, undoManager);
      });

      undoManager .endUndo ();
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
      node = node .valueOf ();

      const
         oldNode = $.try (() => executionContext .getNamedNode (name)),
         oldName = node .getName ();

      undoManager .beginUndo (_("Rename Node to »%s«"), name);

      executionContext .updateNamedNode (name, node);

      undoManager .registerUndo (() =>
      {
         if (oldNode)
            this .updateNamedNode (executionContext, name, oldNode, undoManager);

         if (oldName)
            this .updateNamedNode (executionContext, oldName, node, undoManager);
         else
            this .removeNamedNode (executionContext, node, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {UndoManager} undoManager
    */
   static removeNamedNode (executionContext, node, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const oldName = node .getName ();

      undoManager .beginUndo (_("Remove Node Name »%s«"), oldName);

      executionContext .removeNamedNode (oldName);

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateNamedNode (executionContext, oldName, node, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} inlineNode
    * @param {string} exportedName
    * @param {string} importedName
    * @param {UndoManager} undoManager
    */
   static updateImportedNode (executionContext, inlineNode, exportedName, importedName, oldImportedName, undoManager = UndoManager .shared)
   {
      inlineNode = inlineNode .valueOf ();

      undoManager .beginUndo (_("Update Imported Node »%s«"), importedName);

      executionContext .updateImportedNode (inlineNode .valueOf (), exportedName, importedName);

      if (oldImportedName && oldImportedName !== importedName)
      {
         const
            oldImportedNode = executionContext .getImportedNodes () .get (oldImportedName),
            newImportedNode = executionContext .getImportedNodes () .get (importedName);

         const routes = executionContext .getRoutes () .filter (route =>
         {
            if (route .sourceNode === oldImportedNode)
               return true;

            if (route .destinationNode === oldImportedNode)
               return true;

            return false;
         });

         executionContext .removeImportedNode (oldImportedName);

         for (let { sourceNode, sourceField, destinationNode, destinationField } of routes)
         {
            if (sourceNode === oldImportedNode)
               sourceNode = newImportedNode;

            if (destinationNode === oldImportedNode)
               destinationNode = newImportedNode;

            executionContext .addRoute (sourceNode, sourceField, destinationNode, destinationField);
         }
      }

      undoManager .registerUndo (() =>
      {
         if (oldImportedName)
            this .updateImportedNode (executionContext, inlineNode, exportedName, oldImportedName, importedName, undoManager);
         else
            this .removeImportedNode (executionContext, importedName, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
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
         exportedName = importedNode .getExportedName ();

      const routes = executionContext .getRoutes () .filter (route =>
      {
         if (route .sourceNode === importedNode)
            return true;

         if (route .destinationNode === importedNode)
            return true;

         return false;
      });

      undoManager .beginUndo (_("Remove Imported Node »%s«"), importedName);

      executionContext .removeImportedNode (importedName);

      undoManager .registerUndo (() =>
      {
         this .updateImportedNode (executionContext, inlineNode, exportedName, importedName, "", undoManager);

         const newImportedNode = executionContext .getImportedNodes () .get (importedName);

         for (let { sourceNode, sourceField, destinationNode, destinationField } of routes)
         {
            if (sourceNode === importedNode)
               sourceNode = newImportedNode;

            if (destinationNode === importedNode)
               destinationNode = newImportedNode;

            executionContext .addRoute (sourceNode, sourceField, destinationNode, destinationField);
         }
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DScene} scene
    * @param {string} exportedName
    * @param {X3DNode} node
    * @param {UndoManager} undoManager
    */
   static updateExportedNode (scene, exportedName, oldExportedName, node, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      undoManager .beginUndo (_("Update Exported Node »%s«"), exportedName);

      if (oldExportedName)
         scene .removeExportedNode (oldExportedName);

      scene .updateExportedNode (exportedName, node);

      undoManager .registerUndo (() =>
      {
         if (oldExportedName)
            this .updateExportedNode (scene, oldExportedName, exportedName, node, undoManager);
         else
            this .removeExportedNode (scene, exportedName, undoManager);
      });

      this .requestUpdateInstances (scene, undoManager);

      undoManager .endUndo ();
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
         node         = exportedNode .getLocalNode ();

      undoManager .beginUndo (_("Remove Exported Node »%s«"), exportedName);

      scene .removeExportedNode (exportedName);

      undoManager .registerUndo (() =>
      {
         this .updateExportedNode (scene, exportedName, "", node, undoManager);
      });

      this .requestUpdateInstances (scene, undoManager);

      undoManager .endUndo ();
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

      undoManager .beginUndo (_("Add Proto Declaration »%s«"), name)

      proto .setup ()
      executionContext .updateProtoDeclaration (name, proto)

      undoManager .registerUndo (() =>
      {
         this .setProtoDeclarations (executionContext, oldProtos, undoManager)
      });

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ();

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

      undoManager .beginUndo (_("Update Proto Declaration »%s«"), name)

      executionContext .updateProtoDeclaration (name, proto)

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateProtoDeclaration (executionContext, oldName, proto, undoManager)
         else
            this .removeProtoDeclaration (executionContext, name, undoManager)
      });

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ();
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

      undoManager .beginUndo (_("Remove Proto Declaration »%s«"), name)

      executionContext .removeProtoDeclaration (name)

      undoManager .registerUndo (() =>
      {
         this .setProtoDeclarations (executionContext, oldProtos, undoManager)
      });

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ();
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

      undoManager .beginUndo (_("Update Proto Declarations"))

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
      });

      this .requestUpdateInstances (executionContext, undoManager)

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DProtoDeclaration} proto
    * @param {string} filePath
    * @param {UndoManager} undoManager
    * @returns {Promise<void>}
    */
   static async turnIntoExternProto (executionContext, proto, filePath, undoManager = UndoManager .shared)
   {
      const
         browser   = executionContext .getBrowser (),
         scene     = await browser .createScene (browser .getProfile ("Core")),
         x3dSyntax = await this .exportX3D (executionContext, [proto]);

      undoManager .beginUndo (_("Turn Prototype »%s« into Extern Prototype"), proto .getName ());

      this .removeProtoDeclaration (executionContext, proto .getName (), undoManager);

      scene .setWorldURL (url .pathToFileURL (filePath));

      await this .importX3D (scene, x3dSyntax, new UndoManager ());

      this .rewriteURLs (scene, scene, executionContext .worldURL, scene .worldURL, new UndoManager ());
      this .inferProfileAndComponents (scene, new UndoManager ());

      fs .writeFileSync (filePath, this .getContents (scene, path .extname (filePath)));
      scene .dispose ();

      const
         name         = executionContext .getUniqueExternProtoName (proto .getName ()),
         externproto  = this .addExternProtoDeclaration (executionContext, name, undoManager),
         relativePath = this .relativePath (executionContext, filePath),
         absolutePath = url .pathToFileURL (filePath) .href,
         hash         = "#" + encodeURIComponent (proto .getName ());

      externproto ._url = new X3D .MFString (relativePath + hash, absolutePath + hash);

      this .replaceProtoNodes (executionContext, proto, externproto, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DProtoDeclaration} proto
    * @param {X3DProtoDeclaration} parent
    * @returns
    */
   static protoIsUsedInProto (proto, parent)
   {
      for (const object of parent .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODE))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            continue;

         if (node .getProtoNode () === proto)
            return true;
      }

      return false;
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
         externproto     = new X3D .X3DExternProtoDeclaration (executionContext, new X3D .MFString ());

      undoManager .beginUndo (_("Add Extern Prototype Declaration »%s«"), name);

      externproto .setup ();
      executionContext .updateExternProtoDeclaration (name, externproto);

      undoManager .registerUndo (() =>
      {
         this .setExternProtoDeclarations (executionContext, oldExternprotos, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();

      return externproto;
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
      const oldName = externproto .getName ();

      undoManager .beginUndo (_("Update Extern Prototype Declaration »%s«"), name);

      executionContext .updateExternProtoDeclaration (name, externproto);

      undoManager .registerUndo (() =>
      {
         if (oldName)
            this .updateExternProtoDeclaration (executionContext, oldName, externproto, undoManager);
         else
            this .removeExternProtoDeclaration (executionContext, name, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {string} name
    * @param {UndoManager} undoManager
    */
   static removeExternProtoDeclaration (executionContext, name, undoManager = UndoManager .shared)
   {
      const oldExternProtos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p]));

      undoManager .beginUndo (_("Remove Extern Prototype Declaration »%s«"), name);

      executionContext .removeExternProtoDeclaration (name);

      undoManager .registerUndo (() =>
      {
         this .setExternProtoDeclarations (executionContext, oldExternProtos, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DExternProtoDeclaration>|Map<string,X3DExternProtoDeclaration>} externprotos
    * @param {UndoManager} undoManager
    */
   static setExternProtoDeclarations (executionContext, externprotos, undoManager = UndoManager .shared)
   {
      const oldExternProtos = new Map (Array .from (executionContext .externprotos, p => [p .getName (), p]));

      undoManager .beginUndo (_("Update Extern Prototype Declarations"));

      for (const name of oldExternProtos .keys ())
         executionContext .removeExternProtoDeclaration (name);

      if (Array .isArray (externprotos))
      {
         for (const externproto of externprotos)
            executionContext .updateExternProtoDeclaration (externproto .getName (), externproto);
      }
      else
      {
         for (const [name, externproto] of externprotos)
            executionContext .updateExternProtoDeclaration (name, externproto);
      }

      undoManager .registerUndo (() =>
      {
         this .setExternProtoDeclarations (executionContext, oldExternProtos, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
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
         numProtos = executionContext .protos .length,
         x3dSyntax = await this .exportX3D (externproto .getInternalScene (), [externproto .getProtoDeclaration ()]);

      undoManager .beginUndo (_("Turn Extern Prototype »%s« into Prototype"), externproto .getName ());

      this .removeExternProtoDeclaration (executionContext, externproto .getName (), undoManager);

      await this .importX3D (executionContext, x3dSyntax, undoManager);

      const
         protos         = Array .from (executionContext .protos),
         importedProtos = protos .splice (numProtos, protos .length - numProtos),
         proto          = importedProtos .at (-1);

      for (const proto of importedProtos .reverse ())
      {
         protos .unshift (proto);
         this .rewriteURLs (executionContext, proto, externproto .getInternalScene () .worldURL, executionContext .worldURL, new UndoManager ());
      }

      this .setProtoDeclarations (executionContext, protos, undoManager);
      this .replaceProtoNodes (executionContext, externproto, proto, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DProtoDeclarationNode} protoNode
    * @returns
    */
    static isProtoNodeUsed (executionContext, protoNode)
    {
      for (const object of executionContext .traverse (Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
            continue;

         if (node .getProtoNode () === protoNode)
            return true;
      }

      return false;
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
      instance = instance .valueOf ();

      const oldProtoNode = instance .getProtoNode ();

      undoManager .beginUndo (_("Set Proto Node of Instance to %s"), protoNode .getName ());

      const outerNode = executionContext .getOuterNode ();

      // Remove references from instance.

      const references = new Map ();

      if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
      {
         const proto = outerNode;

         for (const field of instance .getPredefinedFields ())
         {
            references .set (field .getName (), new Set (field .getReferences ()));

            for (const reference of field .getReferences ())
               this .removeReference (proto, reference, instance, field, undoManager);
         }
      }

      // Remove routes from instance.

      const
         inputRoutes  = new Map (),
         outputRoutes = new Map ();

      for (const field of instance .getPredefinedFields ())
      {
         inputRoutes  .set (field .getName (), new Set (field .getInputRoutes ()));
         outputRoutes .set (field .getName (), new Set (field .getOutputRoutes ()));
      }

      this .deleteRoutes (executionContext, instance, undoManager);

      // Set proto node.

      instance .setProtoNode (protoNode);

      // Restore references.

      if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
      {
         const proto = outerNode;

         for (const field of instance .getPredefinedFields ())
         {
            const oldReferences = references .get (field .getName ());

            if (oldReferences)
            {
               for (const oldReference of oldReferences)
               {
                  const reference = proto .getUserDefinedFields () .get (oldReference .getName ());

                  if (!reference)
                     continue;

                  if (reference .getType () !== field .getType ())
                     continue;

                  if (!reference .isReference (field .getAccessType ()))
                     continue;

                  this .addReference (proto, reference, instance, field, undoManager);
               }
            }
         }
      }

      // Restore routes.

      for (const field of instance .getPredefinedFields ())
      {
         const
            oldInputRoutes  = inputRoutes  .get (field .getName ()),
            oldOutputRoutes = outputRoutes .get (field .getName ());

         if (oldInputRoutes)
         {
            for (const route of oldInputRoutes)
            {
               this .addRoute (executionContext, route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
            }
         }

         if (oldOutputRoutes)
         {
            for (const route of oldOutputRoutes)
            {
               this .addRoute (executionContext, route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
            }
         }
      }

      undoManager .registerUndo (() =>
      {
         this .setProtoNode (executionContext, instance, oldProtoNode, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    * Replaces in X3DPrototypeInstance nodes protoNode by other proto node.
    * @param {X3DExecutionContext} executionContext
    * @param {X3DProtoDeclarationNode} protoNode
    * @param {X3DProtoDeclarationNode} by
    */
   static replaceProtoNodes (executionContext, protoNode, by, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_("Replace Proto Node %s"), protoNode .getName ());

      for (const object of executionContext .traverse (Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY))
      {
         if (!(object instanceof X3D .SFNode))
            continue;

         const node = object .getValue ();

         if (node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
         {
            if (node .getProtoNode () === protoNode)
               this .setProtoNode (node .getExecutionContext (), node, by, undoManager);
         }
      }

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DNode|X3DExecutionContext|X3DProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static requestUpdateInstances (proto, undoManager = UndoManager .shared)
   {
      if (proto .getType () .includes (X3D .X3DConstants .X3DNode))
         proto = proto .getExecutionContext ();

      if (proto .getType () .includes (X3D .X3DConstants .X3DExecutionContext))
         proto = proto .getOuterNode ();

      if (!proto)
         return;

      if (!proto .getType () .includes (X3D .X3DConstants .X3DProtoDeclaration))
         return;

      proto .requestUpdateInstances ();

      undoManager .registerUndo (() =>
      {
         this .requestUpdateInstances (proto, undoManager);
      });
   }

   /**
    *
    * @param {X3DNode|X3DExecutionContext|X3DProtoDeclaration} proto
    * @param {UndoManager} undoManager
    */
   static updateInstances (proto, undoManager = UndoManager .shared)
   {
      if (proto .getType () .includes (X3D .X3DConstants .X3DNode))
         proto = proto .getExecutionContext ();

      if (proto .getType () .includes (X3D .X3DConstants .X3DExecutionContext))
         proto = proto .getOuterNode ();

      if (!proto)
         return;

      if (!proto .getType () .includes (X3D .X3DConstants .X3DProtoDeclaration))
         return;

      proto .updateInstances ();

      undoManager .registerUndo (() =>
      {
         this .updateInstances (proto, undoManager);
      });
   }

   /**
    *
    * @param {X3DProtoDeclaration | X3DField} object
    * @param {UndoManager} undoManager
    */
   static updateAppInfo (object, appInfo, undoManager = UndoManager .shared)
   {
      const oldAppInfo = object .getAppInfo ();

      undoManager .beginUndo (_("Update App Info"));

      object .setAppInfo (appInfo);

      undoManager .registerUndo (() =>
      {
         this .updateAppInfo (object, oldAppInfo, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DProtoDeclaration | X3DField} object
    * @param {UndoManager} undoManager
    */
   static updateDocumentation (object, documentation, undoManager = UndoManager .shared)
   {
      const oldDocumentation = object .getDocumentation ();

      undoManager .beginUndo (_("Update App Info"));

      object .setDocumentation (documentation);

      undoManager .registerUndo (() =>
      {
         this .updateDocumentation (object, oldDocumentation, undoManager);
      });

      undoManager .endUndo ();
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
      sourceNode      = sourceNode .valueOf ();
      destinationNode = destinationNode .valueOf ();

      undoManager .beginUndo (_("Add Route from %s »%s« to %s »%s«"), sourceNode .getTypeName (), sourceField, destinationNode .getTypeName (), destinationField);

      try
      {
         executionContext .addRoute (sourceNode .valueOf (), sourceField, destinationNode .valueOf (), destinationField);
      }
      catch (error)
      {
         console .error (error);
      }

      undoManager .registerUndo (() =>
      {
         this .deleteRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {UndoManager} undoManager
    */
   static deleteRoutes (executionContext, node, undoManager = UndoManager .shared)
   {
      for (const field of node .getFields ())
      {
         for (const route of field .getInputRoutes ())
         {
            if (route .getExecutionContext () !== executionContext)
               continue;

            this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
         }

         for (const route of field .getOutputRoutes ())
         {
            if (route .getExecutionContext () !== executionContext)
               continue;

            this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
         }
      }
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
      sourceNode      = sourceNode .valueOf ();
      destinationNode = destinationNode .valueOf ();

      undoManager .beginUndo (_("Delete Route from %s »%s« to %s »%s«"), sourceNode .getTypeName (), sourceField, destinationNode .getTypeName (), destinationField);

      executionContext .deleteRoute (sourceNode .valueOf (), sourceField, destinationNode .valueOf (), destinationField);

      undoManager .registerUndo (() =>
      {
         if (sourceNode instanceof X3D .X3DImportedNode)
            sourceNode = executionContext .importedNodes .get (sourceNode .getImportedName ());

         if (destinationNode instanceof X3D .X3DImportedNode)
            destinationNode = executionContext .importedNodes .get (destinationNode .getImportedName ());

         if (!(sourceNode && destinationNode))
            return; // Imported nodes were manually removed.

         this .addRoute (executionContext, sourceNode, sourceField, destinationNode, destinationField, undoManager);
      });

      this .requestUpdateInstances (executionContext, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBrowser} browser
    * @param {UndoManager} undoManager
    */
   static getConfigNode (browser, create = false, undoManager = UndoManager .shared)
   {
      return browser .getActiveLayer () === browser .getWorld () .getLayerSet () .getLayer0 ()
         ? this .getWorldInfo (browser .currentScene, create, undoManager)
         : browser .getActiveLayer ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {UndoManager} undoManager
    */
   static getWorldInfo (executionContext, create = false, undoManager = UndoManager .shared)
   {
      if (executionContext .getWorldInfos () .length)
         return executionContext .getWorldInfos () .at (-1) .getValue ();

      if (create)
         return this .addWorldInfo (executionContext, undoManager);

      return null;
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {UndoManager} undoManager
    * @returns {WorldInfo}
    */
   static addWorldInfo (executionContext, undoManager = UndoManager .shared)
   {
      const
         worldInfoNode = executionContext .createNode ("WorldInfo"),
         fileURL       = new URL (executionContext .getWorldURL ());

      if (fileURL .protocol === "file:")
         worldInfoNode .title = path .parse (url .fileURLToPath (fileURL)) .name;

      undoManager .beginUndo (_("Add WorldInfo Node"));

      this .insertValueIntoArray (executionContext, executionContext, executionContext .rootNodes, 0, worldInfoNode, undoManager);

      undoManager .endUndo ();

      return worldInfoNode .getValue ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {WorldInfo} worldInfo
    * @param {UndoManager} undoManager
    */
   static removeWorldInfo (executionContext, worldInfoNode, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_("Remove WorldInfo Node"));

      this .removeNode (executionContext, worldInfoNode, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} remove
    * @param {UndoManager} undoManager
    */
   static removeNode (executionContext, remove, undoManager = UndoManager .shared)
   {
      remove = remove .valueOf ();

      undoManager .beginUndo (_("Remove Node"));

      for (const object of executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         const node = object instanceof X3D .SFNode ? object .getValue () : object;

         if (node instanceof X3D .X3DExecutionContext)
         {
            for (let i = node .rootNodes .length - 1; i >= 0; -- i)
            {
               if (node .rootNodes [i] ?.getValue () .valueOf () === remove)
                  this .removeValueFromArray (node, node, node .rootNodes, i, undoManager);
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
                     if (field .getValue () ?.valueOf () === remove)
                        this .setFieldValue (node .getExecutionContext (), node, field, null, undoManager);

                     break;
                  }
                  case X3D .X3DConstants .MFNode:
                  {
                     for (let i = field .length - 1; i >= 0; -- i)
                     {
                        if (field [i] ?.getValue () .valueOf () === remove)
                           this .removeValueFromArray (node .getExecutionContext (), node, field, i, undoManager);
                     }

                     break;
                  }
               }
            }
         }
      }

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static addUserDefinedField (executionContext, node, field, index, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const fields = Array .from (node .getUserDefinedFields ());

      index = Math .min (index < 0 ? fields .length : index, fields .length);

      undoManager .beginUndo (_("Add Field »%s«"), field .getName ());

      fields .splice (index, 0, field);

      this .setUserDefinedFields (executionContext, node, fields, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static updateUserDefinedField (executionContext, node, field, accessType, name, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const
         oldAccessType = field .getAccessType (),
         oldName       = field .getName (),
         fields        = Array .from (node .getUserDefinedFields ());

      undoManager .beginUndo (_("Update Fields of Node %s"), node .getTypeName ());

      for (const field of fields)
         node .removeUserDefinedField (field .getName ());

      field .setAccessType (accessType);
      field .setName (name);

      for (const field of fields)
         node .addUserDefinedField (field .getAccessType (), field .getName (), field);

      if (accessType !== oldAccessType)
      {
         if (node instanceof X3D .X3DProtoDeclaration)
         {
            const
               proto        = node,
               updatedField = field;

            for (const object of proto .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
            {
               if (!(object instanceof X3D .SFNode))
                  continue;

               const node = object .getValue ();

               for (const field of node .getFields ())
               {
                  // Remove references.

                  if (field .getReferences () .has (updatedField))
                  {
                     if (!updatedField .isReference (field .getAccessType ()))
                        this .removeReference (proto, updatedField, node, field, undoManager);
                  }
               }
            }

            // Remove routes.

            for (const object of executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
            {
               if (!(object instanceof X3D .SFNode))
                  continue;

               const node = object .getValue ();

               if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
                  continue;

               if (node .getProtoNode () !== proto)
                  continue;

               const field = node .getField (oldName);

               if (!updatedField .isInput ())
               {
                  for (const route of field .getInputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
                  }
               }

               if (!updatedField .isOutput ())
               {
                  for (const route of field .getOutputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
                  }
               }
            }

            this .updateInstances (proto, undoManager);
         }
         else
         {
            // Remove References.

            for (const reference of field .getReferences ())
            {
               if (!reference .isReference (field .getAccessType ()))
                  this .removeReference (proto, reference, node, field, undoManager);
            }

            // Remove routes.

            if (!field .isInput ())
            {
               for (const route of field .getInputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
               }
            }

            if (!field .isOutput ())
            {
               for (const route of field .getOutputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
               }
            }
         }
      }

      undoManager .registerUndo (() =>
      {
         this .updateUserDefinedField (executionContext, node, field, oldAccessType, oldName, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static removeUserDefinedField (executionContext, node, field, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const fields = [... node .getUserDefinedFields ()] .filter (f => f !== field);

      undoManager .beginUndo (_("Remove Field »%s«"), field .getName ());

      this .setUserDefinedFields (executionContext, node, fields, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {Array<X3DField>} fields
    * @param {UndoManager} undoManager
    */
   static setUserDefinedFields (executionContext, node, fields, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const
         oldFields     = Array .from (node .getUserDefinedFields ()),
         removedFields = oldFields .filter (f => !fields .includes (f));

      undoManager .beginUndo (_("Update Fields of Node %s"), node .getTypeName ());

      if (removedFields .length)
      {
         if (node instanceof X3D .X3DProtoDeclaration)
         {
            const proto = node;

            // Remove references.

            for (const object of proto .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
            {
               if (!(object instanceof X3D .SFNode))
                  continue;

               const node = object .getValue ();

               for (const field of node .getFields ())
               {
                  for (const removedField of removedFields)
                  {
                     if (field .getReferences () .has (removedField))
                        this .removeReference (proto, removedField, node, field, undoManager);
                  }

                  for (const reference of field .getReferences ())
                  {
                     if (! reference .isReference (field .getAccessType ()))
                        this .removeReference (proto, reference, node, field, undoManager);
                  }
               }
            }

            // Remove routes, and undo set value.

            for (const object of executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
            {
               if (!(object instanceof X3D .SFNode))
                  continue;

               const node = object .getValue ();

               if (!node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance))
                  continue;

               if (node .getProtoNode () !== proto)
                  continue;

               for (const removedField of removedFields)
               {
                  const field = node .getField (removedField .getName ());

                  if (field .isInitializable ())
                  {
                     const
                        name     = field .getName (),
                        oldValue = field .copy ();

                     undoManager .registerUndo (() =>
                     {
                        this .setFieldValue (node .getExecutionContext (), node, name, oldValue, undoManager);
                     });
                  }

                  for (const route of field .getInputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
                  }

                  for (const route of field .getOutputRoutes ())
                  {
                     this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
                  }
               }
            }

            this .updateInstances (proto, undoManager);
         }
         else
         {
            // Remove references.

            const outerNode = executionContext .getOuterNode ();

            if (outerNode && outerNode instanceof X3D .X3DProtoDeclaration)
            {
               const proto = outerNode;

               for (const removedField of removedFields)
               {
                  for (const reference of removedField .getReferences ())
                     this .removeReference (proto, reference, node, removedField, undoManager);
               }
            }

            // Remove routes.

            for (const removedField of removedFields)
            {
               for (const route of removedField .getInputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
               }

               for (const route of removedField .getOutputRoutes ())
               {
                  this .deleteRoute (route .getExecutionContext (), route .sourceNode, route .sourceField, route .destinationNode, route .destinationField, undoManager);
               }
            }
         }
      }

      // Set new fields, to make delete route work.

      for (const field of oldFields)
         node .removeUserDefinedField (field .getName ());

      for (const field of fields)
         node .addUserDefinedField (field .getAccessType (), field .getName (), field);

      //

      undoManager .registerUndo (() =>
      {
         this .setUserDefinedFields (executionContext, node, oldFields, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
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
      node  = node .valueOf ();
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName ()

      undoManager .beginUndo (_("Add Reference from »%s« to »%s«"), protoField .getName (), field .getName ())

      field .addReference (protoField)

      undoManager .registerUndo (() =>
      {
         this .removeReference (proto, protoField, node, instance ? name : field, undoManager)
      });

      this .requestUpdateInstances (proto, undoManager)

      undoManager .endUndo ();
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
      node  = node .valueOf ();
      field = typeof field === "string" ? node .getField (field) : field

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName ()

      undoManager .beginUndo (_("Remove Reference from »%s« to »%s«"), protoField .getName (), field .getName ())

      field .removeReference (protoField)

      undoManager .registerUndo (() =>
      {
         this .addReference (proto, protoField, node, instance ? name : field, undoManager)
      });

      this .requestUpdateInstances (proto, undoManager)

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DNode} node
    * @param {Matrix4} matrix
    * @param {Vector3} center
    * @param {UndoManager} undoManager
    */
   static setMatrixWithCenter (node, matrix, center = node ._center .getValue (), undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      undoManager .beginUndo (_("Set Transformation Matrix of %s"), node .getTypeName ());

      const
         oldMatrix = node .getMatrix () .copy (),
         oldCenter = node ._center .getValue () .copy ();

      const
         translation      = new X3D .Vector3 (),
         rotation         = new X3D .Rotation4 (),
         scale            = new X3D .Vector3 (1, 1, 1),
         scaleOrientation = new X3D .Rotation4 ();

      matrix .get (translation,
                   rotation,
                   scale,
                   scaleOrientation,
                   center);

      this .roundToIntegerIfAlmostEqual (translation);
      this .roundToIntegerIfAlmostEqual (rotation);
      this .roundToIntegerIfAlmostEqual (scale);
      this .roundToIntegerIfAlmostEqual (scaleOrientation);
      this .roundToIntegerIfAlmostEqual (center);

      if (this .almostEqual (scale .x, scale .y) && this .almostEqual (scale .x, scale .z))
         scaleOrientation .set (0, 0, 1, 0);

      node ._translation      = translation;
      node ._rotation         = rotation;
      node ._scale            = scale;
      node ._scaleOrientation = scaleOrientation;
      node ._center           = center;

      undoManager .registerUndo (() =>
      {
         this .setMatrixWithCenter (node, oldMatrix, oldCenter, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {object} vector
    * @param {number} epsilon
    */
   static roundToIntegerIfAlmostEqual (vector, epsilon = 1e-8)
   {
      for (const key in vector)
      {
         const
            value   = vector [key],
            integer = Math .round (value);

         if (this .almostEqual (value, integer, epsilon))
            vector [key] = integer;
      }

      return vector;
   }

   static almostEqual (target, value, epsilon = 1e-8)
   {
      return Math .abs (target - value) < epsilon;
   }

   static moveViewpoint (viewpointNode, position, orientation, centerOfRotation, fieldOfView, undoManager = UndoManager .shared)
   {
      viewpointNode = viewpointNode .valueOf ();

      UndoManager .shared .beginUndo (_("Move Viewpoint to User Position"));

      const
         oldPosition         = viewpointNode .getPosition () .copy (),
         oldOrientation      = viewpointNode .getOrientation () .copy (),
         oldCenterOfRotation = viewpointNode .getCenterOfRotation () .copy (),
         oldFieldOfView      = viewpointNode .getFieldOfView ();

      viewpointNode .resetUserOffsets ();
      viewpointNode .setPosition (position);
      viewpointNode .setOrientation (orientation);
      viewpointNode .setCenterOfRotation (centerOfRotation);
      viewpointNode .setFieldOfView (fieldOfView);

      undoManager .registerUndo (() =>
      {
         this .moveViewpoint (viewpointNode, oldPosition, oldOrientation, oldCenterOfRotation, oldFieldOfView, undoManager);
      });

      this .requestUpdateInstances (viewpointNode, undoManager);

      UndoManager .shared .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DLayerNode} layerNode
    * @param {Array<X3DNode>} nodes
    * @param {Vector3} targetPosition
    * @param {Vector3} targetNormal
    * @param {Vector3} sourcePosition
    * @param {Vector3} sourceNormal
    * @param {boolean} moveCenter
    * @param {UndoManager} undoManager
    */
   static moveNodesToTarget (executionContext, layerNode, nodes, targetPosition, targetNormal, sourcePosition, sourceNormal, moveCenter, undoManager = UndoManager .shared)
   {
      const
         [values, bbox] = this .getModelMatricesAndBBoxes (executionContext, layerNode, nodes),
         bboxCenter     = bbox .center;

      if (moveCenter)
         undoManager .beginUndo (_("Move Selection Center to SnapTarget"));
      else
         undoManager .beginUndo (_("Move Selection to SnapTarget"));

      for (const [node, [modelMatrices, subBBoxes]] of values)
      {
         const
            bboxMatrix = subBBoxes [0] .matrix,
            bboxXAxes  = bboxMatrix .X_AXIS .norm () ? bboxMatrix .X_AXIS : X3D .Vector3 .X_AXIS,
            bboxYAxes  = bboxMatrix .Y_AXIS .norm () ? bboxMatrix .Y_AXIS : X3D .Vector3 .Y_AXIS,
            bboxZAxes  = bboxMatrix .Z_AXIS .norm () ? bboxMatrix .Z_AXIS : X3D .Vector3 .Z_AXIS;

         const axes = [
            bboxXAxes .copy (),            // right
            bboxXAxes .copy () .negate (), // left
            bboxYAxes .copy (),            // top
            bboxYAxes .copy () .negate (), // bottom
            bboxZAxes .copy (),            // front
            bboxZAxes .copy () .negate (), // back
         ];

         const axis = axes .reduce ((previous, current) =>
         {
            return previous .dot (targetNormal) < current .dot (targetNormal)
               ? previous
               : current;
         });

         const
            center      = (moveCenter ? bboxCenter .copy () : (sourcePosition ?.copy () ?? bboxCenter .copy () .add (axis))) .subtract (modelMatrices [0] .origin),
            translation = targetPosition .copy () .subtract (center),
            rotation    = new X3D .Rotation4 (sourceNormal ?? axis, targetNormal .copy () .negate ()),
            snapMatrix  = new X3D .Matrix4 () .set (translation, rotation, null, null, center);

         const
            invModelMatrix        = modelMatrices [0] .copy () .inverse (),
            localSnapMatrix       = snapMatrix .copy () .multRight (invModelMatrix),
            localSnapNormalMatrix = localSnapMatrix .submatrix .copy () .inverse () .transpose ();

         for (const type of node .getType () .toReversed ())
         {
            switch (type)
            {
               case X3D .X3DConstants .DirectionalLight:
               {
                  const direction = localSnapMatrix
                     .multDirMatrix (node ._direction .getValue () .copy ())
                     .normalize ();

                  this .setFieldValue (executionContext, node, node ._direction, direction, undoManager);
                  break;
               }
               case X3D .X3DConstants .Extrusion:
               {
                  const spine = node ._spine .map (spine => localSnapMatrix
                     .multVecMatrix (spine .getValue () .copy ()));

                  this .setFieldValue (executionContext, node, node ._spine, spine, undoManager);
                  break;
               }
               case X3D .X3DConstants .NurbsSweptSurface:
               {
                  const trajectoryCurveNode = node ._trajectoryCurve .getValue ();

                  if (trajectoryCurveNode)
                  {
                     const controlPoint = trajectoryCurveNode ._controlPoint .map (point => localSnapMatrix
                        .multVecMatrix (point .getValue () .copy ()));

                     this .setFieldValue (executionContext, trajectoryCurveNode, trajectoryCurveNode ._controlPoint, controlPoint, undoManager);
                  }

                  break;

               }
               case X3D .X3DConstants .PointLight:
               {
                  const location = localSnapMatrix
                     .multVecMatrix (node ._location .getValue () .copy ());

                  this .setFieldValue (executionContext, node, node ._location, location, undoManager);
                  break;
               }
               case X3D .X3DConstants .SpotLight:
               case X3D .X3DConstants .Sound:
               case X3D .X3DConstants .X3DTextureProjectorNode:
               {
                  const location = localSnapMatrix
                     .multVecMatrix (node ._location .getValue () .copy ());

                  const direction = localSnapMatrix
                     .multDirMatrix (node ._direction .getValue () .copy ())
                     .normalize ();

                  this .setFieldValue (executionContext, node, node ._location,  location,  undoManager);
                  this .setFieldValue (executionContext, node, node ._direction, direction, undoManager);
                  break;
               }
               case X3D .X3DConstants .X3DComposedGeometryNode:
               {
                  const normalNode = node ._normal .getValue ();

                  if (normalNode)
                  {
                     const vector = normalNode ._vector .map (vector => localSnapNormalMatrix
                        .multVecMatrix (vector .getValue () .copy ()) .normalize ());

                     this .setFieldValue (executionContext, normalNode, normalNode ._vector, vector, undoManager);
                  }

                  const coordNode = node ._coord .getValue ();

                  if (coordNode)
                  {
                     const point = coordNode ._point .map (point => localSnapMatrix
                        .multVecMatrix (point .getValue () .copy ()));

                     this .setFieldValue (executionContext, coordNode, coordNode ._point, point, undoManager);
                  }

                  break;
               }
               case X3D .X3DConstants .X3DEnvironmentalSensorNode:
               {
                  const position = localSnapMatrix
                     .multVecMatrix (node ._position .getValue () .copy ());

                  this .setFieldValue (executionContext, node, node ._position, position, undoManager);
                  break;
               }
               case X3D .X3DConstants .X3DNurbsSurfaceGeometryNode:
               {
                  const coordNode = node ._controlPoint .getValue ();

                  if (coordNode)
                  {
                     const point = coordNode ._point .map (point => localSnapMatrix
                        .multVecMatrix (point .getValue () .copy ()));

                     this .setFieldValue (executionContext, coordNode, coordNode ._point, point, undoManager);
                  }

                  break;

               }
               case X3D .X3DConstants .HAnimHumanoid:
               case X3D .X3DConstants .X3DTransformNode:
               {
                  const matrix = node .getMatrix () .copy ()
                     .multRight (localSnapMatrix);

                  this .setMatrixWithCenter (node, matrix, undefined, undoManager);
                  break;
               }
               case X3D .X3DConstants .X3DViewpointNode:
               {
                  const position = localSnapMatrix
                     .multVecMatrix (node ._position .getValue () .copy ());

                  const orientation = new X3D .Rotation4 () .setMatrix (localSnapMatrix
                     .submatrix .multLeft (node ._orientation .getValue () .getMatrix ()));

                  this .setFieldValue (executionContext, node, node ._position,    position,    undoManager);
                  this .setFieldValue (executionContext, node, node ._orientation, orientation, undoManager);
                  break;
               }
               default:
                  continue;
            }

            break;
         }
      }

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DLayerNode} layerNode
    * @param {Array<X3DNode>} nodes
    * @returns {[Map<X3DNode,Box3[]>,Box3]}
    */
   static getModelMatricesAndBBoxes (executionContext, layerNode, nodes)
   {
      const
         values = new Map (),
         bbox   = new X3D .Box3 ();

      for (const node of nodes)
      {
         const
            innerNode     = node .getInnerNode (),
            modelMatrices = this .getModelMatrices (executionContext, layerNode, node, false);

         if (!modelMatrices .length)
            continue;

         const subBBoxes = modelMatrices .map (modelMatrix =>
         {
            for (const type of innerNode .getType () .toReversed ())
            {
               switch (type)
               {
                  case X3D .X3DConstants .DirectionalLight:
                     return new X3D .Box3 (X3D .Vector3 .ONE, innerNode .getMetaData ("DirectionalLight/location", new X3D .Vector3 ()))
                        .multLeft (new X3D .Matrix4 () .setRotation (new X3D .Rotation4 (X3D .Vector3 .Z_AXIS, innerNode ._direction .getValue ())))
                        .multRight (modelMatrix);
                  case X3D .X3DConstants .PointLight:
                     return new X3D .Box3 (X3D .Vector3 .ONE, innerNode ._location .getValue ())
                        .multRight (modelMatrix);
                  case X3D .X3DConstants .SpotLight:
                  case X3D .X3DConstants .Sound:
                  case X3D .X3DConstants .X3DTextureProjectorNode:
                     return new X3D .Box3 (X3D .Vector3 .ONE, innerNode ._location .getValue ())
                        .multLeft (new X3D .Matrix4 () .setRotation (new X3D .Rotation4 (X3D .Vector3 .Z_AXIS, innerNode ._direction .getValue ())))
                        .multRight (modelMatrix);
                  case X3D .X3DConstants .X3DBoundedObject:
                     return innerNode .getBBox (new X3D .Box3 ()) .multRight (modelMatrix);
                  case X3D .X3DConstants .X3DGeometryNode:
                     return innerNode .getBBox () .copy () .multRight (modelMatrix);
                  case X3D .X3DConstants .ViewpointGroup:
                  case X3D .X3DConstants .X3DEnvironmentalSensorNode:
                     return new X3D .Box3 (innerNode ._size .getValue (), innerNode ._center .getValue ())
                        .multRight (modelMatrix);
                  case X3D .X3DConstants .X3DViewpointNode:
                     return new X3D .Box3 (X3D .Vector3 .ONE, innerNode ._position .getValue ())
                        .multLeft (new X3D .Matrix4 () .setRotation (innerNode ._orientation .getValue ()))
                        .multRight (modelMatrix);
                  case X3D .X3DConstants .X3DLayerNode:
                     return innerNode .getBBox (new X3D .Box3 ());
                  default:
                     continue;
               }
            }

            return new X3D .Box3 ();
         });

         values .set (node, [modelMatrices, subBBoxes]);
         subBBoxes .forEach (subBBox => bbox .add (subBBox));
      }

      return [values, bbox];
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DLayerNode} layerNode
    * @param {X3DNode} node
    * @param {boolean} addSelf
    * @returns {Array<Matrix4>}
    */
   static getModelMatrices (executionContext, layerNode, node, addSelf = false)
   {
      node = node .valueOf ();

      const
         hierarchies   = Traverse .find (executionContext, node, Traverse .ROOT_NODES),
         modelMatrices = [ ];

      for (const hierarchy of hierarchies)
      {
         const modelMatrix = new X3D .Matrix4 ();

         for (let object of hierarchy .reverse ())
         {
            if (!(object instanceof X3D .SFNode))
               continue;

            object = object .getValue ();

            if (object .getType () .includes (X3D .X3DConstants .X3DLayerNode))
            {
               if (object !== layerNode)
                  continue;
            }

            if (!object .getType () .includes (X3D .X3DConstants .X3DTransformMatrix3DNode))
               continue;

            if (object .valueOf () === node && !addSelf)
               continue;

            modelMatrix .multRight (object .getMatrix ());
         }

         modelMatrices .push (modelMatrix);
      }

      return modelMatrices;
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {string} path
    * @param {X3DField} value
    * @param {UndoManager} undoManager
    */
   static setNodeMetaData (node, path, value, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const
         hasValue = node .hasMetaData (path),
         oldValue = node .getMetaData (path, value .create ());

      undoManager .beginUndo (_("Change Metadata of Node %s"), node .getTypeName ());

      node .setMetaData (path, value);

      undoManager .registerUndo (() =>
      {
         if (hasValue)
            this .setNodeMetaData (node, path, oldValue, undoManager);
         else
            this .removeNodeMetaData (node, path, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {string} path
    * @param {X3DField} type
    * @param {UndoManager} undoManager
    */
   static removeNodeMetaData (node, path, type, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const hasValue = node .hasMetaData (path);

      if (!hasValue)
         return;

      const oldValue = node .getMetaData (path, type .create ());

      undoManager .beginUndo (_("Change Metadata of Node %s"), node .getTypeName ());

      node .removeMetaData (path);

      undoManager .registerUndo (() =>
      {
         this .setNodeMetaData (node, path, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} original
    * @param {X3DNode} replacement
    * @param {UndoManager} undoManager
    */
   static replaceAllOccurrences (executionContext, original, replacement, undoManager = UndoManager .shared)
   {
      original    = original    .valueOf ();
      replacement = replacement .valueOf ();

      undoManager .beginUndo (_("Replace All Occurrences of %s by %s"), original .getTypeName (), replacement .getTypeName ());

      for (const object of executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES))
      {
         const
            node   = object instanceof X3D .SFNode ? object .getValue () : object,
            fields = node instanceof X3D .X3DExecutionContext ? [node .getRootNodes ()] : node .getFields ()

         for (const field of fields)
         {
            switch (field .getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  if (field .getValue () ?.valueOf () === original)
                     this .setFieldValue (executionContext, node, field, replacement, undoManager);

                  break;
               }
               case X3D .X3DConstants .MFNode:
               {
                  if (!field .some (value => value ?.getValue () .valueOf () === original))
                     break;

                  const value = field .map (value => value ?.getValue () .valueOf () === original ? replacement : value);

                  this .setFieldValue (executionContext, node, field, value, undoManager);
                  break;
               }
            }
         }
      }

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {X3DNode} node
    * @param {X3DField} field
    * @param {UndoManager} undoManager
    */
   static resetToDefaultValue (executionContext, node, field, undoManager = UndoManager .shared)
   {
      const fieldDefinition = node .getFieldDefinitions () .get (field .getName ());

      undoManager .beginUndo (_("Reset Field »%s« of Node »%s« to Its Default Value"), field .getName (), node .getTypeName ());

      if (node .canUserDefinedFields () && node .getUserDefinedFields () .has (field .getName ()))
         this .setFieldValue (executionContext, node, field, field .create (), undoManager);
      else
         this .setFieldValue (executionContext, node, field, fieldDefinition .getValue (), undoManager);

      undoManager .endUndo ();
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
      node = node .valueOf ();

      const
         instance  = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name      = field .getName (),
         auxiliary = field .create ();

      auxiliary .setUnit (field .getUnit ());
      auxiliary .fromString (string, executionContext);

      if (auxiliary .equals (field))
      {
         field .addEvent ();
         return;
      }

      const oldValue = field .copy ()

      if (node .getDisplayName ())
         undoManager .beginUndo (_("Change Field »%s« of Node %s »%s«"), field .getName (), node .getTypeName (), node .getDisplayName ());
      else
         undoManager .beginUndo (_("Change Field »%s« of Node %s"), field .getName (), node .getTypeName ());

      field .assign (auxiliary);

      if (node .isDefaultValue (field))
         field .setModificationTime (0);

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
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
      node  = node .valueOf ();
      field = typeof field === "string" ? node .getField (field) : field;

      const
         instance  = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name      = field .getName (),
         auxiliary = field .create ();

      auxiliary .setValue (value);

      if (auxiliary .equals (field))
      {
         field .addEvent ();
         return;
      }

      const oldValue = field .copy ();

      if (node .getDisplayName ())
         undoManager .beginUndo (_("Change Field »%s« of Node %s »%s«"), field .getName (), node .getTypeName (), node .getDisplayName ());
      else
         undoManager .beginUndo (_("Change Field »%s« of Node %s"), field .getName (), node .getTypeName ());

      field .assign (auxiliary);

      if (node .isDefaultValue (field))
         field .setModificationTime (0);

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFNode:
            this .removeNodesFromExecutionContextIfNecessary (executionContext, [oldValue], undoManager);
            break;
         case X3D .X3DConstants .MFNode:
            this .removeNodesFromExecutionContextIfNecessary (executionContext, oldValue, undoManager);
            break;
      }

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
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
      node  = node .valueOf ();
      field = typeof field === "string" ? node .getField (field) : field;

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName (),
         oldValue = field .copy ();

      undoManager .beginUndo (_("Insert Value into %s »%s«"), node .getTypeName (), field .getName ());

      field .splice (index, 0, value);

      if (node .isDefaultValue (field))
         field .setModificationTime (0);

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
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
      node = node .valueOf ();

      undoManager .beginUndo (_("Append Value to %s »%s«"), node .getTypeName (), field .getName ());

      this .insertValueIntoArray (executionContext, node, field, field .length, value, undoManager);

      undoManager .endUndo ();
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
      node  = node .valueOf ();
      field = typeof field === "string" ? node .getField (field) : field;

      const
         instance = node .getType () .includes (X3D .X3DConstants .X3DPrototypeInstance),
         name     = field .getName (),
         oldValue = field .copy ();

      undoManager .beginUndo (_("Remove Value from %s »%s«"), node .getTypeName (), field .getName ());

      this .removeNodesFromExecutionContextIfNecessary (executionContext, field .splice (index, 1), undoManager);

      if (node .isDefaultValue (field))
         field .setModificationTime (0);

      undoManager .registerUndo (() =>
      {
         this .setFieldValue (executionContext, node, instance ? name : field, oldValue, undoManager);
      });

      this .requestUpdateInstances (node, undoManager);

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {MFNode|Array<X3DNode>} nodes
    * @param {UndoManager} undoManager
    */
   static transformToZero (executionContext, nodes, undoManager = UndoManager .shared)
   {
      const modelMatrix = new X3D .Matrix4 ();

      undoManager .beginUndo (_("Transform to Zero"));

      if (nodes instanceof X3D .MFNode)
      {
         this .#transformToZeroFromArray (executionContext, nodes, modelMatrix, new Set (), undoManager);
      }
      else
      {
         for (const node of nodes)
            this .#transformToZeroFromNode (executionContext, node, modelMatrix, new Set (), undoManager);
      }

      undoManager .endUndo ();
   }

   static #transformToZeroFromArray (executionContext, nodes, modelMatrix, seen, undoManager)
   {
      const resetNodes = new Set ([
         X3D .X3DConstants .ScreenGroup,
         X3D .X3DConstants .LayoutGroup,
      ]);

      nodes = Array .from (nodes, n => n ?.getValue ()) .filter (n => n);

      if (nodes .some (n => n .getType () .some (t => resetNodes .has (t))))
         return false;

      return nodes .every (node => this .#transformToZeroFromNode (executionContext, node, modelMatrix, seen, undoManager));
   }

   static #transformToZeroFromNode (executionContext, node, modelMatrix, seen, undoManager)
   {
      if (!node)
         return true;

      if (seen .has (node))
         return true;

      seen .add (node);

      const transformLikeNodes = new Set ([
         X3D .X3DConstants .X3DTransformNode,
         X3D .X3DConstants .HAnimHumanoid,
      ]);

      node        = node .valueOf ();
      modelMatrix = modelMatrix .copy ();

      for (const type of node .getType () .toReversed ())
      {
         switch (type)
         {
            case X3D .X3DConstants .LayerSet:
            {
               this .#transformToZeroFromArray (executionContext, node ._layers, modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .LayoutGroup:
            case X3D .X3DConstants .ScreenGroup:
            {
               return false;
            }
            case X3D .X3DConstants .HAnimHumanoid:
            case X3D .X3DConstants .X3DTransformNode:
            {
               modelMatrix .multLeft (node .getMatrix ());
               continue;
            }
            case X3D .X3DConstants .X3DLayerNode:
            case X3D .X3DConstants .X3DGroupingNode:
            {
               const reset = this .#transformToZeroFromArray (executionContext, node ._children, modelMatrix, seen, undoManager);

               if (!node .getType () .some (type => transformLikeNodes .has (type)))
                  break;

               if (reset)
               {
                  this .setFieldValue (executionContext, node, node ._translation,      new X3D .Vector3 (),        undoManager);
                  this .setFieldValue (executionContext, node, node ._rotation,         new X3D .Rotation4 (),      undoManager);
                  this .setFieldValue (executionContext, node, node ._scale,            new X3D .Vector3 (1, 1, 1), undoManager);
                  this .setFieldValue (executionContext, node, node ._scaleOrientation, new X3D .Rotation4 (),      undoManager);
                  this .setFieldValue (executionContext, node, node ._center,           new X3D .Vector3 (),        undoManager);
               }
               else
               {
                  this .setMatrixWithCenter (node, modelMatrix, node ._center .getValue (), undoManager);
               }

               break;
            }
            case X3D .X3DConstants .X3DShapeNode:
            {
               const geometry = node ._geometry .getValue ();

               this .#transformToZeroFromNode (executionContext, geometry, modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .X3DViewpointNode:
            {
               const rotation = new X3D .Rotation4 ();

               modelMatrix .get (null, rotation);

               const
                  position         = modelMatrix .multVecMatrix (node .getPosition () .copy ()),
                  orientation      = node .getOrientation () .copy () .multRight (rotation),
                  centerOfRotation = node .getCenterOfRotation () .copy (),
                  fieldOfView      = node .getFieldOfView ();

               this .roundToIntegerIfAlmostEqual (position);
               this .roundToIntegerIfAlmostEqual (orientation);

               this .moveViewpoint (node, position, orientation, centerOfRotation, fieldOfView, undoManager);
               break;
            }
            case X3D .X3DConstants .ListenerPointSource:
            {
               const rotation = new X3D .Rotation4 ();

               modelMatrix .get (null, rotation);

               const
                  position    = modelMatrix .multVecMatrix (node ._position .getValue () .copy ()),
                  orientation = node ._orientation .getValue () .copy () .multRight (rotation);

               this .roundToIntegerIfAlmostEqual (position);
               this .roundToIntegerIfAlmostEqual (orientation);

               this .setFieldValue (executionContext, node, node ._position,    position,    undoManager);
               this .setFieldValue (executionContext, node, node ._orientation, orientation, undoManager);
               break;
            }
            case X3D .X3DConstants .X3DLightNode:
            case X3D .X3DConstants .X3DTextureProjectorNode:
            {
               if (node ._location)
               {
                  const location = modelMatrix .multVecMatrix (node ._location .getValue () .copy ());

                  this .roundToIntegerIfAlmostEqual (location);

                  this .setFieldValue (executionContext, node, node ._location, location, undoManager);
               }

               const rotation = new X3D .Rotation4 ();

               modelMatrix .get (null, rotation);

               if (node ._direction)
               {
                  const direction = rotation .multVecRot (node ._direction .getValue () .copy ());

                  this .roundToIntegerIfAlmostEqual (direction);

                  this .setFieldValue (executionContext, node, node ._direction, direction, undoManager);
               }

               if (node ._upVector)
               {
                  const upVector = rotation .multVecRot (node ._upVector .getValue () .copy ());

                  this .roundToIntegerIfAlmostEqual (upVector);

                  this .setFieldValue (executionContext, node, node ._upVector, upVector, undoManager);
               }

               break;
            }
            case X3D .X3DConstants .X3DEnvironmentalSensorNode:
            {
               const matrix = new X3D .Matrix4 () .set (node ._center .getValue (), null, node ._size .getValue ());

               modelMatrix .multLeft (matrix);

               const
                  center = new X3D .Vector3 (),
                  size   = new X3D .Vector3 ();

               modelMatrix .get (center, null, size);

               this .roundToIntegerIfAlmostEqual (center);
               this .roundToIntegerIfAlmostEqual (size);

               this .setFieldValue (executionContext, node, node ._center, center, undoManager);
               this .setFieldValue (executionContext, node, node ._size,   size,   undoManager);
               break;
            }
            case X3D .X3DConstants .IndexedLineSet:
            case X3D .X3DConstants .LineSet:
            case X3D .X3DConstants .PointSet:
            case X3D .X3DConstants .X3DComposedGeometryNode:
            {
               const
                  normal = node ._normal .getValue (),
                  coord  = node ._coord .getValue ();

               this .#transformToZeroFromNode (executionContext, normal, modelMatrix, seen, undoManager);
               this .#transformToZeroFromNode (executionContext, coord,  modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .Extrusion:
            {
               const value = node ._spine
                  .map (s => this .roundToIntegerIfAlmostEqual (modelMatrix .multVecMatrix (s .getValue () .copy ())));

               this .setFieldValue (executionContext, node, node ._spine, value, undoManager);
               break;
            }
            case X3D .X3DConstants .NurbsCurve:
            case X3D .X3DConstants .X3DNurbsSurfaceGeometryNode:
            {
               const controlPoint = node ._controlPoint .getValue ();

               this .#transformToZeroFromNode (executionContext, controlPoint, modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .NurbsSweptSurface:
            case X3D .X3DConstants .NurbsSwungSurface:
            {
               const trajectoryCurve = node ._trajectoryCurve .getValue ();

               this .#transformToZeroFromNode (executionContext, trajectoryCurve, modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .Normal:
            {
               const
                  normalMatrix = modelMatrix .submatrix .copy () .inverse () .transpose (),
                  vector       = node ._vector .map (n => this .roundToIntegerIfAlmostEqual (normalMatrix .multVecMatrix (n .getValue () .copy ()) .normalize ()));

               this .setFieldValue (executionContext, node, node ._vector, vector, undoManager);
               break;
            }
            case X3D .X3DConstants .Coordinate:
            case X3D .X3DConstants .CoordinateDouble:
            {
               const point = node ._point
                  .map (p => this .roundToIntegerIfAlmostEqual (modelMatrix .multVecMatrix (p .getValue () .copy ())));

               this .setFieldValue (executionContext, node, node ._point, point, undoManager);
               break;
            }
            case X3D .X3DConstants .GeoCoordinate:
            {
               const point = node ._point
                  .map (p => node .getCoord (p .getValue (), new X3D .Vector3 ()))
                  .map (p => this .roundToIntegerIfAlmostEqual (modelMatrix .multVecMatrix (p .getValue () .copy ())))
                  .map (p => node .getGeoCoord (p .getValue (), new X3D .Vector3 ()));

               this .setFieldValue (executionContext, node, node ._point, point, undoManager);
               break;
            }
            case X3D .X3DConstants .ParticleSystem:
            {
               this .#transformToZeroFromNode (executionContext, node ._emitter .getValue (), modelMatrix, seen, undoManager);
               break;
            }
            case X3D .X3DConstants .X3DParticleEmitterNode:
            {
               if (node ._position)
               {
                  const position = modelMatrix .multVecMatrix (node ._position .getValue () .copy ());

                  this .setFieldValue (executionContext, node, node ._position, position, undoManager);
               }

               if (node ._direction && !node ._direction .getValue () .equals (X3D .Vector3 .ZERO))
               {
                  const direction = modelMatrix .multDirMatrix (node ._direction .getValue () .copy ()) .normalize ();

                  this .setFieldValue (executionContext, node, node ._direction, direction, undoManager);
               }

               if (node ._surface)
                  this .#transformToZeroFromNode (executionContext, node ._surface .getValue (), modelMatrix, seen, undoManager);

               if (node ._coord)
                  this .#transformToZeroFromNode (executionContext, node ._coord .getValue (), modelMatrix, seen, undoManager);

               break;
            }
            default:
               continue;
         }

         break;
      }

      return true;
   }

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {MFNode|Array<X3DNode>} nodes
    * @param {UndoManager} undoManager
    */
   static removeEmptyGroups (executionContext, nodes, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_("Remove Empty Groups"));

      if (nodes instanceof X3D .MFNode)
      {
         this .#removeEmptyGroupsFromArray (executionContext, nodes, undoManager);
      }
      else
      {
         for (const node of nodes)
            this .#removeEmptyGroupsFromNode (node, undoManager);
      }

      undoManager .endUndo ();
   }

   static #removeEmptyGroupsFromArray (node, field, undoManager = UndoManager .shared)
   {
      for (let index = field .length - 1; index >= 0; -- index)
      {
         const value = field [index];

         if (!this .#removeEmptyGroupsFromNode (value ?.getValue (), undoManager))
            continue;

         this .removeValueFromArray (node .getExecutionContext (), node, field, index, undoManager);
      }

      return field .length === 0;
   }

   static #removeEmptyGroupsFromNode (node, undoManager = UndoManager .shared)
   {
      if (!node)
         return true;

      node = node .valueOf ();

      return node .getFields () .every (field =>
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               return !field .getValue ();
            }
            case X3D .X3DConstants .MFNode:
            {
               return this .#removeEmptyGroupsFromArray (node, field, undoManager);
            }
            default:
               return true;
         }
      });
   }

   static #nodesToRemove = new Map ();

   /**
    *
    * @param {X3DExecutionContext} executionContext
    * @param {Array<X3DNode|SFNode>|MFNode} nodes
    * @param {UndoManager} undoManager
    */
   static removeNodesFromExecutionContextIfNecessary (executionContext, nodes, undoManager = UndoManager .shared)
   {
      if (!nodes .length)
         return;

      if (!this .#nodesToRemove .has (executionContext))
         this .#nodesToRemove .set (executionContext, [ ]);

      const nodesToRemove = this .#nodesToRemove .get (executionContext);

      for (const node of nodes .filter (node => node))
         nodesToRemove .push (node .valueOf ());

      if (undoManager .defer ("removeNodesFromExecutionContextIfNecessary"))
         return;

      undoManager .defer ("removeNodesFromExecutionContextIfNecessary", () =>
      {
         for (const [executionContext, nodesToRemove] of this .#nodesToRemove)
         {
            // Add nodes and child nodes.

            const children = new Set ();

            Array .from (Traverse .traverse (nodesToRemove, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY))
            .filter (object => object instanceof X3D .SFNode)
            .forEach (node => children .add (node .getValue () .valueOf ()));

            // Remove nodes still in scene graph.

            Array .from (Traverse .traverse (executionContext, Traverse .ROOT_NODES | Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY))
            .filter (object => object instanceof X3D .SFNode)
            .forEach (node => children .delete (node .getValue () .valueOf ()));

            if (children .size === 0)
               continue;

            undoManager .beginUndo (_("Remove %s Nodes from Execution Context"), children .size);

            for (const node of children)
            {
               // Rebind X3DBindableNode nodes.

               if (node .getType () .includes (X3D .X3DConstants .X3DBindableNode))
               {
                  if (node ._isBound .getValue ())
                  {
                     undoManager .registerUndo (() =>
                     {
                        this .setFieldValue (executionContext, node, node ._set_bind, true, undoManager);
                     });
                  }
               }

               // Remove named nodes.

               if (node .getName ())
                  this .removeNamedNode (executionContext, node, undoManager);

               // Remove routes.

               this .deleteRoutes (executionContext, node, undoManager);

               // Remove imported nodes if node is an Inline node.

               for (const importedNode of Array .from (executionContext .getImportedNodes ()))
               {
                  if (importedNode .getInlineNode () .valueOf () === node)
                     this .removeImportedNode (executionContext, importedNode .getImportedName (), undoManager);
               }

               // Remove exported nodes.

               if (executionContext instanceof X3D .X3DScene)
               {
                  for (const exportedNode of Array .from (executionContext .getExportedNodes ()))
                  {
                     if (exportedNode .getLocalNode () .valueOf () === node)
                        this .removeExportedNode (executionContext, exportedNode .getExportedName (), undoManager);
                  }
               }

               // Clear fields, to get right clone count.

               for (const field of node .getFields ())
               {
                  switch (field .getType ())
                  {
                     case X3D .X3DConstants .SFNode:
                     {
                        this .setFieldValue (executionContext, node, field, null, undoManager);
                        break;
                     }
                     case X3D .X3DConstants .MFNode:
                     {
                        this .setFieldValue (executionContext, node, field, new X3D .MFNode (), undoManager);
                        break;
                     }
                  }
               }

               this .#setLive (node, false, undoManager);
               this .#removeSelection (node, undoManager);
            }

            this .requestUpdateInstances (executionContext, undoManager);

            undoManager .endUndo ();
         }

         this .#nodesToRemove .clear ();
      });
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {boolean} value
    * @param {UndoManager} undoManager
    */
   static #setLive (node, value, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const oldValue = node .isLive ();

      undoManager .beginUndo (_("Set live state to »%s«"), value);

      node .setLive (value);

      undoManager .registerUndo (() =>
      {
         this .#setLive (node, oldValue, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {UndoManager} undoManager
    */
   static #addSelection (node, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const selection = require ("../Application/Selection");

      if (selection .has (node))
         return;

      undoManager .beginUndo (_("Select node"));

      selection .add (node);

      undoManager .registerUndo (() =>
      {
         this .#removeSelection (node, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {X3DBaseNode} node
    * @param {UndoManager} undoManager
    */
   static #removeSelection (node, undoManager = UndoManager .shared)
   {
      node = node .valueOf ();

      const selection = require ("../Application/Selection");

      if (!selection .has (node))
         return;

      undoManager .beginUndo (_("Deselect node"));

      selection .remove (node);

      undoManager .registerUndo (() =>
      {
         this .#addSelection (node, undoManager);
      });

      undoManager .endUndo ();
   }

   /**
    *
    * @param {function} callback
    * @param {UndoManager} undoManager
    */
   static deferFunction (callback, undoManager = UndoManager .shared)
   {
      undoManager .beginUndo (_("Defer Function"));

      undoManager .defer (callback, callback);

      undoManager .registerUndo (() =>
      {
         this .deferFunction (callback, undoManager);
      });

      undoManager .endUndo ();
   }
};
