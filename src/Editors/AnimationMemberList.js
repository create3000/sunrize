"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class AnimationMembersList extends Interface
{
   constructor (element)
   {
      super ("Sunrize.AnimationMembersList.");

      this .nodeList = element;
      this .nodes    = [ ];

      this .list = $("<ul></ul>")
         .appendTo (this .nodeList);

      this .setup ();
   }

   configure ()
   {
      this .executionContext ?.sceneGraph_changed .removeInterest ("update", this);

      this .executionContext = this .browser .currentScene;

      this .executionContext .sceneGraph_changed .addInterest ("update", this);

      this .update ();
   }

   update ()
   {
      const
         scrollTop  = this .nodeList .scrollTop (),
         scrollLeft = this .nodeList .scrollLeft ();

      for (const node of this .nodes)
      {
         node .typeName_changed .removeInterest ("set_typeName", this);
         node .name_changed     .removeInterest ("set_name",     this);
      }

      this .list .empty ();

      // this .nodes = this .nodes .filter (node => node .isLive ());

      for (const node of this .nodes)
      {
         const listItem = $("<li></li>")
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append ($("<span></span>") .addClass ("type-name") .text (node .getTypeName ()))
            .append (document .createTextNode (" "))
            .append ($("<span></span>") .addClass ("name") .text (this .getName (node)))
            .on ("click", () => this .setNode (node))
            .appendTo (this .list);

         node .typeName_changed .addInterest ("set_typeName", this, listItem, node);
         node .name_changed     .addInterest ("set_name",     this, listItem, node);
      }

      this .nodeList .scrollTop (scrollTop);
      this .nodeList .scrollLeft (scrollLeft);
   }

   getName (node)
   {
      let
         name      = node .getDisplayName () || _("<unnamed>"),
         outerNode = node .getExecutionContext () .getOuterNode ();

      while (outerNode instanceof X3D .X3DProtoDeclaration)
      {
         name      = outerNode .getName () + "." + name;
         outerNode = outerNode .getExecutionContext () .getOuterNode ();
      }

      return name;
   }

   set_typeName (listItem, node)
   {
      listItem .find (".type-name") .text (node .getTypeName ());
   }

   set_name (listItem, node)
   {
      listItem .find (".name") .text (this .getName (node));
   }

   clearNodes ()
   {
      this .nodes .length = 0;

      this .update ();
   }

   addNodes (nodes)
   {
      this .nodes .push (... nodes .filter (node => !this .nodes .includes (node)));

      this .update ();
   }

   removeNodes (nodes)
   {
      this .nodes = this .nodes .filter (node => !nodes .includes (node));

      this .update ();
   }
};
