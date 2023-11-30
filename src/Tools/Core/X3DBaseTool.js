"use strict";

const handler =
{
   get (target, key)
   {
      if (key in target)
         return target [key];

      const property = target .node [key];

      if (typeof property === "function")
         return property .bind (target .node);

      return property;
   },
   set (target, key, value)
   {
      if (key in target)
         target [key] = value;
      else
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

class X3DBaseTool
{
   constructor (node)
   {
      const proxy = new Proxy (this, handler);

      this .node = node;

      return proxy;
   }

   valueOf ()
   {
      return this .node .valueOf ();
   }
}

module .exports = X3DBaseTool;
