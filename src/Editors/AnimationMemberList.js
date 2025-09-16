"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

module .exports = class AnimationMembersList extends Interface
{
   #nodeList;
   #list;
   #nodes;
   #executionContext;

   constructor (element)
   {
      super ("Sunrize.AnimationMembersList.");

      this .#nodeList = element;
      this .#nodes    = [ ];

      this .#list = $("<ul></ul>")
         .appendTo (this .#nodeList);

      this .setup ();
   }

   configure ()
   {
      this .#executionContext ?.sceneGraph_changed .removeInterest ("set_sceneGraph", this);

      this .#executionContext = this .browser .currentScene;

      this .#executionContext .sceneGraph_changed .addInterest ("set_sceneGraph", this);

      this .set_sceneGraph ();
   }

   set_sceneGraph ()
   {
      this .removeNodes (this .#nodes .filter (node => !node .isLive ()));
   }

   clearNodes ()
   {
      this .removeNodes (this .#nodes);
   }

   addNodes (nodes)
   {
      nodes = nodes .filter (node => !this .#nodes .includes (node));

      for (const node of nodes)
      {
         const
            typeNameElement = $("<span></span>") .addClass ("type-name") .text (node .getTypeName ()),
            nameElement     = $("<span></span>") .addClass ("name") .text (this .getName (node));

         $("<li></li>")
            .attr ("node-id", node .getId ())
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append ($("<span></span>") .addClass ("type-name") .text (node .getTypeName ()))
            .append (document .createTextNode (" "))
            .append ($("<span></span>") .addClass ("name") .text (this .getName (node)))
            .on ("click", () => this .setNode (node))
            .appendTo (this .#list);

         node .typeName_changed .addInterest ("set_typeName", this, typeNameElement, node);
         node .name_changed     .addInterest ("set_name",     this, nameElement,     node);
      }

      this .#nodes .push (... nodes);
   }

   removeNodes (nodes)
   {
      for (const node of nodes)
      {
         this .#list .find (`li[node-id=${node .getId ()}]`) .remove ();

         node .typeName_changed .removeInterest ("set_typeName", this);
         node .name_changed     .removeInterest ("set_name",     this);
      }

      this .#nodes = this .#nodes .filter (node => !nodes .includes (node));
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

   set_typeName (element, node)
   {
      element .text (node .getTypeName ());
   }

   set_name (element, node)
   {
      element .text (this .getName (node));
   }
};
