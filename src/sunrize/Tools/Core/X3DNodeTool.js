"use strict"

const
   path    = require ("path"),
   url     = require ("url"),
   X3D     = require ("../../X3D"),
   Fields  = X3D .require ("x_ite/Fields"),
   X3DNode = X3D .require ("x_ite/Components/Core/X3DNode")

const handler =
{
   get: function (target, key)
   {
      if (key in target)
         return target [key]

      return target .node [key];
   },
   set: function (target, key, value)
   {
      if (key in target)
      {
         target [key] = value;
         return true;
      }

      target .node [key] = value;
      return true;
   },
   has: function (target, key)
   {
      return key in target .node;
   },
   ownKeys: function (target)
   {
      return Object .keys (target .node);
   },
   getOwnPropertyDescriptor: function (target, key)
   {
      return Object .getOwnPropertyDescriptor (target .node, key);
   },
};

class X3DNodeTool
{
   constructor (node)
   {
      const proxy = new Proxy (this, handler)

      this .node = node

      this .replaceNode (node, proxy)
      this .setup ()

      return proxy;
   }

   setup ()
   {
      this .initialize ();
   }

   initialize () { }

   static scenes = new Map ()

   async load (... args)
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

         scene .setPrivate (true)
         scene .beginUpdate ()

         this .tool = scene .createProto ("Tool")
      }

      this .innerNode = this .tool .getValue () .getInnerNode ()
   }

   replaceNode (node, replacement)
   {
      for (const parent of new Set (node .getParents ()))
      {
         if (parent instanceof Fields .SFNode)
            parent .setValue (replacement);
      }
   }

   addTool ()
   {
      return this;
   }

   removeTool ()
   {
      this .replaceNode (this, this .node)

      return this .node
   }

   dispose ()
   {
      this .removeTool ();
      this .node .dispose ();
   }
}

Object .assign (X3DNode .prototype,
{
   addTool: function ()
   {
      return this .createTool () ?? this;
   },
   createTool: function ()
   {
      return null;
   },
   removeTool: function () { return this },
})

module .exports = X3DNodeTool
