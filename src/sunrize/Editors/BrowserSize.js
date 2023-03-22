"use strict"

const
   $      = require ("jquery"),
   X3D    = require ("../X3D"),
   Dialog = require ("../Controls/Dialog"),
   _      = require ("../Application/GetText")

module .exports = new class BrowserSize extends Dialog
{
   constructor ()
   {
      super ("Sunrize.BrowserSize.")

      this .setup ()
   }

   initialize ()
   {
      super .initialize ()

      // Add class.

      this .element .addClass ("browser-size")

      this .table         = $("<table></table>") .appendTo (this .element)
      this .table .header = $("<thead></thead>") .appendTo (this .table)
      this .table .body   = $("<tbody></tbody>") .appendTo (this .table)

      $("<tr></tr>")
         .append ($("<th></th>")
            .attr ("colspan", "2")
            .text (_ ("Browser Size")))
         .appendTo (this .table .header)

      this .enabled = $("<input></input>")
         .attr ("id", "browser-size-enabled")
         .attr ("type", "checkbox")
         .on ("change", () => this .onchange ())

      $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<td></td>")
            .append (this .enabled)
            .append ($("<label></label>")
               .attr ("for", "browser-size-enabled")
               .text (_ ("Enabled"))))
         .appendTo (this .table .body)

      this .numerator = $("<input></input>")
         .attr ("type", "number")
         .attr ("step", "1")
         .css ("width", "calc((100% - 20px) / 2)")
         .on ("change", () => this .onchange ())

      const slash = $("<span></span>")
         .css ({ "display": "inline-block", "width": "20px", "text-align": "center" })
         .text ("/")

      this .denominator = $("<input></input>")
          .attr ("type", "number")
          .attr ("step", "1")
          .css ("width", "calc((100% - 20px) / 2)")
          .on ("change", () => this .onchange ())

      $("<tr></tr>")
         .append ($("<th></th>")
            .text (_ ("Aspect Ratio")))
         .append ($("<td></td>")
            .append (this .numerator)
            .append (slash)
            .append (this .denominator))
         .appendTo (this .table .body)
   }

   configure ()
   {
      super .configure ({ size: [400, 100] })

      // Set default config values.

      this .config .file .addDefaultValues ({
         enabled: false,
         numerator: 1,
         denominator: 1,
      })

      this .enabled .prop ("checked", this .config .file .enabled)
      this .numerator .val (this .config .file .numerator)
      this .denominator .val (this .config .file .denominator)
   }

   onchange ()
   {
      this .config .file .enabled     = this .enabled .prop ("checked")
      this .config .file .numerator   = parseFloat (this .numerator .val ())
      this .config .file .denominator = parseFloat (this .denominator .val ())

      require ("../Application/Document") .onresize ()
   }
}
