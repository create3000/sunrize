"use strict"

module .exports = [
   {
      componentName: "EnvironmentalEffects",
      typeName: "Background Gray",
      x3dSyntax: `
DEF Gray Background {
   skyColor [0.2 0.2 0.2]
}
`
   },
   {
      componentName: "EnvironmentalEffects",
      typeName: "Background Summer",
      x3dSyntax: `
DEF Summer Background {
   skyAngle [
      0.8,
      1.3,
      1.4,
      1.5708
   ]
   skyColor [
      0.21 0.31 0.59,
      0.33 0.45 0.7,
      0.57 0.66 0.85,
      0.6 0.73 0.89,
      0.7 0.83 0.98
   ]
   groundAngle [
      0.659972,
      1.2,
      1.39912,
      1.5708
   ]
   groundColor [
      0.105712 0.156051 0.297,
      0.187629 0.255857 0.398,
      0.33604 0.405546 0.542,
      0.3612 0.469145 0.602,
      0.39471 0.522059 0.669
   ]
   }`
   },
   {
      componentName: "EnvironmentalEffects",
      typeName: "Background Sunny",
      x3dSyntax: `
DEF Sunny Background {
   skyAngle [
      0.05,
      0.1,
      1,
      1.5708
   ]
   skyColor [
      1 1 0,
      1 1 0.5,
      0.125 0.125 0.5,
      0.3 0.3 0.55,
      0.64 0.734 0.844
   ]
   groundAngle 1.5708
   groundColor [
      0.1 0.1 0.09,
      0.48 0.48 0.45
   ]
}
`
   },
   {
      componentName: "EnvironmentalEffects",
      typeName: "Background White",
      x3dSyntax: `
DEF White Background {
   skyColor [1 1 1]
}
`
   },
   {
      componentName: "EnvironmentalSensor",
      typeName: "ProximitySensor",
      x3dSyntax: `
DEF ProximitySensor Transform {
   children ProximitySensor {
      size 1 1 1
   }
}
`
   },
   {
      componentName: "EnvironmentalSensor",
      typeName: "TransformSensor",
      x3dSyntax: `
DEF TransformSensor Transform {
   children TransformSensor {
      size 1 1 1
   }
}
`
   },
   {
      componentName: "EnvironmentalSensor",
      typeName: "VisibilitySensor",
      x3dSyntax: `
DEF VisibilitySensor Transform {
   children VisibilitySensor {
      size 1 1 1
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Arc2D",
      x3dSyntax: `
DEF Arc2D Transform {
   children Shape {
      appearance Appearance {
         material Material {
            emissiveColor 1 1 1
         }
      }
      geometry Arc2D { }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "ArcClose2D",
      x3dSyntax: `
DEF ArcClose2D Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry ArcClose2D { }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Circle2D",
      x3dSyntax: `
DEF Circle2D Transform {
   children Shape {
      appearance Appearance {
         material Material {
            emissiveColor 1 1 1
         }
      }
      geometry Circle2D { }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Disk2D",
      x3dSyntax: `
DEF Disk2D Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Disk2D { }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Polyline2D",
      x3dSyntax: `
DEF Polyline2D Transform {
   children Shape {
      appearance Appearance {
         material Material {
            emissiveColor 1 1 1
         }
      }
      geometry Polyline2D {
         lineSegments [
            0.0 0.0,
            1.0 1.0,
            2.0 0.0,
            3.0 2.0,
            4.0 0.0
         ]
      }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Polypoint2D",
      x3dSyntax: `
DEF Polypoint2D Transform {
   children Shape {
      appearance Appearance {
         material Material {
            emissiveColor 1 1 1
         }
      }
      geometry Polypoint2D {
         point [
            0.0 0.0,
            1.0 1.0,
            2.0 0.0,
            3.0 2.0,
            4.0 0.0
         ]
      }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "Rectangle2D",
      x3dSyntax: `
DEF Rectangle2D Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Rectangle2D { }
   }
}
`
   },
   {
      componentName: "Geometry2D",
      typeName: "TriangleSet2D",
      x3dSyntax: `
DEF TriangleSet2D Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry TriangleSet2D {
         vertices [
            0.0 0.0,
            2.0 0.0,
            1.0 1.0,
            2.0 0.0,
            4.0 0.0
            3.0 2.0,
         ]
      }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "Box",
      x3dSyntax: `
DEF Box Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Box { }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "Cone",
      x3dSyntax: `
DEF Cone Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Cone { }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "Cylinder",
      x3dSyntax: `
DEF Cylinder Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Cylinder { }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "ElevationGrid",
      x3dSyntax: `
DEF ElevationGrid Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry ElevationGrid {
         xDimension 10
         zDimension 10
      }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "Extrusion",
      x3dSyntax: `
DEF Extrusion Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Extrusion { }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "IndexedFaceSet",
      x3dSyntax: `
DEF IndexedFaceSet Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry IndexedFaceSet { }
   }
}
`
   },
   {
      componentName: "Geometry3D",
      typeName: "Sphere",
      x3dSyntax: `
DEF Sphere Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Sphere { }
   }
}
`
   },
   {
      componentName: "Text",
      typeName: "Text",
      x3dSyntax: `
DEF Text Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Text {
         string "3D Text"
      }
   }
}
`
   },
   {
      componentName: "Rendering",
      typeName: "IndexedLineSet",
      x3dSyntax: `
DEF IndexedLineSet Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial { }
      }
      geometry IndexedLineSet {
         coordIndex [
            0,
            1,
            2,
            3,
            0,
            -1,
            4,
            5,
            6,
            7,
            4,
            -1,
            0,
            4,
            -1,
            1,
            5,
            -1,
            2,
            6,
            -1,
            3,
            7,
            -1
         ]
         coord Coordinate {
            point [
               1 1 1,
               -1 1 1,
               -1 -1 1,
               1 -1 1,
               1 1 -1,
               -1 1 -1,
               -1 -1 -1,
               1 -1 -1
            ]
         }
      }
   }
}
`
   },
   {
      componentName: "Rendering",
      typeName: "PointSet",
      x3dSyntax: `
DEF PointSet Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial { }
      }
      geometry PointSet {
         coord Coordinate {
            point [
               1 1 0,
               -1 1 0,
               -1 -1 0,
               1 -1 0
            ]
         }
      }
   }
}
`
   },
]
