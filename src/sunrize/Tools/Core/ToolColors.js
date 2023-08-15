"use strict"

const X3D = require ("../../X3D")

module .exports = class ToolColors
{
   static GREEN  = new X3D .Color3 (0.35, 1, 0.7)           // Transform
   static YELLOW = new X3D .Color3 (1, 1, 0.35)             // Switch
   static LILA   = new X3D .Color3 (0.7, 0.35, 1)           // Anchor
   static PINK   = new X3D .Color3 (1, 0.35, 0.7)           // Billboard
   static VIOLET = new X3D .Color3 (0.5, 0.175, 0.35)       //
   static RED    = new X3D .Color3 (1, 0.35, 0.35)          // Collision
   static CYAN   = new X3D .Color3 (0.35, 1, 1)             // LOD

   static WHITE  = new X3D .Color3 (1, 1, 1)                // Inline
   static ORANGE = new X3D .Color3 (1, 0.7, 0.35)           // Shape
   static BLUE   = new X3D .Color3 (0.7, 0.85, 1)           // Normals, Edges, Other
   static LIME   = new X3D .Color3 (0.35, 1, 0.35)          // ScreenGroup
   static ROSE   = new X3D .Color3 (1, 0.7, 0.7)            // PickableGroup

   static DARK_GREEN  = new X3D .Color3 (0.175, 0.5, 0.35)  // Group, CADAssembly
   static DARK_YELLOW = new X3D .Color3 (0.7, 0.7, 0.35)    // CADLayer
   static BROWN       = new X3D .Color3 (0.5, 0.35, 0)      // CADFace
   static DARK_CYAN   = new X3D .Color3 (0.175, 0.5, 0.5)   // GeoLOD
   static DARK_BLUE   = new X3D .Color3 (0.35, 0.35, 1)     //
   static DARK_RED    = new X3D .Color3 (0.5, 0.175, 0.175) //
   static DARK_ORANGE = new X3D .Color3 (0.5, 0.35, 0.175)  // VolumeData

   static GREY      = new X3D .Color3 (0.7, 0.7, 0.7)       //
   static DARK_GREY = new X3D .Color3 (0.35, 0.35, 0.35)    // StaticGroup

   static PROXIMITY_SENSOR  = new X3D .Color3 (0.5, 0, 1)
   static TRANSFORM_SENSOR  = new X3D .Color3 (0, 1, 0)
   static VISIBILITY_SENSOR = new X3D .Color3 (1, 0, 0)
}
