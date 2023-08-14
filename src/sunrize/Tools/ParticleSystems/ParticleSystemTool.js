"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class ParticleSystemTool extends X3DBoundedObjectTool
{
   toolBBoxColor = ToolColors .ORANGE
}

module .exports = ParticleSystemTool
