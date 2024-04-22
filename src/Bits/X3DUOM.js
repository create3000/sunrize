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

X3DUOM .find ("ConcreteNodes")
   .append ($("<ConcreteNode></ConcreteNode>")
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
         .attr ("description", "List of scales, one for each instance.")));

module .exports = X3DUOM;
