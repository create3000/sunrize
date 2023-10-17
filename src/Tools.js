"use strict"

const
   fs   = require ("fs"),
   path = require ("path"),
   X3D  = require ("./X3D")

const _tool = Symbol .for ("Sunrize.tool")

Object .assign (X3D .X3DNode .prototype,
{
   getTool ()
   {
      return this .getUserData (_tool)
   },
   addTool (action = "createOnDemand")
   {
      const module = path .resolve (__dirname, "Tools", this .constructor .componentName, this .constructor .typeName + "Tool.js")

      if (!fs .existsSync (module))
         return this

      const Tool = require (module)

      if (!Tool [action])
         return this

      return this .getUserData (_tool) ?? new Tool (this)
   },
   removeTool ()
   {
      return this .getTool () ?.removeTool ()
   },
})
