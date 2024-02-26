"use strict";

const $ = require ("jquery");

module .exports = new class ActionKeys
{
   get None     () { return 0; }
   get Shift    () { return 0b0001; }
   get Control  () { return 0b0010; }
   get Alt      () { return 0b0100; }
   get Option   () { return 0b0100; }
   get AltGraph () { return 0b1000; }
   get Command  () { return 0b1000; }

   get CommandOrControl ()
   {
      return process .platform === "darwin"
         ? this .Command
         : this .Control;
   }

   get value () { return this .#value; }

   #value = this .None;

   constructor ()
   {
      $(window)
         .on ("keydown", this .onkeydown .bind (this))
         .on ("keyup",   this .onkeyup   .bind (this));
   }

   onkeydown (event)
   {
      // console .log (event .key)

      const value = this .#value;

      switch (event .key)
      {
         case "Shift":
         {
            this .#value |= this .Shift;
            break;
         }
         case "Control":
         {
            this .#value |= this .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .#value |= this .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .#value |= this .AltGraph;
            break;
         }
      }

      if (this .#value === value)
         return;

      this .processInterests ();
   }

   onkeyup (event)
   {
      //console .log (event .key)

      const value = this .#value;

      switch (event .key)
      {
         case "Shift":
         {
            this .#value &= ~this .Shift;
            break;
         }
         case "Control":
         {
            this .#value &= ~this .Control;
            break;
         }
         case "Alt": // Alt/Option
         {
            this .#value &= ~this .Alt;
            break;
         }
         case "Meta": // AltGr/Command
         {
            this .#value &= ~this .AltGraph;
            break;
         }
      }

      if (this .#value === value)
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
         callback (this .#value);
   }
}
