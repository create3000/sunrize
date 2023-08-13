"use strict"

const
   $         = require ("jquery"),
   Interface = require ("../Application/Interface")

module .exports = class Tabs extends Interface
{
   constructor (element, orientation)
   {
      super (`Sunrize.Tabs.${element .attr ("id")}.`)

      this .element     = element
      this .orientation = orientation
      this .tabs        = $("<ul></ul>") .appendTo (this .element)
   }

   initialize ()
   {
      this .addTabs ()

      this .element .tabs ()
      this .element .tabs ("option", "classes.ui-tabs", this .orientation)
      this .element .on ("tabsactivate", () => this .tabActivated ())
   }

   addTabs () { }

   configure (defaults = { })
   {
      this .fileConfig .addDefaultValues (Object .assign ({ active: 0 }, defaults))

      if (this .element .tabs ("option", "active") === this .fileConfig .active)
         this .tabActivated ()
      else
         this .element .tabs ("option", "active", this .fileConfig .active)
   }

   tabActivated ()
   {
      const
         active = this .element .tabs ("option", "active"),
         panel  = $(this .element .find (`.tabs-panel`) .get (active))

      this .fileConfig .active = active

      if (panel .data ("Tabs.initialized"))
         return

      panel .data ("Tabs.initialized", true)
      this .initTab (panel)
   }

   addTextTab (id, title)
   {
      const tab = $("<li></li>")
         .append ($("<a></a>")
            .attr ("href", `#${id}-tab`)
            .attr ("title", title)
            .text (title))
         .appendTo (this .tabs)

      this .addPanel (id)
   }

   addIconTab (id, icon, title)
   {
      $("<li></li>")
         .append ($("<a></a>")
            .attr ("href", `#${id}-tab`)
            .attr ("title", title)
            .append ($("<span></span>")
               .addClass ("material-icons")
               .text (icon)))
         .appendTo (this .tabs)

      this .addPanel (id)
   }

   addPanel (id)
   {
      $("<div></div>")
         .attr ("id", `${id}-tab`)
         .append ($("<div></div>")
            .attr ("id", id)
            .addClass (["tabs-panel", id]))
         .appendTo (this .element)
   }

   getPanel (id)
   {
      return this .element .find (`.tabs-panel.${id}`)
   }

   initTab (panel) { }
}
