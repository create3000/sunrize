"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   #tool;

   constructor (node)
   {
      super (node)

      node .getBody () .rootNodes .addInterest ("set_toolRootNodes", this);

      this .set_toolRootNodes ();
   }

   set_toolRootNodes ()
   {
      try
      {
         this .#tool = this .node .getInnerNode () .addTool ();

         this .#tool .toolPointingEnabled = false;
      }
      catch
      {
         this .#tool = null;
      }
   }

   disposeTool ()
   {
      try
      {
         this .node .getBody () .rootNodes .removeInterest ("set_toolRootNodes", this);

         this .node .getInnerNode () .removeTool ();
      }
      catch
      { }

      super .disposeTool ();
   }

   getInnerNode ()
   {
      return this .#tool;
   }
}

module .exports = X3DPrototypeInstanceTool;
