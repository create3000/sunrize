"use strict";

const
   $         = require ("jquery"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   Traverse  = require ("x3d-traverse") (X3D),
   _         = require ("../Application/GetText");

module .exports = class NodeList extends Interface
{
   constructor (element, filter = (node) => true, callback = Function .prototype)
   {
      super ("Sunrize.NodeList.");

      this .nodeList         = element;
      this .filter           = filter;
      this .callback         = callback;
      this .executionContext = null;
      this .node             = null;
      this .nodes            = [ ];

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
      return Array .from (this .executionContext .traverse (Traverse .PROTO_DECLARATIONS | Traverse .PROTO_DECLARATION_BODY | Traverse .ROOT_NODES), node => node instanceof X3D .SFNode ? node .getValue () : node);
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
      listItem .find (".name") .text (node .getName ());
   }
};
