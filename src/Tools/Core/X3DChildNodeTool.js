"use strict";

const
   X3DNodeTool = require ("./X3DNodeTool"),
   X3D         = require ("../../X3D");

class X3DChildNodeTool extends X3DNodeTool
{
   isPointingObject ()
   {
      return true;
   }

   isVisibleObject ()
   {
      return true;
   }

   isNodeTraversable (type)
   {
      if (!this .node .isVisible ())
         return false;

      switch (type)
      {
         case X3D .TraverseType .POINTER:
            return this .node .isPointingObject ();

         case X3D .TraverseType .CAMERA:
            return this .node .isCameraObject ();

         case X3D .TraverseType .PICKING:
            return this .node .isPickableObject ();

         case X3D .TraverseType .COLLISION:
            return this .node .isCollisionObject ();

         case X3D .TraverseType .SHADOW:
            return this .node .isShadowObject ();

         case X3D .TraverseType .DISPLAY:
            return this .node .isVisibleObject ();
      }
   }
}

module .exports = X3DChildNodeTool;
