const
   $         = require ("jquery"),
   TweakPane = require ("tweakpane");

const pane = new TweakPane .Pane ({
   title: "Transform",
});

$("#browser-frame") .append ($(pane .element) .parent ());

const parameter = {
   translation: { x: 0, y: 0, z: 0 },
   rotation: { x: 0, y: 0, z: 1, w: 0 },
   scale: { x: 0, y: 0, z: 0 },
};

pane .addInput (parameter, "translation")
   .on ("change", ({ value }) => console .log (value .x, value .y, value .z));
pane .addInput (parameter, "rotation");
pane .addInput (parameter, "scale");
