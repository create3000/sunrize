const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path");

const X3DUOM = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "x3duom.xml"), "utf-8")));

// emissiveColor fix
X3DUOM .find ("AbstractNodeType[name=X3DOneSidedMaterialNode]")
   .append (X3DUOM .find ("field[name=emissiveColor]") .first () .clone ());

// pointerEvents
X3DUOM .find ("AbstractNodeType[name=X3DShapeNode]")
   .append ($("<field></field>")
      .attr ("name", "pointerEvents")
      .attr ("type", "SFBool")
      .attr ("accessType", "inputOutput")
      .attr ("default", "true")
      .attr ("description", "pointerEvents defines whether this Shape becomes target for pointer events."));

X3DUOM .find ("ConcreteNode[name=Shape]")
   .append (X3DUOM .find ("field[name=pointerEvents]") .first () .clone ());

X3DUOM .find ("ConcreteNode[name=ParticleSystem]")
   .append (X3DUOM .find ("field[name=pointerEvents]") .first () .clone ());

// InstancedShape
X3DUOM .find ("ConcreteNode[name=Shape]") .clone ()
   .appendTo (X3DUOM .find ("ConcreteNodes"))
   .attr ("name", "InstancedShape")
   .append ($("<field></field>")
      .attr ("name", "translations")
      .attr ("type", "MFVec3f")
      .attr ("accessType", "inputOutput")
      .attr ("description", "List of translations, one for each instance."))
   .append ($("<field></field>")
      .attr ("name", "rotations")
      .attr ("type", "MFRotation")
      .attr ("accessType", "inputOutput")
      .attr ("description", "List of rotations, one for each instance."))
   .append ($("<field></field>")
      .attr ("name", "scales")
      .attr ("type", "MFVec3f")
      .attr ("accessType", "inputOutput")
      .attr ("description", "List of scales, one for each instance."));

// BlendMode
const BlendMode = X3DUOM .find ("ConcreteNode[name=Material]") .clone ();

BlendMode .find ("field:not([name=metadata])") .remove ();

BlendMode .find ("InterfaceDefinition")
   .attr ("specificationUrl", "https://create3000.github.io/x_ite/components/x-ite/blendmode/")
   .attr ("appinfo", "BlendMode controls how pixels of an objects are drawn. Pixels can be drawn using a function that blends the incoming (source) RGBA values with the RGBA values that are already in the frame buffer (the destination values). BlendMode is an X3DAppearanceChildNode node that handles blend operations.");

BlendMode
   .appendTo (X3DUOM .find ("ConcreteNodes"))
   .attr ("name", "BlendMode");

// DepthMode
const DepthMode = X3DUOM .find ("ConcreteNode[name=Material]") .clone ();

DepthMode .find ("field:not([name=metadata])") .remove ();

DepthMode .find ("InterfaceDefinition")
   .attr ("specificationUrl", "https://create3000.github.io/x_ite/components/x-ite/depthmode/")
   .attr ("appinfo", "DepthMode contains parameters that are specific for depth control, like the value used for depth buffer comparisons.");

DepthMode
   .appendTo (X3DUOM .find ("ConcreteNodes"))
   .attr ("name", "DepthMode");

module .exports = X3DUOM;
