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
      },
      style: {
         classes: "qtip-tipsy",
      },
      show: {
         ready: true,
         modal: true,
         solo: true,
         delay: 200,
      },
      events: {
         hide: function (event, api)
         {
            api .destroy (true)
         },
      },
   },
   options))
}
