"use strict"

const $ = require ("jquery")

// CSS

const colorScheme = window .matchMedia ("(prefers-color-scheme: dark)")

colorScheme .addEventListener ("change", event => changeColorScheme (event));

changeColorScheme (colorScheme)

function changeColorScheme (event)
{
   $("body")
      .removeClass (["light", "dark"])
      .addClass (event .matches ? "dark" : "light")
}

module .exports = { colorScheme }
