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
      this .#list     = $("<ul></ul>") .appendTo (this .#nodeList);
      this .#nodes    = [ ];

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

         $("<div></div>")
            .addClass ("item")
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append (typeNameElement)
            .append (document .createTextNode (" "))
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (removeIcon)
            .appendTo (listItem);

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
            .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName()}.svg`);

         const nameElement = $("<span></span>")
            .addClass ("field-name")
            .text (field .getName ());

         const applyIcon = $("<span></span>")
            .addClass (["material-icons", "button", "off"])
            .attr ("title", _("Add keyframe."))
            .text ("check")
            .on ("click", () => this .addKeyframe (node, field));

         $("<div></div>")
            .addClass ("item")
            .append (iconElement)
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (applyIcon)
            .appendTo (listItem);
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
         listTop    = this .#nodeList .offset () .top,
         listHeight = this .#nodeList .height (),
         items      = this .#nodeList .find (".item"),
         offsets    = [ ];

      for (const element of items)
      {
         const
            item   = $(element),
            top    = item .offset () .top - listTop + 10,
            bottom = top + item .height ();

         if (bottom < 0)
            continue;

         if (top > listHeight)
            continue;

         offsets .push ({ top, bottom });
      }

      return offsets;
   }

   addKeyframe (node, field)
   {

   }
};
