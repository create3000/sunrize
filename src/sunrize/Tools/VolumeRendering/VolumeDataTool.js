"use strict"

const
   X3DVolumeDataNodeTool = require ("./X3DVolumeDataNodeTool"),
   X3D                   = require ("../../X3D"),
   VolumeData            = X3D .require ("x_ite/Components/VolumeRendering/VolumeData")

class VolumeDataTool extends X3DVolumeDataNodeTool { }

Object .assign (VolumeData .prototype,
{
   createTool: function ()
   {
      return new VolumeDataTool (this)
   },
})
