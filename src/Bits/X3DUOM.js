const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path"),
   X3D  = require ("../X3D");

const
   X3DUOM = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "X3DUOM.xml"), "utf-8"))),
   X_ITE  = $($.parseXML (fs .readFileSync (X3D .X3DUOM_PATH, "utf-8")));

X3DUOM .find ("AbstractNodeTypes") .append (X_ITE .find ("AbstractNodeTypes"));
X3DUOM .find ("ConcreteNodes") .append (X_ITE .find ("ConcreteNode"));

// emissiveColor fix
X3DUOM .find ("AbstractNodeType[name=X3DOneSidedMaterialNode]")
   .append (X3DUOM .find ("field[name=emissiveColor]") .first () .clone ());

module .exports = X3DUOM;
