"use strict";

const X3DNodeTool = require ("../Core/X3DNodeTool");

class X3DLayerNodeTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node);

      this .node .getGroups () ._children [0] .getValue () .addTool ();
   }

   disposeTool ()
   {
      this .node .getGroups () ._children [0] .getValue () .removeTool ();

      super .disposeTool ();
   }
}

module .exports = X3DLayerNodeTool;
