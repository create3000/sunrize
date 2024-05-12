"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      try
      {
         const tool = this .node .getInnerNode () .addTool ();

         tool .toolPointingEnabled = false;
      }
      catch
      { }
   }

   disposeTool ()
   {
      try
      {
         this .node .getInnerNode () .removeTool ();
      }
      catch
      { }

      super .disposeTool ();
   }

   getInnerNode ()
   {
      return this .node .getInnerNode ();
   }
}

module .exports = X3DPrototypeInstanceTool;
