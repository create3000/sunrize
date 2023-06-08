"use strict"

require ("./Tools/Core")

const components = new Set ([
   "CADGeometry",
   "Grouping",
   "HAnim",
   "Layering",
   "Layout",
   "Navigation",
   "Networking",
   "ParticleSystems",
   "Picking",
   "RigidBodyPhysics",
   "Shape",
   "VolumeRendering",
])

module .exports =
{
   require (componentName)
   {
      if (components .has (componentName))
         require (`./Tools/${componentName}`)
   }
}
