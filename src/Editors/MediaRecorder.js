
"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class MediaRecorder extends Interface
{
   constructor (element)
   {
      super (`Sunrize.MediaRecorder.${element .attr ("id")}.`);

      this .recorder = element;

      this .left = $("<div></div>")
         .addClass ("media-recorder-left")
         .appendTo (this .recorder);

      this .recordButton = $("<span></span>")
         .addClass (["material-symbols-outlined", "button"])
         .attr ("title", _("Start recording."))
         .text ("screen_record")
         .appendTo (this .left);

      // Toolbar

      this .toolbar = $("<div></div>")
         .addClass (["toolbar", "vertical-toolbar", "secondary-toolbar", "media-recorder-toolbar"])
         .appendTo (this .recorder);

      this .setup ();
   }
};
