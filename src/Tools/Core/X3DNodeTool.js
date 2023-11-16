"use strict"

const
   path     = require ("path"),
   url      = require ("url"),
   X3D      = require ("../../X3D"),
   Traverse = require("../../Application/Traverse")

const
   _tool     = Symbol .for ("Sunrize.tool"),
   _changing = Symbol .for ("Sunrize.changing")

const handler =
{
   get (target, key)
   {
      if (key in target)
         return target [key]

      const property = target .toolNode [key]

      if (typeof property === "function")
         return property .bind (target .toolNode)

      else
         return property
   },
   set (target, key, value)
   {
      if (key in target)
      {
         target [key] = value
         return true
      }

      target .toolNode [key] = value
      return true
   },
   has (target, key)
   {
      return key in target .toolNode
   },
   ownKeys (target)
   {
      return Object .keys (target .toolNode)
   },
   getOwnPropertyDescriptor (target, key)
   {
      return Object .getOwnPropertyDescriptor (target .toolNode, key)
   },
   getPrototypeOf (target)
   {
      return Object .getPrototypeOf (target .toolNode)
   },
}

class X3DNodeTool
{
   static createOnSelection = true
   static createOnDemand    = true

   constructor (node)
   {
      const proxy = new Proxy (this, handler)

      node .setUserData (_tool, proxy)
      node .setUserData (_changing, true)

      this .toolProxy         = proxy
      this .toolNode          = node
      this .toolExternalNodes = new Map ()

      this .replaceNode (node, proxy)
      proxy .setup ()

      return proxy
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof X3D .SFNode)
            parent .setValue (replacement)
      }
   }

   async setup ()
   {
      await this .initialize ()

      if (!this .tool)
         return

      this .toolInnerNode  = this .tool .getValue () .getInnerNode ()
      this .tool .selected = this .toolSelected
   }

   async initialize () { }

   setSelected (value)
   {
      this .toolSelected = value

      if (this .tool ?.selected !== undefined)
         this .tool .selected = value
   }

   async getToolInstance ()
   {
      await this .toolPromise

      return this .tool
   }

   addTool ()
   {
      return this .toolProxy
   }

   removeTool ()
   {
      const nodesToDispose = [ ]

      Traverse .traverse (this .tool, Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES, node => nodesToDispose .push (node))

      for (const node of nodesToDispose)
      {
         if (!this .toolExternalNodes .has (node))
            node .dispose ()
      }

      for (const field of this .toolExternalNodes .values ())
         field .removeInterest ("addExternalNode", this)

      this .toolNode .removeUserData (_tool)
      this .toolNode .setUserData (_changing, true)

      this .replaceNode (this, this .toolNode)

      return this .toolNode
   }

   static scenes = new Map ()

   loadTool (... args)
   {
      const
         protoURL = url .pathToFileURL (path .resolve (... args)),
         promise  = X3DNodeTool .scenes .get (protoURL .href)

      if (promise)
      {
         return this .toolPromise = promise .then (scene => this .tool = this .createTool (scene))
      }
      else
      {
         const promise = new Promise (async (resolve, reject) =>
         {
            try
            {
               const scene = await this .getBrowser () .createX3DFromURL (new X3D .MFString (protoURL))

               scene .setLive (true)

               for (const externproto of scene .externprotos)
                  await externproto .requestImmediateLoad ()

               this .tool = this .createTool (scene)

               resolve (scene)
            }
            catch (error)
            {
               reject (error)
            }
         })

         X3DNodeTool .scenes .set (protoURL .href, promise)

         return this .toolPromise = promise
      }
   }

   createTool (scene)
   {
      const tool = scene .createProto ("Tool")

      tool .getValue () .setPrivate (true)

      return tool
   }

   addExternalNode (field)
   {
      field .addInterest ("addExternalNode", this)

      this .toolExternalNodes .set (field .getValue (), field)
   }

   getInnerNode ()
   {
      return this .toolProxy
   }

   valueOf ()
   {
      return this .toolNode .valueOf ()
   }

   dispose ()
   {
      this .removeTool ()
      this .toolNode .dispose ()
   }
}

module .exports = X3DNodeTool
