"use strict";

module .exports = [
   {
      componentInfo: { name: "EnvironmentalEffects" },
      typeName: "Background Gray",
      x3dSyntax: `
DEF Gray Background {
   skyColor [0.2 0.2 0.2]
}
`
   },
   {
      componentInfo: { name: "EnvironmentalEffects" },
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
      componentInfo: { name: "EnvironmentalEffects" },
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
      componentInfo: { name: "EnvironmentalEffects" },
      typeName: "Background White",
      x3dSyntax: `
DEF White Background {
   skyColor [1 1 1]
}
`
   },
   {
      componentInfo: { name: "EnvironmentalSensor" },
      typeName: "ProximitySensor",
      x3dSyntax: `
ProximitySensor {
   size 2 2 2
}
`
   },
   {
      componentInfo: { name: "EnvironmentalSensor" },
      typeName: "TransformSensor",
      x3dSyntax: `
TransformSensor {
   size 2 2 2
}
`
   },
   {
      componentInfo: { name: "EnvironmentalSensor" },
      typeName: "VisibilitySensor",
      x3dSyntax: `
VisibilitySensor {
   size 2 2 2
}
`
   },
   {
      componentInfo: { name: "Geometry2D" },
      typeName: "Arc2D",
      x3dSyntax: `
DEF Arc2D Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial {
            emissiveColor 1 1 1
         }
      }
      geometry Arc2D { }
   }
}
`
   },
   {
      componentInfo: { name: "Geometry2D" },
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
      componentInfo: { name: "Geometry2D" },
      typeName: "Circle2D",
      x3dSyntax: `
DEF Circle2D Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial {
            emissiveColor 1 1 1
         }
      }
      geometry Circle2D { }
   }
}
`
   },
   {
      componentInfo: { name: "Geometry2D" },
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
      componentInfo: { name: "Geometry2D" },
      typeName: "Polyline2D",
      x3dSyntax: `
DEF Polyline2D Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial {
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
      componentInfo: { name: "Geometry2D" },
      typeName: "Polypoint2D",
      x3dSyntax: `
DEF Polypoint2D Transform {
   children Shape {
      appearance Appearance {
         material UnlitMaterial {
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
      componentInfo: { name: "Geometry2D" },
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
      componentInfo: { name: "Geometry2D" },
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
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Geometry3D" },
      typeName: "IndexedFaceSet",
      x3dSyntax: `
DEF Pyramid Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry IndexedFaceSet {
         coordIndex [3, 2, 1, 0, -1, 0, 1, 4, -1, 1, 2, 4, -1, 2, 3, 4, -1, 3, 0, 4, -1]
         coord Coordinate {
            point [
               -1 -0.8660254037844386 1,
                1 -0.8660254037844386 1,
                1 -0.8660254037844386 -1,
               -1 -0.8660254037844386 -1,
               0 0.8660254037844386 0
            ]
         }
      }
   }
}
`
   },
   {
      componentInfo: { name: "Geometry3D" },
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
      componentInfo: { name: "Lighting" },
      typeName: "EnvironmentLight",
      x3dSyntax: `
EnvironmentLight {
   diffuseTexture ImageCubeMapTexture {
      url "https://create3000.github.io/Library/Tests/Components/images/helipad-diffuse.jpg"
      textureProperties DEF _1 TextureProperties {
         generateMipMaps TRUE
         minificationFilter "NICEST"
         magnificationFilter "NICEST"
      }
   }
   specularTexture ImageCubeMapTexture {
      url "https://create3000.github.io/Library/Tests/Components/images/helipad-specular.jpg"
      textureProperties USE _1
   }
}
`
   },
   {
      componentInfo: { name: "NURBS" },
      typeName: "NurbsCircle2D",
      x3dSyntax: `
DEF NurbsCircle2D Transform {
  children Shape {
    appearance Appearance {
      material UnlitMaterial { }
    }
    geometry NurbsCurve {
      closed TRUE
      knot [
        0,
        0,
        0,
        0.25,
        0.25,
        0.5,
        0.5,
        0.75,
        0.75,
        1,
        1,
        1
      ]
      weight [
        1,
        0.7071067811865476,
        1,
        0.7071067811865476,
        1,
        0.7071067811865476,
        1,
        0.7071067811865476,
        1
      ]
      controlPoint CoordinateDouble {
        point [
          1 0 0,
          0.7071067811865476 -0.7071067811865476 0,
          0 -1 0,
          -0.7071067811865476 -0.7071067811865476 0,
          -1 0 0,
          -0.7071067811865476 0.7071067811865476 0,
          0 1 0,
          0.7071067811865476 0.7071067811865476 0,
          1 0 0
        ]
      }
    }
  }
}`
   },
   {
      componentInfo: { name: "NURBS" },
      typeName: "NurbsCylinder",
      x3dSyntax: `
DEF NurbsCylinder Transform {
  children Shape {
    appearance Appearance {
      material Material { }
    }
    geometry NurbsPatchSurface {
      solid FALSE
      uClosed TRUE
      vOrder 2
      uDimension 9
      vDimension 2
      uKnot [
        0,
        0,
        0,
        0.25,
        0.25,
        0.5,
        0.5,
        0.75,
        0.75,
        1,
        1,
        1
      ]
      vKnot [
        0,
        0,
        1,
        1
      ]
      weight [
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1,
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1,
        0.707106781186548,
        1
      ]
      controlPoint CoordinateDouble {
        point [
          1 -1 0,
          0.707106781186548 -0.707106781186548 -0.707106781186548,
          0 -1 -1,
          -0.707106781186548 -0.707106781186548 -0.707106781186548,
          -1 -1 0,
          -0.707106781186548 -0.707106781186548 0.707106781186548,
          0 -1 1,
          0.707106781186548 -0.707106781186548 0.707106781186548,
          1 -1 0,
          1 1 0,
          0.707106781186548 0.707106781186548 -0.707106781186548,
          0 1 -1,
          -0.707106781186548 0.707106781186548 -0.707106781186548,
          -1 1 0,
          -0.707106781186548 0.707106781186548 0.707106781186548,
          0 1 1,
          0.707106781186548 0.707106781186548 0.707106781186548,
          1 1 0
        ]
      }
    }
  }
}`
   },
   {
      componentInfo: { name: "NURBS" },
      typeName: "NurbsRectangle2D",
      x3dSyntax: `
DEF NurbsCircle2D Transform {
  children Shape {
    appearance Appearance {
      material UnlitMaterial { }
    }
    geometry NurbsPatchSurface {
      solid FALSE
      uOrder 2
      vOrder 2
      uDimension 2
      vDimension 2
      uKnot [
        -1,
        -1,
        1,
        1
      ]
      vKnot [
        -1,
        -1,
        1,
        1
      ]
      controlPoint CoordinateDouble {
        point [
          -1 -1 0,
          1 -1 0,
          -1 1 0,
          1 1 0
        ]
      }
    }
  }
}`
   },
   {
      componentInfo: { name: "Text" },
      typeName: "Text",
      x3dSyntax: `
DEF Text Transform {
   children Shape {
      appearance Appearance {
         material Material { }
      }
      geometry Text {
         string "3D Text"
         fontStyle FontStyle { }
      }
   }
}
`
   },
   {
      componentInfo: { name: "Rendering" },
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
      componentInfo: { name: "Rendering" },
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
];
