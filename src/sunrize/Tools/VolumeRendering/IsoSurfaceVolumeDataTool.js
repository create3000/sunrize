"use strict"

const
   X3DVolumeDataNodeTool = require ("./X3DVolumeDataNodeTool"),
   X3D                   = require ("../../X3D"),
   IsoSurfaceVolumeData  = X3D .require ("x_ite/Components/VolumeRendering/IsoSurfaceVolumeData")

class IsoSurfaceVolumeDataTool extends X3DVolumeDataNodeTool { }

Object .assign (IsoSurfaceVolumeData .prototype,
{
   createTool: function ()
   {
      return new IsoSurfaceVolumeDataTool (this)
   },
})
