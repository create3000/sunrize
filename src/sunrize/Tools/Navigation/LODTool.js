"use strict"

const
   X3DBoundedObjectTool = require ("../Grouping/X3DBoundedObjectTool"),
   ToolColors           = require ("../Core/ToolColors"),
   X3D                  = require ("../../X3D"),
   LOD                  = X3D .require ("x_ite/Components/Navigation/LOD")

class LODTool extends X3DBoundedObjectTool
{
   bboxColor = ToolColors .CYAN

   async initialize ()
   {
      await super .initialize ()

      this .toolNode ._center .addFieldInterest (this .tool .center)

      this .tool .centerDisplay = true
      this .tool .center        = this .toolNode ._center
   }

   removeTool ()
   {
      this .toolNode ._center .removeFieldInterest (this .tool .center)

      return super .removeTool ()
   }
}

Object .assign (LOD .prototype,
{
   addTool: function ()
   {
      return new LODTool (this)
   },
})
