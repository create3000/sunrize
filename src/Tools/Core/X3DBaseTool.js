"use strict";

const handler =
{
   get (target, key)
   {
      if (Reflect .has (target, key))
         return Reflect .get (target, key);

      const property = target .node [key];

      if (typeof property === "function")
         return property .bind (target .node);

      return property;
   },
   set (target, key, value)
   {
      if (Reflect .has (target, key))
         return Reflect .set (target, key, value);

      return Reflect .set (target .node, key, value);
   },
   has (target, key)
   {
      return Reflect .has (target, key)
         || Reflect .has (target .node, key);
   },
   ownKeys (target)
   {
      return Array .from (new Set (Reflect .ownKeys (target)
         .concat (Reflect .ownKeys (target .node))));
   },
   getOwnPropertyDescriptor (target, key)
   {
      return Reflect .getOwnPropertyDescriptor (target, key)
         ?? Reflect .getOwnPropertyDescriptor (target .node, key);
   },
   getPrototypeOf (target)
   {
      return Object .getPrototypeOf (target .node);
   },
};

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
