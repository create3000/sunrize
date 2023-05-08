"use strict"

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface")

module .exports = class Dialog extends Interface
{
   initialize ()
   {
      // Create window and handle resize and move.

      this .element = $("<div></div>") .dialog ({
         classes: {
            "ui-dialog": "dialog",
         },
         modal: true,
         autoOpen: false,
         show: true,
         draggable: false,
         minHeight : 100,
         open: () =>
         {
            this .element .dialog ("widget")
               .nextAll (".ui-widget-overlay")
               .on ("click", () => this .close ())

            this .onopen ()
         },
         close: () =>
         {
            this .onclose ()
         },
      })

      this .element .dialog ("widget")
         .draggable ({
            drag: (event, ui) => this .config .file .position = { my: `left+${ui .position .left} top+${ui .position .top}`, at: "left top" },
          })
         .resizable({
            resize: (event, ui) => this .config .file .size = [ui .size .width, ui .size .height],
          })
         .find (".ui-dialog-titlebar") .remove ()
   }

   configure (defaults = { })
   {
      // Set default config values.

      this .config .file .addDefaultValues (Object .assign ({
         position: undefined,
         size: [400, 250],
      },
      defaults))
   }

   open ()
   {
      this .element .dialog ({
         position: { ...this .config .file .position, of: $("body") },
         width: this .config .file .size ?.[0],
         height: this .config .file .size ?.[1],
      })
      .dialog ("open")
   }

   close ()
   {
      this .element .dialog ("close")
   }

   onopen () { }
   onclose () { }
}
