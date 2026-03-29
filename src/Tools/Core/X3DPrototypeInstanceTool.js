"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      const tool = this .node .getInnerNode () ?.addTool ();

      if (tool)
         tool .toolPointingEnabled = false;
   }

   disposeTool ()
   {
      this .node .getInnerNode () ?.removeTool ();

      super .disposeTool ();
   }

   getInnerNode ()
   {
      return this .node .getInnerNode ();
   }
}

module .exports = X3DPrototypeInstanceTool;
