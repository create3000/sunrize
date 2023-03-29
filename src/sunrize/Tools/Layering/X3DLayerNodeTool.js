"use strict"

const X3DNodeTool = require ("../Core/X3DNodeTool")

class X3DLayerNodeTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      this .node .groupNode = this .node .getGroup () .addTool ()
   }

   removeTool ()
   {
      this .node .groupNode = this .node .getGroup () .removeTool ()

      return super .removeTool ()
   }
}

module .exports = X3DLayerNodeTool
