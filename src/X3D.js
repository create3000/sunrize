"use strict";

/**
 * @type {{ SFBool: SFBool, SFColor: SFColor, }}
 */
const X3D = process .env .SUNRISE_ENVIRONMENT === "DEVELOPMENT" ? require ("../x_ite/x_ite.js") : require ("x_ite");

module .exports = X3D;
