"use strict";

const
   $         = require ("jquery"),
   electron  = require ("electron"),
   X3D       = require ("../X3D"),
   Interface = require ("../Application/Interface"),
   _         = require ("../Application/GetText");

const _expanded = Symbol ();

module .exports = class AnimationMembersList extends Interface
{
   #editor;
   #nodeList;
   #list;
   #nodes;
   #fields;
   #removeNodesCallback;
   #closeCallback;
   #addMainKeyframeCallback;
   #addNodeKeyframeCallback;
   #addKeyframesCallback;
   #animation;
   #timeSensor;

   constructor (editor, element, { fields, removeNodesCallback, closeCallback, addMainKeyframeCallback, addNodeKeyframeCallback, addKeyframesCallback })
   {
      super ("Sunrize.AnimationMembersList.");

      this .#editor                   = editor;
      this .#nodeList                 = element;
      this .#list                     = $("<ul></ul>") .appendTo (this .#nodeList);
      this .#nodes                    = [ ];
      this .#fields                   = fields;
      this .#removeNodesCallback      = removeNodesCallback;
      this .#closeCallback            = closeCallback;
      this .#addMainKeyframeCallback  = addMainKeyframeCallback;
      this .#addNodeKeyframeCallback  = addNodeKeyframeCallback;
      this .#addKeyframesCallback     = addKeyframesCallback;

      electron .ipcRenderer .on ("animation-members-list", (event, key, ... args) => this [key] (... args));

      this .addMain ();
      this .setup ();
   }

   #executionContext;

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

   // Scrollbars Handling

   #scrollTop;
   #scrollLeft;

   saveScrollbars ()
   {
      this .#scrollTop  = this .#nodeList .scrollTop ();
      this .#scrollLeft = this .#nodeList .scrollLeft ();
   }

   restoreScrollbars ()
   {
      this .#nodeList .scrollTop (this .#scrollTop);
      this .#nodeList .scrollLeft (this .#scrollLeft);
   }

   // Animation Handling

   setAnimation (animation, timeSensor)
   {
      this .#timeSensor ?._isPaused .removeInterest ("connectNodes", this);
      this .#timeSensor ?._isActive .removeInterest ("connectNodes", this);

      this .#animation  = animation;
      this .#timeSensor = timeSensor;

      this .#animation [_expanded] ??= Symbol ();

      this .#timeSensor ._isPaused .addInterest ("connectNodes", this);
      this .#timeSensor ._isActive .addInterest ("connectNodes", this);
   }

   setAnimationName (name)
   {
      this .animationName .text (name);
   }

   // List Elements Handling

   addMain ()
   {
      const
         typeNameElement = $("<span></span>") .addClass ("type-name") .text (_("Animation")),
         nameElement     = $("<span></span>") .addClass ("name") .text ("My"),
         fieldList       = $("<ul></ul>");

      this .animationName = nameElement;

      const listItem = $("<li></li>")
         .addClass ("main")
         .appendTo (this .#list);

      const applyButton = $("<span></span>")
         .addClass (["apply", "material-icons", "button", "off", "disabled"])
         .attr ("title", _("Add keyframe."))
         .text ("check_box")
         .on ("click", () => this .addKeyframesToMain ());

      const removeButton = $("<span></span>")
         .addClass (["material-icons-outlined", "button"])
         .attr ("title", _("Close animation."))
         .text ("cancel")
         .on ("click", () => this .#closeCallback ());

      const item = $("<div></div>")
            .attr ("type", "main")
         .addClass (["main", "item"])
         .append (typeNameElement)
         .append (document .createTextNode (" "))
         .append (nameElement)
         .append (document .createTextNode (" "))
         .append (applyButton)
         .append (document .createTextNode (" "))
         .append (removeButton)
         .appendTo (listItem);

      item
         .on ("mouseenter", () => item .addClass ("hover"))
         .on ("mouseleave", () => item .removeClass ("hover"));

      fieldList .appendTo (listItem);
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
            .addClass ("node")
            .appendTo (this .#list);

         const applyButton = $("<span></span>")
            .addClass (["apply", "material-icons", "button", "off", "disabled"])
            .attr ("title", _("Add keyframe."))
            .text ("check_box")
            .on ("click", () => this .addKeyframesToNode (node));

         const expandButton = $("<span></span>")
            .addClass (["material-icons-outlined", "button"])
            .addClass (node .getUserData (this .#animation [_expanded]) ? "on" : "off")
            .attr ("title", _("Show all fields."))
            .text ("expand_circle_down")
            .on ("click", () => this .toggleExpand (expandButton, fieldList, node));

         const removeButton = $("<span></span>")
            .addClass (["material-icons-outlined", "button"])
            .attr ("title", _("Remove member from animation."))
            .text ("cancel")
            .on ("click", () => this .removeNodes ([node]))
            .on ("click", () => this .#removeNodesCallback ([node]));

         const item = $("<div></div>")
            .data ("i", i ++)
            .attr ("type", "node")
            .addClass (["node", "item"])
            .data ("node", node)
            .append ($("<img></img>") .addClass ("icon") .attr ("src", "../images/OutlineEditor/Node/X3DBaseNode.svg"))
            .append (typeNameElement)
            .append (document .createTextNode (" "))
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (applyButton)
            .append (document .createTextNode (" "))
            .append (expandButton)
            .append (document .createTextNode (" "))
            .append (removeButton)
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
      const expanded = node .getUserData (this .#animation [_expanded])
         || node .getFields () .every (field => !this .#fields .has (field));

      let i = 0;

      for (const field of node .getFields ())
      {
         if (!expanded && !this .#fields .has (field))
            continue;

         if (!field .isInput ())
            continue;

         if (!this .#fieldTypes .has (field .getType ()))
            continue;

         const listItem = $("<li></li>")
            .attr ("node-id", node .getId ())
            .attr ("field-id", field .getId ())
            .addClass ("field")
            .appendTo (fieldList);

         const iconElement = $("<img></img>")
            .attr ("title", field .getTypeName ())
            .addClass ("icon")
            .attr ("src", `../images/OutlineEditor/Fields/${field .getTypeName()}.svg`);

         const nameElement = $("<span></span>")
            .addClass ("field-name")
            .text (field .getName ());

         const applyButton = $("<span></span>")
            .addClass (["apply", "material-icons", "button", "off"])
            .attr ("title", _("Add keyframe."))
            .text ("check_box")
            .on ("click", () => this .addKeyframeToField (node, field));

         const item = $("<div></div>")
            .data ("i", i ++ )
            .attr ("type", "field")
            .addClass (["field", "item"])
            .data ("node", node)
            .data ("field", field)
            .append (iconElement)
            .append (nameElement)
            .append (document .createTextNode (" "))
            .append (applyButton)
            .appendTo (listItem);

         item
            .on ("mouseenter", () => item .addClass ("hover"))
            .on ("mouseleave", () => item .removeClass ("hover"));
      }

      this .connectNode (node, !this .isRunning ());
   }

   toggleExpand (expandButton, fieldList, node)
   {
      node .setUserData (this .#animation [_expanded], !node .getUserData (this .#animation [_expanded]));

      expandButton
         .removeClass (["on", "off"])
         .addClass (node .getUserData (this .#animation [_expanded]) ? "on" : "off");

      fieldList .empty ();

      this .createFieldElements (fieldList, node);

      this .#editor .requestDrawTracks ();
   }

   removeNodes (nodes)
   {
      for (const node of nodes)
      {
         this .#list .find (`li[node-id=${node .getId ()}]`) .remove ();

         node .typeName_changed .removeInterest ("set_typeName", this);
         node .name_changed     .removeInterest ("set_name",     this);

         this .connectNode (node, false);
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

   // Timeline Handling

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

   // Apply Button Handling

   addKeyframesToMain ()
   {
      const
         keyframes  = [ ],
         fieldItems = this .#nodeList .find (`.field > .item`);

      for (const element of fieldItems)
      {
         const fieldItem = $(element);

         if (!fieldItem .find (".apply.green") .length)
            continue;

         const
            node  = fieldItem .data ("node"),
            field = fieldItem .data ("field");

         keyframes .push ({ node, field });
      }

      this .#addKeyframesCallback (keyframes);

      for (const { field } of keyframes)
         this .toggleApply (field, false);
   }

   addKeyframesToNode (node)
   {
      const
         keyframes  = [ ],
         fieldItems = this .#nodeList .find (`.field[node-id=${node.getId ()}] > .item`);

      for (const element of fieldItems)
      {
         const fieldItem = $(element);

         if (!fieldItem .find (".apply.green") .length)
            continue;

         const field = fieldItem .data ("field");

         keyframes .push ({ node, field });
      }

      this .#addKeyframesCallback (keyframes);

      for (const { field } of keyframes)
         this .toggleApply (field, false);
   }

   #node;
   #field;

   addKeyframeToField (node, field)
   {
      this .#node  = node;
      this .#field = field;

      if (field .getType () === X3D .X3DConstants .MFVec3f && !this .#editor .fields .has (field))
      {
         const menu = [
            {
               label: _("CoordinateInterpolator"),
               args: ["addKeyframeForType", "CoordinateInterpolator"],
            },
            {
               label: _("NormalInterpolator"),
               args: ["addKeyframeForType", "NormalInterpolator"],
            },
         ];

         electron .ipcRenderer .send ("context-menu", "animation-members-list", menu);
      }
      else
      {
         this .addKeyframeForType ();
      }
   }

   addKeyframeForType (typeName)
   {
      this .#addKeyframesCallback ([{ node: this .#node, field: this .#field, typeName }]);
      this .toggleApply (this .#field, false);
   }

   isRunning ()
   {
      return this .#timeSensor ._isActive .getValue () && !this .#timeSensor ._isPaused .getValue ()
   }

   connectNodes ()
   {
      if (this .isRunning ())
      {
         this .removeApply ();
      }
      else
      {
         for (const node of this .#nodes)
            this .connectNode (node, true);
      }
   }

   connectNode (node, connect)
   {
      if (connect)
      {
         node .addInterest ("checkApply", this);

         this .checkApply ();
      }
      else
      {
         node .removeInterest ("checkApply", this);
      }
   }

   removeApply ()
   {
      this .#nodeList .find (".apply")
         .removeClass ("green")
         .addClass ("off");
   }

   checkApply ()
   {
      for (const [field, interpolator] of this .#editor .fields)
         this .toggleApply (field, !interpolator ._value_changed .equals (field));
   }

   toggleApply (field, value)
   {
      // Update field.

      const fieldItem = this .#nodeList .find (`[field-id=${field .getId ()}]`);

      if (value)
      {
         fieldItem .find ("> .item .apply")
            .removeClass ("off")
            .addClass ("green");
      }
      else
      {
         fieldItem .find ("> .item .apply")
            .removeClass ("green")
            .addClass ("off");
      }

      // Update node.

      const nodeItem = fieldItem .closest (".node");

      if (nodeItem .find (".field .apply.green") .length)
      {
         nodeItem .find ("> .item .apply")
            .removeClass (["off", "disabled"])
            .addClass ("green");
      }
      else
      {
         nodeItem .find ("> .item .apply")
            .removeClass ("green")
            .addClass (["off", "disabled"]);
      }

      // Update main.

      const mainItem = this .#list .find ("> .main");

      if (this .#nodeList .find (".field .apply.green") .length)
      {
         mainItem .find ("> .item .apply")
            .removeClass (["off", "disabled"])
            .addClass ("green");
      }
      else
      {
         mainItem .find ("> .item .apply")
            .removeClass ("green")
            .addClass (["off", "disabled"]);
      }
   }
};
