"use strict"

const X3DNodeTool = require ("./X3DNodeTool")

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      this .toolNode .getInnerNode () .addTool ()
   }

   async initialize () { }

   removeTool ()
   {
      this .toolNode .getInnerNode () .removeTool ()

      return super .removeTool ()
   }

   getInnerNode ()
   {
      return this .toolNode .getInnerNode ()
   }
}

module .exports = X3DPrototypeInstanceTool
