"use strict"

const X3DNodeTool = require ("../Core/X3DNodeTool")

class X3DLayerNodeTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      this .toolNode .groupNode = this .toolNode .getGroup () .addTool ()
   }

   removeTool ()
   {
      this .toolNode .groupNode = this .toolNode .getGroup () .removeTool ()

      return super .removeTool ()
   }
}

module .exports = X3DLayerNodeTool
