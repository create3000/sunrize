
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   util      = require ("util"),
   _         = require ("../Application/GetText");

module .exports = class MediaRecorder extends Interface
{
   constructor (element)
   {
      super (`Sunrize.MediaRecorder.${element .attr ("id")}.`);

      this .recorder = element;

      // Toolbar

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "media-recorder-toolbar"])
         .appendTo (this .recorder);

      this .setup ();
   }
};
