"use strict";

const X3DNodeTool = require ("../Core/X3DNodeTool");

class X3DLayerNodeTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node);

      this .node .groupNode = this .node .getGroup () .addTool ();
   }

   disposeTool ()
   {
      this .node .groupNode = this .node .getGroup () .removeTool ();

      super .disposeTool ();
   }
}

module .exports = X3DLayerNodeTool;
