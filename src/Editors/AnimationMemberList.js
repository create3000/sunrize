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

   constructor (element, removeCallback)
   {
      super ("Sunrize.AnimationMembersList.");

      this .#nodeList      = element;
      this .#list          = $("<ul></ul>") .appendTo (this .#nodeList);
      this .#nodes         = [ ];
      this .removeCallback = removeCallback;

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

      let i = this .#nodes .length;

      for (const node of nodes)
      {
         const
            typeNameElement = $("<span></span>") .addClass ("type-name") .text (node .getTypeName ()),
            nameElement     = $("<span></span>") .addClass ("name") .text (this .getName (node)),
            fieldList       = $("<ul></ul>");

         const listItem = $("<li></li>")
            .attr ("node-id", node .getId ())
            .appendTo (this .#list);

         const removeIcon = $("<span></span>")
            .addClass (["material-icons-outlined", "button"])
            .attr ("title", _("Remove member from animation."))
            .text ("cancel")
            .on ("click", () => this .removeNodes ([node]));

         const item = $("<div></div>")
            .data ("i", i ++)
            .addClass (["node", "item"])
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append (typeNameElement)
            .append (document .createTextNode (" "))
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (removeIcon)
            .appendTo (listItem);

         item
            .on ("mouseenter", () => item .addClass ("hover"))
            .on ("mouseleave", () => item .removeClass ("hover"));

         fieldList .appendTo (listItem);

         this .createFieldElements (fieldList, node);

         node .typeName_changed .addInterest ("set_typeName", this, typeNameElement, node);
         node .name_changed     .addInterest ("set_name",     this, nameElement,     node);
      }

      this .#nodes .push (... nodes);
   }

	#fieldTypes = new Set ([
	   X3D .X3DConstants .SFBool,
		X3D .X3DConstants .SFColor,
		X3D .X3DConstants .SFFloat,
		X3D .X3DConstants .SFInt32,
		X3D .X3DConstants .SFRotation,
		X3D .X3DConstants .SFVec2f,
		X3D .X3DConstants .SFVec3f,
		X3D .X3DConstants .MFVec2f,
		X3D .X3DConstants .MFVec3f
   ]);

   createFieldElements (fieldList, node)
   {
      let i = 0;

      for (const field of node .getFields ())
      {
         if (!field .isInput ())
            continue;

         if (!this .#fieldTypes .has (field .getType ()))
            continue;

         const listItem = $("<li></li>")
            .attr ("field-id", field .getId ())
            .appendTo (fieldList);

         const iconElement = $("<img></img>")
            .attr ("title", field .getTypeName ())
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName()}.svg`)
            .on ("dblclick", () => this .addKeyframe (node, field));

         const nameElement = $("<span></span>")
            .addClass ("field-name")
            .text (field .getName ())
            .on ("dblclick", () => this .addKeyframe (node, field));

         const applyIcon = $("<span></span>")
            .addClass (["material-icons", "button", "off"])
            .attr ("title", _("Add keyframe."))
            .text ("check")
            .on ("click", () => this .addKeyframe (node, field));

         const item = $("<div></div>")
            .data ("i", i ++ )
            .addClass (["field", "item"])
            .append (iconElement)
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (applyIcon)
            .appendTo (listItem);

         item
            .on ("mouseenter", () => item .addClass ("hover"))
            .on ("mouseleave", () => item .removeClass ("hover"));
      }
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

      this .removeCallback (nodes);
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

   getTrackOffsets ()
   {
      const
         listTop    = Math .floor (this .#nodeList .offset () .top),
         listHeight = Math .floor (this .#nodeList .parent () .height ()),
         items      = this .#nodeList .find (".item"),
         offsets    = [ ];

      for (const element of items)
      {
         const
            item   = $(element),
            height = Math .round (item .outerHeight ()),
            top    = Math .round (item .offset () .top) - listTop,
            bottom = top + height;

         if (bottom < 0)
            continue;

         if (top > listHeight)
            continue;

         offsets .push ({ item, top, bottom, height });
      }

      return offsets;
   }

   addKeyframe (node, field)
   {

   }
};
