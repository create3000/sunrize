"use strict";

const $ = require ("jquery");

/**
 *
 * @param {RegExp} regex
 * @param {Function} error
 * @returns {JQuery<HTMLElement>}
 */
$.fn.validate = function (regex, error)
{
   this .off (".validate");

   let lastValue = this .val ();

   this .on ("keydown.validate", event =>
   {
      if (event .key .length > 1)
         return;

      const
         start = this .prop ("selectionStart"),
         end   = this .prop ("selectionEnd"),
         value = this .val () .substring (0, start) + event .key + this .val () .substring (end);

      if (value .match (regex))
         return;

      event .preventDefault ();

      if (typeof error === "function")
         error .call (this, event);
   })
   .on ("keyup.validate", () =>
   {
      // https://stackoverflow.com/questions/44962941/html-text-input-element-disable-mac-double-space-to-insert-period

      if (this .val () .match (regex))
         return;

      const
         start = this .prop ("selectionStart"),
         end   = this .prop ("selectionEnd");

      this
         .val (lastValue)
         .prop ("selectionStart", start)
         .prop ("selectionEnd", end);
   })
   .on ("change.validate", () =>
   {
      lastValue = this .val ();
   });

   return this;
};
