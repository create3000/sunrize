"use strict";

const
   X3DBaseTool = require ("./X3DBaseTool"),
   X3D         = require ("../../X3D"),
   Editor      = require ("../../Undo/Editor"),
   UndoManager = require ("../../Undo/UndoManager"),
   Traverse    = require ("../../Application/Traverse"),
   path        = require ("path"),
   url         = require ("url"),
   _           = require ("../../Application/GetText");

const
   _tool     = Symbol .for ("Sunrize.tool"),
   _changing = Symbol .for ("Sunrize.changing");

const handler =
{
   get (target, key)
   {
      if (key in target)
         return target [key];

      const property = target .node [key];

      if (typeof property === "function")
         return property .bind (target .node);

      else
         return property;
   },
   set (target, key, value)
   {
      if (key in target)
      {
         target [key] = value;
         return true;
      }

      target .node [key] = value;

      return true;
   },
   has (target, key)
   {
      return key in target .node;
   },
   ownKeys (target)
   {
      return Object .keys (target .node);
   },
   getOwnPropertyDescriptor (target, key)
   {
      return Object .getOwnPropertyDescriptor (target .node, key);
   },
   getPrototypeOf (target)
   {
      return Object .getPrototypeOf (target .node);
   },
}

class X3DNodeTool extends X3DBaseTool
{
   static createOnSelection = true;
   static createOnDemand    = true;

   static #scenes  = new Map (); // Loaded tool proto scenes.
   static #tools   = new Set (); // Set of all this tools.
   static #sensors = [ ];        // Always empty

   tool           = null;
   #proxy         = null;
   #selected      = false;
   #promise       = null;
   #innerNode     = null;
   #externalNodes = new Map ();
   #groupedTools  = new Set ();
   #initialValues = new Map ();

   constructor (node)
   {
      const proxy = super (node);

      this .#proxy = proxy;

      node .setUserData (_tool, proxy);
      node .setUserData (_changing, true);

      X3D .SFNodeCache .add (proxy, X3D .SFNodeCache .get (node));

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

      if (!this .tool)
         return;

      this .tool .selected = value;
   }

   // Tool Loading

   async getToolInstance ()
   {
      await this .#promise;

      return this .tool;
   }

   getToolScene ()
   {
      return this .tool .getValue () .getExecutionContext ();
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
      await this .initializeTool ();

      // X3DLayerNodeTool and X3DPrototypeInstanceTool have no own tool.

      if (!this .tool)
         return;

      this .#innerNode     = this .tool .getValue () .getInnerNode ();
      this .tool .selected = this .#selected;
   }

   async initializeTool () { }

   loadTool (... args)
   {
      const
         protoURL = url .pathToFileURL (path .resolve (... args)),
         promise  = X3DNodeTool .#scenes .get (protoURL .href);

      if (promise)
      {
         return this .#promise = promise .then (scene => this .createTool (scene));
      }
      else
      {
         const promise = new Promise (async (resolve, reject) =>
         {
            try
            {
               const scene = await this .getBrowser () .createX3DFromURL (new X3D .MFString (protoURL));

               scene .setLive (true);

               for (const externproto of scene .externprotos)
                  await externproto .requestImmediateLoad ();

               this .createTool (scene);

               resolve (scene);
            }
            catch (error)
            {
               reject (error);
            }
         });

         X3DNodeTool .#scenes .set (protoURL .href, promise);

         return this .#promise = promise;
      }
   }

   createTool (scene)
   {
      this .tool = scene .createProto ("Tool");

      this .tool .getValue () .setPrivate (true);

      X3DNodeTool .#tools .add (this);
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
      this .node .setUserData (_changing, true);

      X3D .SFNodeCache .delete (this .#proxy);

      X3DNodeTool .#tools .delete (this);

      const nodesToDispose = [ ]

      Traverse .traverse (this .tool, Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES, node => nodesToDispose .push (node));

      for (const node of nodesToDispose .filter (node => !this .#externalNodes .has (node)))
         node .dispose ();

      for (const field of this .#externalNodes .values ())
         field .removeInterest ("addExternalNode", this);

      this .replaceNode (this, this .node);

      return this .node;
   }

   disposeTool () { }

   // Undo/Redo Handling

   handleUndo (active)
   {
      if (!this .tool .undo)
         return;

      if (active .getValue ())
         this .prepareUndo ();
      else
         this .finishUndo ()
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

      for (const other of X3DNodeTool .#tools)
      {
         if (other .tool .group === `${this .tool .activeTool}_TOOL`)
            other .tool .grouping = true;
      }

      for (const other of X3DNodeTool .#tools)
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
      for (const other of X3DNodeTool .#tools)
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
         this .#initialValues .set (name, this .getField (name) .copy ());
   }

   undoSetValues ()
   {
      for (const [name, initialValue] of this .#initialValues)
      {
         const value = this .getField (name) .copy ();

         this .getField (name) .assign (initialValue);

         Editor .setFieldValue (this .getExecutionContext (), this .node, this .getField (name), value);
      }

      this .#initialValues .clear ();
   }

   // Traverse

   traverse (type, renderObject = this .node)
   {
      switch (type)
      {
         case X3D .TraverseType .POINTER:
            break;
         default:
            this .node .traverse (type, renderObject);
            break;
      }

      renderObject .getHumanoids () .push (null);
      renderObject .getSensors ()   .push (X3DNodeTool .#sensors);

      this .#innerNode ?.traverse (type, renderObject);

      renderObject .getSensors ()   .pop ();
      renderObject .getHumanoids () .pop ();
   }

   // Destruction

   dispose ()
   {
      this .removeTool ();
      this .node .dispose ();
   }
}

module .exports = X3DNodeTool;
