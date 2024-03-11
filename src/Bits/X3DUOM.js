const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path");

const X3DUOM = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "x3duom.xml"), "utf-8")));

// emissiveColor fix
X3DUOM .find (`AbstractNodeType[name=X3DOneSidedMaterialNode]`)
   .append (X3DUOM .find ("field[name=emissiveColor]") .first () .clone ());

X3DUOM .find (`AbstractNodeType[name=X3DShapeNode]`)
   .append ($("<field></field>")
      .attr ("name", "pointerEvents")
      .attr ("type", "SFBool")
      .attr ("accessType", "inputOutput")
      .attr ("default", "true"));

module .exports = X3DUOM;
