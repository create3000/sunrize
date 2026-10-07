"use strict";

const X3DNodeTool = require ("./X3DNodeTool");

class X3DImportedNodeInstanceTool extends X3DNodeTool
{
   #tool;

   constructor (node)
   {
      super (node);

      node .typeName_changed .addInterest ("updateTool", this);

      this .updateTool ();
   }

   updateTool ()
   {
      try
      {
         this .#tool = this .node .getInnerNode () .addTool ();

         this .#tool .toolPointing = false;
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
         this .node .typeName_changed .removeInterest ("updateTool", this);

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

module .exports = X3DImportedNodeInstanceTool;
