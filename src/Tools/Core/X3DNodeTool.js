"use strict"

const
   path     = require ("path"),
   url      = require ("url"),
   fs       = require ("fs"),
   Traverse = require("../../Application/Traverse"),
   X3D      = require ("../../X3D")

const
   _tool     = Symbol (),
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
      return Object .getPrototypeOf (target .toolNode);
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

      this .toolProxy = proxy
      this .toolNode  = node

      this .replaceNode (node, proxy)
      proxy .setup ()

      return proxy
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

   addTool ()
   {
      return this .toolProxy
   }

   removeTool ()
   {
      Traverse .traverse (this .tool, Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES, node => node .dispose ())

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
         return promise .then (scene => this .tool = scene .createProto ("Tool"))
      }
      else
      {
         const promise = new Promise (async (resolve, reject) =>
         {
            try
            {
               const scene = await this .toolNode .getBrowser () .createX3DFromURL (new X3D .MFString (protoURL))

               scene .setLive (true)

               for (const externproto of scene .externprotos)
                  await externproto .requestImmediateLoad ()

               this .tool = scene .createProto ("Tool")

               resolve (scene)
            }
            catch (error)
            {
               reject (error)
            }
         })

         X3DNodeTool .scenes .set (protoURL .href, promise)

         return promise
      }
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof X3D .SFNode)
            parent .setValue (replacement)
      }
   }

   setSelected (value)
   {
      this .toolSelected = value

      if (this .tool ?.selected !== undefined)
         this .tool .selected = value
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

Object .assign (X3D .X3DNode .prototype,
{
   getTool ()
   {
      return this .getUserData (_tool)
   },
   addTool (action = "createOnDemand")
   {
      const module = path .resolve (__dirname, "..", this .constructor .componentName, this .constructor .typeName + "Tool.js")

      if (!fs .existsSync (module))
         return this

      const Tool = require (module)

      if (!Tool [action])
         return this

      return new Tool (this)
   },
   removeTool ()
   {
      return this
   },
})

module .exports = X3DNodeTool
