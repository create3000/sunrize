
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   util      = require ("util"),
   _         = require ("../Application/GetText");

module .exports = class RoutingEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.RoutingEditor.${element .attr ("id")}.`);

      this .setup ();
   }

   configure ()
   {
      super .configure ();
   }
};
