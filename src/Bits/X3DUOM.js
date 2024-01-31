const
   $    = require ("jquery"),
   fs   = require ("fs"),
   path = require ("path");

module .exports = $($.parseXML (fs .readFileSync (path .join (__dirname, "..", "assets", "x3duom.xml"), "utf-8")));
