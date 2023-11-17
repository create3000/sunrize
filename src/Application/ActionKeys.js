"use strict";

const $ = require ("jquery");

module .exports = class ActionKeys
{
   static Shift    = 0b0001;
   static Control  = 0b0010;
   static Alt      = 0b0100;
   static Option   = 0b0100;
   static AltGraph = 0b1000;
   static Command  = 0b1000;

   constructor (id, callback)
   {
      this .id       = id;
      this .callback = callback;
      this .value    = 0;

      $(window)
         .on (`keydown.${id}`, this .onkeydown .bind (this))
         .on (`keyup.${id}`,   this .onkeyup   .bind (this));
   }

   dispose ()
   {
      $(window)
         .off (`keydown.${this .id}`)
         .off (`keyup.${this .id}`);
   }

   onkeydown (event)
   {
      //console .log (event .key)

      const value = this .value;

      switch (event .key)
      {
         case "Shift":
         {
            this .value |= ActionKeys .Shift;
            break;
         }
         case "Control":
         {
            this .value |= ActionKeys .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .value |= ActionKeys .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .value |= ActionKeys .AltGraph;
            break;
         }
      }

      if (this .value === value)
         return;

      this .callback ?.(this .value);
   }

   onkeyup (event)
   {
      //console .log (event .key)

      const value = this .value;

      switch (event .key)
      {
         case "Shift":
         {
            this .value &= ~ActionKeys .Shift;
            break;
         }
         case "Control":
         {
            this .value &= ~ActionKeys .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .value &= ~ActionKeys .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .value &= ~ActionKeys .AltGraph;
            break;
         }
      }

      if (this .value === value)
         return;

      this .callback ?.(this .value);
   }
}
