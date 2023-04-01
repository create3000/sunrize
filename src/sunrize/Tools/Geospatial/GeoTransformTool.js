"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   GeoTransform         = X3D .require ("x_ite/Components/Geospatial/GeoTransform")

class GeoTransformTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .GREEN
}

Object .assign (GeoTransform .prototype,
{
   addTool: function ()
   {
      return new GeoTransformTool (this)
   },
})
