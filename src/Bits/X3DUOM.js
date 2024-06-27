const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path");

const
   X3DUOM = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "x3duom.xml"), "utf-8"))),
   X_ITE  = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "x3duom-x_ite.xml"), "utf-8")));

X3DUOM .find ("ConcreteNodes") .append (X_ITE .find ("ConcreteNode"));

// emissiveColor fix
X3DUOM .find ("AbstractNodeType[name=X3DOneSidedMaterialNode]")
   .append (X3DUOM .find ("field[name=emissiveColor]") .first () .clone ());

// pointerEvents
X3DUOM .find ("AbstractNodeType[name=X3DShapeNode]")
   .append ($(X3DUOM [0] .createElement ("field"))
      .attr ("name", "pointerEvents")
      .attr ("type", "SFBool")
      .attr ("accessType", "inputOutput")
      .attr ("default", "true")
      .attr ("description", "pointerEvents defines whether this Shape becomes target for pointer events."));

X3DUOM .find ("ConcreteNode[name=Shape]")
   .append (X3DUOM .find ("field[name=pointerEvents]") .first () .clone ());

X3DUOM .find ("ConcreteNode[name=ParticleSystem]")
   .append (X3DUOM .find ("field[name=pointerEvents]") .first () .clone ());

module .exports = X3DUOM;
