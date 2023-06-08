"use strict"

const
   X3DNodeTool          = require ("./X3DNodeTool"),
   X3D                  = require ("../../X3D"),
   X3DPrototypeInstance = X3D .require ("x_ite/Components/Core/X3DPrototypeInstance")

class X3DPrototypeInstanceTool extends X3DNodeTool
{
   constructor (node)
   {
      super (node)

      this .toolNode .getInnerNode () .addTool ()
   }

   removeTool ()
   {
      this .toolNode .getInnerNode () .removeTool ()

      return super .removeTool ()
   }

   getInnerNode ()
   {
      return this .toolNode .getInnerNode ()
   }
}

module .exports = X3DPrototypeInstanceTool
