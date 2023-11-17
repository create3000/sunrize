"use strict"

const X3DViewpointNodeTool = require ("../Navigation/X3DViewpointNodeTool")

class GeoViewpointTool extends X3DViewpointNodeTool
{
   async initializeTool ()
   {
      await super .initializeTool ()

      this .node ._position .addInterest ("set_node_position__", this)

      this .set_node_position__ ()
   }

   set_node_position__ ()
   {
      this .tool .position = this .node .getPosition ()
   }
}

module .exports = GeoViewpointTool
