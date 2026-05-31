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
      const innerNode = this .node .getInnerNode ();

      if (!innerNode .isVisible ())
         return false;

      switch (type)
      {
         case X3D .TraverseType .POINTER:
            return innerNode .isPointingObject ();

         case X3D .TraverseType .CAMERA:
            return innerNode .isCameraObject ();

         case X3D .TraverseType .PICKING:
            return innerNode .isPickableObject ();

         case X3D .TraverseType .COLLISION:
            return innerNode .isCollisionObject ();

         case X3D .TraverseType .SHADOW:
            return innerNode .isShadowObject ();

         case X3D .TraverseType .DISPLAY:
            return innerNode .isVisibleObject ();
      }
   }
}

module .exports = X3DChildNodeTool;
