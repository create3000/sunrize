"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   Dialog      = require ("../Controls/Dialog"),
   Editor      = require ("../Undo/Editor"),
   UndoManager = require ("../Undo/UndoManager"),
   _           = require ("../Application/GetText");

module .exports = new class BrowserSize extends Dialog
{
   constructor ()
   {
      super ("Sunrize.BrowserSize.");

      this .setup ();
   }

   initialize ()
   {
      super .initialize ();

      // Add class.

      this .element .addClass ("browser-size");

      this .table         = $("<table></table>") .appendTo (this .element);
      this .table .header = $("<thead></thead>") .appendTo (this .table);
      this .table .body   = $("<tbody></tbody>") .appendTo (this .table);

      $("<tr></tr>")
         .append ($("<th></th>")
            .attr ("colspan", "2")
            .text (_("Browser Size")))
         .appendTo (this .table .header);

      this .enabled = $("<input></input>")
         .attr ("id", "browser-size-enabled")
         .attr ("type", "checkbox")
         .on ("change", () => this .onchange ());

      $("<tr></tr>")
         .append ($("<th></th>"))
         .append ($("<td></td>")
            .append (this .enabled)
            .append ($("<label></label>")
               .attr ("for", "browser-size-enabled")
               .text (_("Enabled"))))
         .appendTo (this .table .body);

      this .numerator = $("<input></input>")
         .attr ("type", "number")
         .attr ("step", "1")
         .css ("width", "calc((100% - 20px) / 2)")
         .on ("change", () => this .onchange ());

      const slash = $("<span></span>")
         .css ({ "display": "inline-block", "width": "20px", "text-align": "center" })
         .text ("/");

      this .denominator = $("<input></input>")
          .attr ("type", "number")
          .attr ("step", "1")
          .css ("width", "calc((100% - 20px) / 2)")
          .on ("change", () => this .onchange ());

      $("<tr></tr>")
         .append ($("<th></th>")
            .text (_("Aspect Ratio")))
         .append ($("<td></td>")
            .append (this .numerator)
            .append (slash)
            .append (this .denominator))
         .appendTo (this .table .body);
   }

   configure ()
   {
      super .configure ({ size: [400, 100] });

      this .connect (Editor .getWorldInfo (this .browser .currentScene));
      this .updateInputs ();
   }

   connect (worldInfoNode)
   {
      worldInfoNode ?.addMetaDataCallback (this, "Sunrize/BrowserSize/enabled",     () => this .updateInputs ());
      worldInfoNode ?.addMetaDataCallback (this, "Sunrize/BrowserSize/aspectRatio", () => this .updateInputs ());
   }

   updateInputs ()
   {
      const
         worldInfoNode                    = Editor .getWorldInfo (this .browser .currentScene),
         [enabled = false]                = worldInfoNode ?.getMetaData ("Sunrize/BrowserSize/enabled") ?? [ ],
         [numerator = 1, denominator = 1] = worldInfoNode ?.getMetaData ("Sunrize/BrowserSize/aspectRatio") ?? [ ];

      this .enabled .prop ("checked", enabled);
      this .numerator .val (numerator);
      this .denominator .val (denominator);
   }

   onchange ()
   {
      const
         worldInfoNode = Editor .getWorldInfo (this .browser .currentScene, true),
         enabled       = this .enabled .prop ("checked"),
         numerator     = parseFloat (this .numerator .val ()),
         denominator   = parseFloat (this .denominator .val ());

      this .connect (worldInfoNode);

      UndoManager .shared .beginUndo (_("Change Browser Size"));

      Editor .setNodeMetaData (worldInfoNode, "Sunrize/BrowserSize/enabled",     new X3D .SFBool (enabled));
      Editor .setNodeMetaData (worldInfoNode, "Sunrize/BrowserSize/aspectRatio", new X3D .MFDouble (numerator, denominator));

      UndoManager .shared .endUndo ();

      require ("../Application/Window") .onresize ();
   }
};
