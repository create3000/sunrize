"use strict";

const
   X3DNodeTool = require ("./X3DNodeTool"),
   X3D         = require ("../../X3D");

class X3DChildNodeTool extends X3DNodeTool
{
   getMustDisplay ()
   {
      return true;
   }

   async initializeTool (... args)
   {
      await this .loadTool (... args);
   }

   traverse (type, renderObject)
   {
      switch (type)
      {
         case X3D .TraverseType .POINTER:
            break;
         default:
            this .node .traverse (type, renderObject);
            break;
      }

      renderObject .getHumanoids () .push (null);

      this .toolInnerNode ?.traverse (type, renderObject);

      renderObject .getHumanoids () .pop ();
   }
}

module .exports = X3DChildNodeTool;
