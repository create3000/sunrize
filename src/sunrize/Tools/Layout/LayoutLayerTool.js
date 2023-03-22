"use strict"

const
   X3DLayerNodeTool = require ("../Layering/X3DLayerNodeTool"),
   X3D              = require ("../../X3D"),
   LayoutLayer      = X3D .require ("x_ite/Components/Layout/LayoutLayer")

class LayoutLayerTool extends X3DLayerNodeTool { }

Object .assign (LayoutLayer .prototype,
{
   createTool: function ()
   {
      return new LayoutLayerTool (this)
   },
})
