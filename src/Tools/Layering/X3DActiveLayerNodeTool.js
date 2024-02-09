"use strict";

const X3DNodeTool = require ("../Core/X3DNodeTool");

class X3DActiveLayerNodeTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node);
   }

   disposeTool ()
   {
      super .disposeTool ();
   }
}

module .exports = X3DActiveLayerNodeTool;
