"use strict"

const
   X3DBoundedObjectTool = require ("./X3DBoundedObjectTool"),
   X3D                  = require ("../../X3D")

class X3DTransformNodeTool extends X3DBoundedObjectTool
{
   async initialize ()
   {
      await super .initialize ()

      this .tool .translationHandles = true
      this .tool .rotationHandles    = true
      this .tool .scaleHandles       = true
   }
}

module .exports = X3DTransformNodeTool
