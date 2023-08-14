"use strict"

const
   X3D    = require ("../../X3D"),
   Color3 = X3D .require ("standard/Math/Numbers/Color3")

module .exports = class ToolColors
{
   static GREEN  = new Color3 (0.35, 1, 0.7)           // Transform
   static YELLOW = new Color3 (1, 1, 0.35)             // Switch
   static LILA   = new Color3 (0.7, 0.35, 1)           // Anchor
   static PINK   = new Color3 (1, 0.35, 0.7)           // Billboard
   static VIOLET = new Color3 (0.5, 0.175, 0.35)       //
   static RED    = new Color3 (1, 0.35, 0.35)          // Collision
   static CYAN   = new Color3 (0.35, 1, 1)             // LOD

   static WHITE  = new Color3 (1, 1, 1)                // Inline
   static ORANGE = new Color3 (1, 0.7, 0.35)           // Shape
   static BLUE   = new Color3 (0.7, 0.85, 1)           // Normals, Edges, Other
   static LIME   = new Color3 (0.35, 1, 0.35)          // ScreenGroup
   static ROSE   = new Color3 (1, 0.7, 0.7)            // PickableGroup

   static DARK_GREEN  = new Color3 (0.175, 0.5, 0.35)  // Group, CADAssembly
   static DARK_YELLOW = new Color3 (0.7, 0.7, 0.35)    // CADLayer
   static BROWN       = new Color3 (0.5, 0.35, 0)      // CADFace
   static DARK_CYAN   = new Color3 (0.175, 0.5, 0.5)   // GeoLOD
   static DARK_BLUE   = new Color3 (0.35, 0.35, 1)     //
   static DARK_RED    = new Color3 (0.5, 0.175, 0.175) //
   static DARK_ORANGE = new Color3 (0.5, 0.35, 0.175)  // VolumeData

   static GREY      = new Color3 (0.7, 0.7, 0.7)       //
   static DARK_GREY = new Color3 (0.35, 0.35, 0.35)    // StaticGroup

   static PROXIMITY_SENSOR  = new Color3 (0.5, 0, 1)
   static TRANSFORM_SENSOR  = new Color3 (0, 1, 0)
   static VISIBILITY_SENSOR = new Color3 (1, 0, 0)
}
