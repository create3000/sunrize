const mime = require ("mime-types");

mime .add = function (mimeType, extensions)
{
   this .types [extensions [0]] = mimeType;
   this .extensions [mimeType]  = extensions;
}

mime .add ("image/ktx2",          ["ktx2"]);
mime .add ("x-shader/x-vertex",   ["vs"]);
mime .add ("x-shader/x-fragment", ["fs"]);

module .exports = mime;
