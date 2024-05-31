"use strict";

const $ = require ("jquery");

require ("qtip2");

$.fn.qtip.zindex = "auto";

$.fn.popover = function (options)
{
   $("[data-hasqtip]") .qtip ?.("hide") .qtip ("destroy", true);

   if (!options .preview)
      $(".show-preview.on") .removeClass ("on") .addClass ("off");

   return this .qtip ($.extend (true,
   {
      position: {
         my: "top right",
         at: "bottom left",
         viewport: $("body"),
         effect: false,
      },
      style: {
         classes: "qtip-tipsy",
      },
      show: {
         ready: true,
         modal: true,
         solo: true,
         delay: 0,
      },
      hide: {
         event: "click",
      },
      events: {
         hide (event, api)
         {
            api .destroy (true);
         },
      },
   },
   options));
};
