"use strict"

const
   Interface = require ("../Application/Interface")

module .exports = class AnimationEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`)

      this .animationEditor = element

      this .animationEditor .text ("Animation Editor")

      this .setup ()
   }
}
