"use strict";

const
   path     = require ("path"),
   url      = require ("url"),
   X3D      = require ("../../X3D"),
   Traverse = require("../../Application/Traverse");

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

class X3DNodeTool
{
   static createOnSelection = true;
   static createOnDemand    = true;

   constructor (node)
   {
      const proxy = new Proxy (this, handler);

      node .setUserData (_tool, proxy);
      node .setUserData (_changing, true);

      this .proxy         = proxy;
      this .node          = node;
      this .externalNodes = new Map ();

      this .replaceNode (node, proxy);
      proxy .setup ();

      return proxy;
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof X3D .SFNode)
            parent .setValue (replacement);
      }
   }

   async setup ()
   {
      await this .initialize ();

      if (!this .tool)
         return;

      this .toolInnerNode  = this .tool .getValue () .getInnerNode ();
      this .tool .selected = this .toolSelected;
   }

   async initialize () { }

   setSelected (value)
   {
      this .toolSelected = value;

      if (this .tool ?.selected !== undefined)
         this .tool .selected = value;
   }

   async getToolInstance ()
   {
      await this .toolPromise;

      return this .tool;
   }

   addTool ()
   {
      return this .proxy;
   }

   removeTool (action = "createOnDemand")
   {
      if (!this .constructor [action])
         return this;

      const nodesToDispose = [ ]

      Traverse .traverse (this .tool, Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES, node => nodesToDispose .push (node));

      for (const node of nodesToDispose .filter (node => !this .externalNodes .has (node)))
         node .dispose ();

      for (const field of this .externalNodes .values ())
         field .removeInterest ("addExternalNode", this);

      this .node .removeUserData (_tool);
      this .node .setUserData (_changing, true);

      this .replaceNode (this, this .node);

      return this .node;
   }

   static scenes = new Map ();

   loadTool (... args)
   {
      const
         protoURL = url .pathToFileURL (path .resolve (... args)),
         promise  = X3DNodeTool .scenes .get (protoURL .href);

      if (promise)
      {
         return this .toolPromise = promise .then (scene => this .tool = this .createTool (scene));
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

               this .tool = this .createTool (scene);

               resolve (scene);
            }
            catch (error)
            {
               reject (error);
            }
         });

         X3DNodeTool .scenes .set (protoURL .href, promise);

         return this .toolPromise = promise;
      }
   }

   createTool (scene)
   {
      const tool = scene .createProto ("Tool");

      tool .getValue () .setPrivate (true);

      return tool;
   }

   addExternalNode (field)
   {
      field .addInterest ("addExternalNode", this);

      this .externalNodes .set (field .getValue (), field);
   }

   getInnerNode ()
   {
      return this .proxy;
   }

   valueOf ()
   {
      return this .node .valueOf ();
   }

   dispose ()
   {
      this .removeTool ();
      this .node .dispose ();
   }
}

module .exports = X3DNodeTool;
