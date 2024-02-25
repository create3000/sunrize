"use strict";

const $ = require ("jquery");

module .exports = class ActionKeys
{
   static None     = 0;
   static Shift    = 0b0001;
   static Control  = 0b0010;
   static Alt      = 0b0100;
   static Option   = 0b0100;
   static AltGraph = 0b1000;
   static Command  = 0b1000;

   static CommandOrControl = process .platform === "darwin"
      ? this .Command
      : this .Control;

   constructor (id, callback)
   {
      this .id       = id;
      this .callback = callback;
      this .value    = 0;

      this .connect ();
   }

   dispose ()
   {
      this .disconnect ();
   }

   connect ()
   {
      $(window)
         .on (`keydown.${this .id}`, this .onkeydown .bind (this))
         .on (`keyup.${this .id}`,   this .onkeyup   .bind (this));
   }

   disconnect ()
   {
      $(window) .off (`.${this .id}`);
   }

   onkeydown (event)
   {
      // console .log (event .key)

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
