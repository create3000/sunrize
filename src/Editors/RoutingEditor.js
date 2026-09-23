
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

      this .editor = element;
      this .left   = $("<div></div>") .addClass ("routing-editor-left") .appendTo (this .editor);

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "routing-toolbar"])
         .appendTo (this .editor);

      this .setup ();
   }

   configure ()
   {
      super .configure ();
   }
};
