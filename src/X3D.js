"use strict";

const path = require ("path");

const X3D = process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT"
   ? require ("../x_ite/x_ite.js")
   : require ("x_ite");

X3D .TYPE_SCRIPT = process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT"
   ? path .resolve (__dirname, "../x_ite/x_ite.d.ts")
   : require .resolve ("x_ite/x_ite.d.ts");

X3D .X3DUOM = process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT"
   ? path .resolve (__dirname, "../x_ite/X3DUOM.xml")
   : require .resolve ("x_ite/X3DUOM.xml");

module .exports = X3D;
