"use strict";

const $ = require ("jquery");

require ("qtip2");

$.fn.popover = function (options)
{
   $("[data-hasqtip]") .qtip ?.("hide") .qtip ("destroy", true);

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
