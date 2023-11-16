"use strict"

const X3DNodeTool = require ("./X3DNodeTool")

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      this .node .getInnerNode () .addTool ()
   }

   removeTool ()
   {
      this .node .getInnerNode () .removeTool ()

      return super .removeTool ()
   }

   getInnerNode ()
   {
      return this .node .getInnerNode ()
   }
}

module .exports = X3DPrototypeInstanceTool
