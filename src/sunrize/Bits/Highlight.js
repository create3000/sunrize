"use strict"

const $ = require ("jquery")

/**
 * Animate element.
 * @param {string|Array} classes
 * @param {number} duration
 * @returns {JQuery<HTMLElement>}
 */
$.fn.highlight = function (classes = "highlight", duration = 1000)
{
   this .addClass (classes)
   setTimeout (() => this .removeClass (classes), duration)
   return this
}
