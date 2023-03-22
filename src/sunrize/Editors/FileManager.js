"use strict"

const
   Interface = require ("../Application/Interface")

module .exports = class FileManager extends Interface
{
   constructor (element)
   {
      super (`Sunrize.FileManager.${element .attr ("id")}.`)

      this .fileManager = element

      this .fileManager .text ("File Manager")

      this .setup ()
   }
}
