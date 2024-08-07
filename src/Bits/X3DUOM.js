const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path"),
   X3D  = require ("../X3D");

const
   X3DUOM = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "X3DUOM.xml"), "utf-8"))),
   X_ITE  = $($.parseXML (fs .readFileSync (X3D .X3DUOM_PATH, "utf-8")));

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

// damping
X3DUOM .find ("ConcreteNode[name=BoundedPhysicsModel]")
   .append ($(X3DUOM [0] .createElement ("field"))
      .attr ("name", "damping")
      .attr ("type", "SFFloat")
      .attr ("accessType", "inputOutput")
      .attr ("default", "1")
      .attr ("minInclusive", "0")
      .attr ("description", "Damping that particles experience in the event of a collision."));

module .exports = X3DUOM;
