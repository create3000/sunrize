"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   ParticleSystem       = X3D .require ("x_ite/Components/ParticleSystems/ParticleSystem")

class ParticleSystemTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ORANGE
}

Object .assign (ParticleSystem .prototype,
{
   createTool: function ()
   {
      return new ParticleSystemTool (this)
   },
})
