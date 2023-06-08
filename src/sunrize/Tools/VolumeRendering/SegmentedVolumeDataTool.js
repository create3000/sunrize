"use strict"

const
   X3DVolumeDataNodeTool = require ("./X3DVolumeDataNodeTool"),
   X3D                   = require ("../../X3D"),
   SegmentedVolumeData   = X3D .require ("x_ite/Components/VolumeRendering/SegmentedVolumeData")

class SegmentedVolumeDataTool extends X3DVolumeDataNodeTool { }

module .exports = SegmentedVolumeDataTool
