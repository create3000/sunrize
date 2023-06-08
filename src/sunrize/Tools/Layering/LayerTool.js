"use strict"

const
   X3DLayerNodeTool = require ("./X3DLayerNodeTool"),
   X3D              = require ("../../X3D"),
   Layer            = X3D .require ("x_ite/Components/Layering/Layer")

class LayerTool extends X3DLayerNodeTool { }

module .exports = LayerTool
