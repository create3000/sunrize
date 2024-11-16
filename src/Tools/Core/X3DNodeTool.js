"use strict";

const
   X3DBaseTool = require ("./X3DBaseTool"),
   X3D         = require ("../../X3D"),
   Editor      = require ("../../Undo/Editor"),
   UndoManager = require ("../../Undo/UndoManager"),
   Traverse    = require ("x3d-traverse") (X3D),
   path        = require ("path"),
   url         = require ("url"),
   _           = require ("../../Application/GetText");

const _tool = Symbol .for ("Sunrize.tool");

class X3DNodeTool extends X3DBaseTool
{
   static createOnSelection = true;
   static createOnDemand    = true;
   static tools             = new Set (); // Set of all X3DNodeTool tools.

   static #gridNode = null;
   static get gridNode () { return X3DNodeTool .#gridNode; }
   static set gridNode (value) { X3DNodeTool .#gridNode = value; }

   static #snapTarget = false;
   static get snapTarget () { return X3DNodeTool .#snapTarget; }
   static set snapTarget (value) { X3DNodeTool .#snapTarget = value; }

   static #scenes  = new Map (); // Loaded tool proto scenes.
   static #sensors = [ ];        // Always empty

   tool           = null;
   #tools         = new Set ();
   #proxy         = null;
   #selected      = false;
   #promise       = new Map ();
   #innerNodes    = [ ];
   #externalNodes = new Map ();
   #groupedTools  = new Set ();
   #initialValues = new Map ();
   #disposed      = false;

   constructor (node)
   {
      const proxy = super (node);

      this .#proxy = proxy;

      node .setUserData (_tool, proxy);

      X3D .SFNodeCache .set (proxy, X3D .SFNodeCache .get (node));

      this .replaceNode (node, proxy);
      proxy .setupTool ();

      return proxy;
   }

   // Prototype Support

   getInnerNode ()
   {
      return this .#proxy;
   }

   // Selection Handling

   setSelected (value)
   {
      this .#selected = value;

      for (const tool of this .#tools)
      {
         if (!this [tool])
            continue;

         if (this [tool] .hasOwnProperty ("selected"))
            this [tool] .selected = value;
      }
   }

   // Tool Loading

   async getToolInstance (tool = "tool")
   {
      await this .#promise .get (tool);

      return this [tool];
   }

   getToolScene (tool = "tool")
   {
      return this [tool] .getValue () .getExecutionContext ();
   }

   addTool ()
   {
      return this .#proxy;
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof X3D .SFNode)
            parent .setValue (replacement);
      }
   }

   async setupTool ()
   {
      try
      {
         await this .initializeTool ();

         for (const tool of this .#tools)
         {
            // X3DLayerNodeTool and X3DPrototypeInstanceTool have no own tool.

            if (!this [tool])
               continue;

            this .#innerNodes .push (this [tool] .getValue () .getInnerNode ());

            if (this [tool] .hasOwnProperty ("selected"))
               this [tool] .selected = this .#selected;
         }
      }
      catch (error)
      {
         console .error (error);
      }
   }

   initializeTool () { }

   loadTool (tool, ... args)
   {
      const
         filePath  = path .resolve (... args),
         protoName = path .parse (filePath) .name,
         protoURL  = url .pathToFileURL (filePath),
         promise   = X3DNodeTool .#scenes .get (protoURL .href);

      this .#tools .add (tool);

      if (promise)
      {
         this .#promise .set (tool, promise);
      }
      else
      {
         const promise = new Promise (async (resolve, reject) =>
         {
            try
            {
               const scene = await this .getBrowser () .createX3DFromURL (new X3D .MFString (protoURL));

               scene .setExecutionContext (null);
               scene .setCountPrimitives (false);

               for (const externproto of scene .externprotos)
                  await externproto .requestImmediateLoad ();

               resolve (scene);
            }
            catch (error)
            {
               reject (error);
            }
         });

         X3DNodeTool .#scenes .set (protoURL .href, promise);

         this .#promise .set (tool, promise);
      }

      if (this .#disposed)
         return Promise .reject (new Error ("Tool is already disposed."));

      this .#promise .get (tool) .then (scene => this .createTool (tool, scene, protoName));

      return this .#promise .get (tool);
   }

   createTool (tool, scene, protoName)
   {
      this [tool] = scene .createProto (protoName);

      this [tool] .getValue () .setPrivate (true);

      X3DNodeTool .tools .add (this);
      X3DNodeTool .processToolInterests ();
   }

   addExternalNode (field)
   {
      field .addInterest ("addExternalNode", this);

      this .#externalNodes .set (field .getValue (), field);
   }

   removeTool (action = "createOnDemand")
   {
      if (!this .constructor [action])
         return this;

      this .disposeTool ();

      this .node .removeUserData (_tool);

      X3D .SFNodeCache .delete (this .#proxy);

      X3DNodeTool .tools .delete (this);
      X3DNodeTool .processToolInterests ();

      const nodesToDispose = [ ]

      for (const tool of this .#tools)
      {
         for (const node of Traverse .traverse (this [tool], Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES))
         {
            nodesToDispose .push (node instanceof X3D .SFNode ? node .getValue () : node);
         }
      }

      for (const node of nodesToDispose .filter (node => !this .#externalNodes .has (node)))
         node .dispose ();

      for (const field of this .#externalNodes .values ())
         field .removeInterest ("addExternalNode", this);

      this .replaceNode (this, this .node);

      return this .node;
   }

   disposeTool ()
   {
      this .#disposed = true;
   }

   static #interests = new Map ();

   static addToolInterest (key, callback)
   {
      X3DNodeTool .#interests .set (key, callback);
   }

   static removeToolInterest (key)
   {
      X3DNodeTool .#interests .delete (key);
   }

   static processToolInterests ()
   {
      for (const callback of X3DNodeTool .#interests .values ())
         callback ();
   }

   // Undo/Redo Handling

   handleUndo (active)
   {
      // This function is also called in OutlineEditor beginUndoSetFieldValue and endUndoSetFieldValue.

      if (!this .tool .undo)
         return;

      if (active .getValue ())
         this .prepareUndo ();
      else
         this .finishUndo ();
   }

   prepareUndo ()
   {
      // Begin undo.

      const
         typeName    = this .getTypeName (),
         name        = this .getDisplayName (),
         description = this .getUndoDescription (this .tool .activeTool, name);

      UndoManager .shared .beginUndo (description, typeName, name);

      // Prepare undo.

      if (this .beginUndo () === false)
         return;

      this .#groupedTools .add (this);

      if (this .tool .group === "NONE")
         return;

      // Prepare grouping.

      for (const other of X3DNodeTool .tools)
      {
         if (other .tool .group === `${this .tool .activeTool}_TOOL`)
            other .tool .grouping = true;
      }

      for (const other of X3DNodeTool .tools)
      {
         if (other === this)
            continue;

         if (other .tool .group !== this .tool .group)
            continue;

         if (other .beginUndo () === false)
            continue;

         this .#groupedTools .add (other);
      }
   }

   getUndoDescription (activeTool, name)
   {
      switch (activeTool)
      {
         case "TRANSLATE":
         {
            if (name)
               return _("Translate %s »%s«");

            return _("Translate %s");
         }
         case "ROTATE":
         {
            if (name)
               return _("Rotate %s »%s«");

            return _("Rotate %s");
         }
         case "SCALE":
         {
            if (name)
               return _("Scale %s »%s«");

            return _("Scale %s");
         }
         case "CENTER":
         {
            if (name)
               return _("Translate Center of Node %s »%s«");

            return _("Translate Center of Node %s");
         }
         default:
         {
            return `No Undo Description Available For '${activeTool}'`;
         }
      }
   }

   finishUndo ()
   {
      for (const other of X3DNodeTool .tools)
      {
         if (other .tool .grouping)
            other .tool .grouping = false;
      }

      for (const other of this .#groupedTools)
         other .endUndo ();

      this .#groupedTools .clear ();

      UndoManager .shared .endUndo ();
   }

   beginUndo ()
   {
      return false;
   }

   endUndo ()
   {
      this .undoSetValues ();
   }

   undoSaveInitialValues (fields)
   {
      for (const name of fields)
      {
         try
         {
            this .#initialValues .set (name, this .getField (name) .copy ());
         }
         catch
         {
            this .#initialValues .set (name, this .tool .getField (name) .copy ());
         }
      }
   }

   undoSetValues ()
   {
      for (const [name, initialValue] of this .#initialValues)
      {
         try
         {
            const value = this .getField (name) .copy ();

            switch (value .getType ())
            {
               case X3D .X3DConstants .SFRotation:
               case X3D .X3DConstants .SFVec2d:
               case X3D .X3DConstants .SFVec2f:
               case X3D .X3DConstants .SFVec3d:
               case X3D .X3DConstants .SFVec3f:
               case X3D .X3DConstants .SFVec4d:
               case X3D .X3DConstants .SFVec4f:
                  Editor .roundToIntegerIfAlmostEqual (value);
                  break;
            }

            this .getField (name) .assign (initialValue);

            Editor .setFieldValue (this .getExecutionContext (), this .node, this .getField (name), value);
         }
         catch
         {
            const value = this .tool .getField (name) .copy ();

            switch (value .getType ())
            {
               case X3D .X3DConstants .SFRotation:
               case X3D .X3DConstants .SFVec2d:
               case X3D .X3DConstants .SFVec2f:
               case X3D .X3DConstants .SFVec3d:
               case X3D .X3DConstants .SFVec3f:
               case X3D .X3DConstants .SFVec4d:
               case X3D .X3DConstants .SFVec4f:
                  Editor .roundToIntegerIfAlmostEqual (value);
                  break;
            }

            this .setMetaData (`${this .getTypeName ()}/${name}`, initialValue);

            Editor .setNodeMetaData (this .node, `${this .getTypeName ()}/${name}`, value);
         }
      }

      this .#initialValues .clear ();
   }

   // Traverse

   #childBBox = new X3D .Box3 ();

   getToolBBox (bbox, shadows)
   {
      bbox .set ();

      if (shadows)
         return bbox;

      for (const innerNode of this .#innerNodes)
         bbox .add (innerNode .getBBox (this .#childBBox, shadows));

      return bbox;
   }

   toolPointingEnabled = true;

   traverse (type, renderObject = this .node)
   {
      this .node .traverse (type, renderObject);

      switch (type)
      {
         case X3D .TraverseType .POINTER:
         {
            if (this .toolPointingEnabled)
               break;

            return;
         }
      }

      renderObject .getHAnimNode () .push (null);
      renderObject .getSensors ()   .push (X3DNodeTool .#sensors);

      for (const innerNode of this .#innerNodes)
         innerNode ?.traverse (type, renderObject);

      renderObject .getSensors ()   .pop ();
      renderObject .getHAnimNode () .pop ();
   }

   // Destruction

   dispose ()
   {
      this .removeTool ();
      this .node .dispose ();
   }
}

module .exports = X3DNodeTool;
