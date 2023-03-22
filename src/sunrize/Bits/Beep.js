"use strict"

const
   $    = require ("jquery"),
   path = require ("path")

/**
 * Play beep sound.
 */
$.beep = function ()
{
   new Audio (path .join (__dirname, "../../audio/Tink.mp3")) .play ()
}
