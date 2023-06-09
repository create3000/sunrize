"use strict"

const
   path     = require ("path"),
   url      = require ("url"),
   fs       = require ("fs"),
   Traverse = require("../../Application/Traverse"),
   X3D      = require ("../../X3D"),
   Fields   = X3D .require ("x_ite/Fields"),
   X3DNode  = X3D .require ("x_ite/Components/Core/X3DNode")

const _changing = Symbol .for ("Sunrize.changing")

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
}

class X3DNodeTool
{
   constructor (node)
   {
      const proxy = new Proxy (this, handler)

      this .toolTarget = this
      this .toolProxy  = proxy
      this .toolNode   = node

      this .toolNode .setUserData (_changing, true)

      this .replaceNode (node, proxy)
      this .setup ()

      return proxy
   }

   setup ()
   {
      this .initialize ()
   }

   initialize () { }

   addTool ()
   {
      return this .toolProxy
   }

   removeTool ()
   {
      Traverse .traverse (this .tool, Traverse .ROOT_NODES | Traverse .INLINE_SCENE | Traverse .PROTOTYPE_INSTANCES, node => node .dispose ())

      this .toolNode .setUserData (_changing, true)

      this .replaceNode (this, this .toolNode)

      return this .toolNode
   }

   static scenes = new Map ()

   async loadTool (... args)
   {
      const
         URL   = url .pathToFileURL (path .resolve (... args)),
         scene = X3DNodeTool .scenes .get (URL .href)

      if (scene)
      {
         this .tool = scene .createProto ("Tool")
      }
      else
      {
         const scene = await X3D .getBrowser ("#browser") .createX3DFromURL (new X3D .MFString (URL))

         X3DNodeTool .scenes .set (URL .href, scene)

         scene .setLive (true)

         this .tool = scene .createProto ("Tool")
      }

      this .toolInnerNode = this .tool .getValue () .getInnerNode ()
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof Fields .SFNode)
            parent .setValue (replacement)
      }
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

Object .assign (X3DNode .prototype,
{
   addTool ()
   {
      const module = path .resolve (__dirname, "..", this .constructor .componentName, this .constructor .typeName + "Tool.js")

      if (fs .existsSync (module))
         return new (require (module)) (this)

      return this
   },
   removeTool ()
   {
      return this
   },
})

module .exports = X3DNodeTool
