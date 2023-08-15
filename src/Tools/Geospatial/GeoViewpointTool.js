"use strict"

const X3DViewpointNodeTool = require ("../Navigation/X3DViewpointNodeTool")

class GeoViewpointTool extends X3DViewpointNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._position .addInterest ("set_node_position__", this)

      this .set_node_position__ ()
   }

   set_node_position__ ()
   {
      this .tool .position = this .toolNode .getPosition ()
   }
}

module .exports = GeoViewpointTool
