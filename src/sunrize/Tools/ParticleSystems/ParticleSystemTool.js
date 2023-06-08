"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors")

class ParticleSystemTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .ORANGE
}

module .exports = ParticleSystemTool
