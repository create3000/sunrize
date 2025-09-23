"use strict";

const
   X3D = require ("../X3D"),
   $   = require ("jquery"),
   _   = require ("../Application/GetText");

require ("./Popover");

$.fn.animationPropertiesPopover = function (editor)
{
   // Create content.

   const content = $("<div></div>");

   $("<span></span>")
      .text (_("Duration (Number of Frames)"))
      .appendTo (content);

   const durationInput = $("<input></input>")
      .attr ("type", "number")
      .attr ("step", 1)
      .attr ("min", 1)
      .attr ("placeholder", _("Enter duration"))
      .val (editor .getDuration ())
      .on ("change input", updateTime)
      .appendTo (content);

   $("<span></span>")
      .text (_("Frame Rate (fps)"))
      .appendTo (content);

   const frameRateInput = $("<input></input>")
      .attr ("type", "number")
      .attr ("step", 1)
      .attr ("min", 1)
      .attr ("placeholder", _("Enter frame rate"))
      .val (editor .getFrameRate ())
      .on ("change input", updateTime)
      .appendTo (content);

   const scaleInput = $("<input></input>")
      .attr ("type", "checkbox")
      .attr ("id", "keyframe-scale")
      .appendTo (content);

   if (editor .config .file .scaleKeyframes ?? true)
      scaleInput .attr ("checked", "");

   const scaleLabel = $("<label></label>")
      .attr ("for", "keyframe-scale")
      .text (_("Scale Keyframes"))
      .appendTo (content);

   const timeText = $("<span></span>")
      .css ("margin-top", "5px")
      .css ("margin-bottom", "5px")
      .appendTo (content);

   const applyButton = $("<button></button>")
      .text (_("Apply"))
      .appendTo (content);

   updateTime ();

   function updateTime ()
   {
      const duration  = parseInt (durationInput .val ())
      const frameRate = parseInt (frameRateInput .val ());

      timeText .text ("Time: " + editor .formatFrames (duration, frameRate));
   }

   // Create tooltip.

   const tooltip = this .popover ({
      position: {
         my: "bottom right",
         at: "top left",
      },
      content: content,
      events: {
         show: (event, api) =>
         {
            applyButton .on ("click", (event) =>
            {
               api .toggle (false);
               editor .resizeAnimation (parseInt (durationInput .val ()), parseInt (frameRateInput .val ()), scaleInput .prop ("checked"));
            })
         },
      },
   });

   return this;
};

