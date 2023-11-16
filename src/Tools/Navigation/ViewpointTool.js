"use strict"

const X3DViewpointNodeTool = require ("./X3DViewpointNodeTool")

class ViewpointTool extends X3DViewpointNodeTool
{
   async initialize ()
   {
      await super .initialize ()

      this .node ._position .addFieldInterest (this .tool .getField ("position"))

      this .tool .position = this .node ._position
   }
}

module .exports = ViewpointTool
