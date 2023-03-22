"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   GeoLocation          = X3D .require ("x_ite/Components/Geospatial/GeoLocation")

class GeoLocationTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

Object .assign (GeoLocation .prototype,
{
   createTool: function ()
   {
      return new GeoLocationTool (this)
   },
})
