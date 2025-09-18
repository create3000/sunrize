"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   Traverse  = require ("x3d-traverse") (X3D),
   _         = require ("../Application/GetText");

module .exports = class NodeList extends Interface
{
   constructor (element, filter = () => true, callback = Function .prototype)
   {
      super ("Sunrize.NodeList.");

      this .nodeList         = element;
      this .list             = $("<ul></ul>") .appendTo (this .nodeList);
      this .filter           = filter;
      this .callback         = callback;
      this .executionContext = null;
      this .node             = null;
      this .nodes            = [ ];

      this .setup ();
   }

   configure ()
   {
      this .executionContext ?.sceneGraph_changed .removeInterest ("update", this);

      this .executionContext = this .browser .currentScene;

      this .executionContext .sceneGraph_changed .addInterest ("update", this);

      this .update ();
      this .setNode (this .nodes [this .config .file .index] ?? null, false);
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

      this .nodes = this .getNodes ()
         .filter (this .filter);

      // this .nodes = this .nodes
      //    .sort ((a, b) => Algorithm .cmp (this .getName (a), this .getName (b)))
      //    .sort ((a, b) => Algorithm .cmp (a .getTypeName (), b .getTypeName ()))

      for (const node of this .nodes)
      {
         const
            typeNameElement = $("<span></span>") .addClass ("type-name") .text (node .getTypeName ()),
            nameElement     = $("<span></span>") .addClass ("name") .text (this .getName (node));

         const listItem = $("<li></li>") .appendTo (this .list);

         $("<div></div>")
            .addClass ("item")
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append (typeNameElement)
            .append (document .createTextNode (" "))
            .append (nameElement)
            .on ("click", () => this .setNode (node))
            .appendTo (listItem);

         node .typeName_changed .addInterest ("set_typeName", this, typeNameElement, node);
         node .name_changed     .addInterest ("set_name",     this, nameElement,     node);
      }

      this .nodeList .scrollTop (scrollTop);
      this .nodeList .scrollLeft (scrollLeft);

      if (this .node && !this .nodes .includes (this .node))
         this .setNode (null);
   }

   setNode (node, config = true)
   {
      if (config)
         this .config .file .index = this .nodes .indexOf (node);

      this .node = node;

      this .callback (node);
   }

   getNodes ()
   {
      return Array .from (this .executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES), node => node instanceof X3D .SFNode ? node .getValue () .valueOf () : node .valueOf ());
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
