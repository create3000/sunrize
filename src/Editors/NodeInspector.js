"use strict"

const
   Interface = require ("../Application/Interface")

module .exports = class NodeInspector extends Interface
{
   constructor (element)
   {
      super (`Sunrize.NodeInspector.${element .attr ("id")}.`)

      this .nodeInspector = element

      this .nodeInspector .text ("Node Inspector")

      this .setup ()
   }
}
