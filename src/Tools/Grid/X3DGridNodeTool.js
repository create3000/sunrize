"use strict";

const X3DActiveLayerNodeTool = require ("../Layering/X3DActiveLayerNodeTool");

class X3DGridNodeTool extends X3DActiveLayerNodeTool
{
   constructor (executionContext)
   {
      super (executionContext);
   }
}

module .exports = X3DGridNodeTool;
