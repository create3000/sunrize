"use strict"

const X3DNodeTool = require ("./X3DNodeTool")

class X3DChildNodeTool extends X3DNodeTool
{
   getMustDisplay ()
   {
      return true
   }

   async initialize (... args)
   {
      await this .loadTool (... args)
   }

   traverse (type, renderObject)
   {
      this .toolNode .traverse (type, renderObject)

      renderObject .getHumanoids () .push (null)

      this .toolInnerNode ?.traverse (type, renderObject)

      renderObject .getHumanoids () .pop ()
   }
}

module .exports = X3DChildNodeTool
