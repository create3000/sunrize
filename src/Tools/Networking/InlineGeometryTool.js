"use strict";

const X3DGeometryNodeTool = require ("../Rendering/X3DGeometryNodeTool");

class InlineGeometryTool extends X3DGeometryNodeTool
{
   #tool;

   constructor (node)
   {
      super (node)

      node ._loadState .addInterest ("set_toolLoadState", this);

      this .set_toolLoadState ();
   }

   set_toolLoadState ()
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

module .exports = InlineGeometryTool;
