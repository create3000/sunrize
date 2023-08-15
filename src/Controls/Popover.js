"use strict"

const $ = require ("jquery")

require ("qtip2")

$.fn.popover = function (options)
{
   return this .qtip ($.extend (true,
   {
      position: {
         my: "top right",
         at: "bottom left",
         viewport: $("body"),
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
      events: {
         hide (event, api)
         {
            api .destroy (true)
         },
      },
   },
   options))
}
