const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane");

module .exports = new class Panel
{
   constructor ()
   {
      this .pane      = new TweakPane .Pane ({ title: "Transform" });
      this .container = $(this .pane .element) .parent ();
      this .visible   = false;

      this .container .hide () .appendTo ($("#browser-frame"));

      this .container .css ({
         "bottom": this .container .css ("top"),
         "top": "unset",
         "z-index": "1000",
      });

      const parameter = {
         translation: { x: 0, y: 0, z: 0 },
         rotation: { x: 0, y: 0, z: 1, w: 0 },
         scale: { x: 0, y: 0, z: 0 },
      };

      this .pane .addInput (parameter, "translation")
         .on ("change", ({ value }) => console .log (value .x, value .y, value .z));
      this .pane .addInput (parameter, "rotation");
      this .pane .addInput (parameter, "scale");
   }

   show ()
   {
      this .visible = true;

      this .container .fadeIn (300);
   }

   hide ()
   {
      this .visible = false;

      this .container .fadeOut (300);
   }
};
