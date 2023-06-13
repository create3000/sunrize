"use strict"

const X3D = require ("../X3D")

let flags = 1

module .exports = class Traverse
{
   static EXTERNPROTO_DECLARATIONS      = flags <<= 1
   static PROTO_DECLARATIONS            = flags <<= 1
   static ROOT_NODES                    = flags <<= 1
   static IMPORTED_NODES                = flags <<= 1
   static EXTERNPROTO_DECLARATION_SCENE = flags <<= 1
   static PROTO_DECLARATION_BODY        = flags <<= 1
   static PROTOTYPE_INSTANCES           = flags <<= 1
   static INLINE_SCENE                  = flags <<= 1

   /**
    *
    * @param {X3DScene|X3DExecutionContext|MFNode|Array<SFNode>|SFNode} object
    * @param {number} flags
    * @param {Function} callback
    * @returns boolean
    */
   static traverse (object, flags, callback)
   {
      const seen = new Set ()

      if (object instanceof X3D .X3DExecutionContext)
         return this .traverseScene (object, flags, callback, seen)

      if (object instanceof X3D .MFNode || Array .isArray (object))
         return this .traverseNodes (object, flags, callback, seen)

      if (object instanceof X3D .SFNode)
         return this .traverseNode (object .getValue (), flags, callback, seen)

      if (object instanceof X3D .X3DBaseNode)
         return this .traverseNode (object, flags, callback, seen)

      return false
   }

   static traverseScene (executionContext, flags, callback, seen)
   {
      if (!executionContext)
         return true

      if (flags & Traverse .PROTO_DECLARATIONS)
      {
         for (const proto of executionContext .protos)
         {
            if (this .traverseNode (proto, flags, callback, seen) === false)
               return false
         }
      }

      if (flags & Traverse .ROOT_NODES)
      {
         if (this .traverseNodes (executionContext .rootNodes, flags, callback, seen) === false)
            return false
      }

      return callback (executionContext) !== false
   }

   static traverseNodes (nodes, flags, callback, seen)
   {
      for (const node of nodes)
      {
         if (this .traverseNode (node instanceof X3D .SFNode ? node .getValue () : node, flags, callback, seen) === false)
            return false
      }

      return true
   }

   static traverseNode (node, flags, callback, seen)
   {
      if (!node)
         return true

      if (seen .has (node))
         return true

      seen .add (node)

      if (this .traverseFields (node .getUserDefinedFields (), flags, callback, seen) === false)
         return false

      if (this .traverseFields (node .getPredefinedFields (), flags, callback, seen) === false)
         return false

      const type = node .getType ()

      for (let t = type .length - 1; t >= 0; -- t)
      {
         switch (type [t])
         {
            case X3D .X3DConstants .X3DExternProtoDeclaration:
            {
               if (flags & this .EXTERNPROTO_DECLARATION_SCENE)
               {
                  if (this .traverseScene (node .getInternalScene (), flags, callback, seen) === false)
                     return false
               }

               break
            }
            case X3D .X3DConstants .X3DProtoDeclaration:
            {
               if (flags & Traverse .PROTO_DECLARATION_BODY)
               {
                  if (this .traverseScene (node .getBody (), flags, callback, seen) === false)
                     return false
               }

               break
            }
            case X3D .X3DConstants .X3DPrototypeInstance:
            {
               if (flags & Traverse .PROTOTYPE_INSTANCES)
               {
                  if (this .traverseScene (node .getBody (), flags, callback, seen) === false)
                     return false
               }

               break
            }
            case X3D .X3DConstants .Inline:
            {
               if (flags & this .INLINE_SCENE)
               {
                  if (this .traverseScene (node .getInternalScene (), flags, callback, seen) === false)
                     return false
               }

               break
            }
            default:
            {
               continue
            }
         }

         break
      }

      return callback (node) !== false
   }

   static traverseFields (fields, flags, callback, seen)
   {
      for (const field of fields)
      {
         switch (field .getType ())
         {
            case X3D .X3DConstants .SFNode:
            {
               if (this .traverseNode (field .getValue (), flags, callback, seen) === false)
                  return false

               break
            }
            case X3D .X3DConstants .MFNode:
            {
               if (this .traverseNodes (field, flags, callback, seen) === false)
                  return false

               break
            }
         }
      }

      return true
   }

   static find (scene, object, flags)
   {
      const
         hierarchies = [ ],
         hierarchy   = [ ],
         seen        = new Set ()

      this .findInScene (scene, object, flags, hierarchies, hierarchy, seen)

      return hierarchies
   }

   static findInScene (executionContext, object, flags, hierarchies, hierarchy, seen)
   {
      if (!executionContext)
         return

      hierarchy .push (executionContext)

      if (executionContext === object)
      {
         hierarchies .push (hierarchy .slice ())
      }
      else
      {
         if (flags & this .EXTERNPROTO_DECLARATIONS)
         {
            const externprotos = executionContext .getExternProtoDeclarations ()

            for (const externproto of externprotos)
            {
               this .findInNode (externproto, object, flags, hierarchies, hierarchy, seen)
            }
         }

         if (flags & this .PROTO_DECLARATIONS)
         {
            const prototypes = executionContext .getProtoDeclarations ()

            for (const prototype of prototypes)
            {
               this .findInNode (prototype, object, flags, hierarchies, hierarchy, seen)
            }
         }

         if (flags & this .ROOT_NODES)
         {
            const rootNodes = executionContext .getRootNodes ()

            for (const rootNode of rootNodes)
            {
               this .findInNode (rootNode .getValue (), object, flags, hierarchies, hierarchy, seen)
            }
         }

         if (flags & this .IMPORTED_NODES)
         {
            for (const importedNode of executionContext .getImportedNodes ())
            {
               hierarchy .push (importedNode)

               if (importedNode === object)
               {
                  hierarchies .push (hierarchy .slice ())
               }
               else
               {
                  try
                  {
                     const exportedNode = importedNode .getExportedNode ()

                     this .findInNode (exportedNode, object, flags, hierarchies, hierarchy, seen)
                  }
                  catch (error)
                  {
                     //console .log (error .message)
                  }
               }

               hierarchy .pop ()
            }
         }
      }

      hierarchy .pop ()
   }

   static findInNode (node, object, flags, hierarchies, hierarchy, seen)
   {
      if (!node)
         return

      if (seen .has (node))
         return

      seen .add (node)
      hierarchy .push (node)

      if (node === object)
      {
         hierarchies .push (hierarchy .slice ())
      }
      else
      {
         if (!node .getType () .includes (X3D .X3DConstants .X3DExternProtoDeclaration))
         {
            this .findInFields (node .getUserDefinedFields (), object, flags, hierarchies, hierarchy, seen)
            this .findInFields (node .getPredefinedFields (),  object, flags, hierarchies, hierarchy, seen)
         }

         const type = node .getType ()

         for (let t = type .length - 1; t >= 0; -- t)
         {
            switch (type [t])
            {
               case X3D .X3DConstants .X3DExternProtoDeclaration:
               {
                  if (flags & this .EXTERNPROTO_DECLARATION_SCENE)
                     this .findInScene (node .getInternalScene (), object, flags, hierarchies, hierarchy, seen)

                  break
               }
               case X3D .X3DConstants .X3DProtoDeclaration:
               {
                  if (flags & this .PROTO_DECLARATION_BODY)
                     this .findInScene (node .getBody (), object, flags, hierarchies, hierarchy, seen)

                  break
               }
               case X3D .X3DConstants .X3DPrototypeInstance:
               {
                  if (flags & this .PROTOTYPE_INSTANCES)
                     this .findInScene (node .getBody (), object, flags, hierarchies, hierarchy, seen)

                  break
               }
               case X3D .X3DConstants .Inline:
               {
                  if (flags & this .INLINE_SCENE)
                     this .findInScene (node .getInternalScene (), object, flags, hierarchies, hierarchy, seen)

                  break
               }
               default:
                  break
            }
         }
      }

      hierarchy .pop ()
      seen .delete (node)
   }

   static findInFields (fields, object, flags, hierarchies, hierarchy, seen)
   {
      for (const field of fields)
      {
         hierarchy .push (field)

         if (field === object)
         {
            hierarchies .push (hierarchy .slice ())
         }
         else
         {
            switch (field .getType ())
            {
               case X3D .X3DConstants .SFNode:
               {
                  this .findInNode (field .getValue (), object, flags, hierarchies, hierarchy, seen)
                  break
               }
               case X3D .X3DConstants .MFNode:
               {
                  for (const node of field)
                     this .findInNode (node .getValue (), object, flags, hierarchies, hierarchy, seen)

                  break
               }
               default:
                  break
            }
         }

         hierarchy .pop ()
      }
   }
}
