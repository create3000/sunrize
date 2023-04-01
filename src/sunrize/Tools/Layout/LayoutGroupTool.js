"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   LayoutGroup          = X3D .require ("x_ite/Components/Layout/LayoutGroup"),
   Vector3              = X3D .require ("standard/Math/Numbers/Vector3"),
   Box3                 = X3D .require ("standard/Math/Geometry/Box3")

class LayoutGroupTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .DARK_GREEN
}

Object .assign (LayoutGroupTool .prototype,
{
   initialize: async function ()
   {
      await X3DBoundedObjectTool .prototype .initialize .call (this)

      this .tool .rectangleDisplay = true
   },
   getRectangle: (function ()
   {
      const
         scale           = new Vector3 (0, 0, 0),
         rectangleSize   = new Vector3 (0, 0, 0),
         rectangleCenter = new Vector3 (0, 0, 0)

      return function (rectangle)
      {
         const layoutNode = this .toolNode .getLayout ()

         if (!layoutNode)
            return rectangle .set ()

         this .toolNode .modelViewMatrix .get (null, null, scale)

         rectangleSize   .set (... layoutNode .getRectangleSize (),   0) .divVec (scale)
         rectangleCenter .set (... layoutNode .getRectangleCenter (), 0) .divVec (scale)

         rectangle
            .set (rectangleSize, rectangleCenter)
            .multRight (this .toolNode .getMatrix () .inverse ())

         return rectangle
      }
   })(),
   reshape: (function ()
   {
      const rectangle = new Box3 ()

      return function ()
      {
         X3DBoundedObjectTool .prototype .reshape .call (this)

         this .getRectangle (rectangle)

         if (this .tool .rectangleDisplay !== !rectangle .isEmpty ())
            this .tool .rectangleDisplay = !rectangle .isEmpty ()

         if (!this .tool .rectangleSize .getValue () .equals (rectangle .size))
            this .tool .rectangleSize = rectangle .size

         if (!this .tool .rectangleCenter .getValue () .equals (rectangle .center))
            this .tool .rectangleCenter = rectangle .center
      }
   })(),
})

Object .assign (LayoutGroup .prototype,
{
   createTool: function ()
   {
      return new LayoutGroupTool (this)
   },
})
