"use strict";

const $ = require ("jquery");

module .exports = new class ActionKeys
{
   None     = 0;
   Shift    = 0b0001;
   Control  = 0b0010;
   Alt      = 0b0100;
   Option   = 0b0100;
   AltGraph = 0b1000;
   Command  = 0b1000;

   CommandOrControl = process .platform === "darwin"
      ? this .Command
      : this .Control;

   value = 0;

   constructor ()
   {
      $(window)
         .on ("keydown", this .onkeydown .bind (this))
         .on ("keyup",   this .onkeyup   .bind (this));
   }

   onkeydown (event)
   {
      // console .log (event .key)

      const value = this .value;

      switch (event .key)
      {
         case "Shift":
         {
            this .value |= this .Shift;
            break;
         }
         case "Control":
         {
            this .value |= this .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .value |= this .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .value |= this .AltGraph;
            break;
         }
      }

      if (this .value === value)
         return;

      this .processInterests ();
   }

   onkeyup (event)
   {
      //console .log (event .key)

      const value = this .value;

      switch (event .key)
      {
         case "Shift":
         {
            this .value &= ~this .Shift;
            break;
         }
         case "Control":
         {
            this .value &= ~this .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .value &= ~this .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .value &= ~this .AltGraph;
            break;
         }
      }

      if (this .value === value)
         return;

      this .processInterests ();
   }

   #interests = new Map ();

   addInterest (key, callback)
   {
      this .#interests .set (key, callback);
   }

   removeInterest (key)
   {
      this .#interests .delete (key);
   }

   processInterests ()
   {
      for (const callback of this .#interests .values ())
         callback (this .value);
   }
}
