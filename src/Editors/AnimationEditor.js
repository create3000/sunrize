"use strict";

const
   $           = require ("jquery"),
   X3D         = require ("../X3D"),
   Interface   = require ("../Application/Interface"),
   Splitter    = require ("../Controls/Splitter"),
   NodeList    = require ("./NodeList"),
   Editor      = require ("../Undo/Editor"),
   _           = require ("../Application/GetText");

require ("../Controls/RenameNodeInput");

module .exports = class AnimationEditor extends Interface
{
   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`);

      this .animationEditor = element;

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-content")
         .addClass (["animation-editor-content", "vertical-splitter"])
         .appendTo (this .animationEditor);

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter);

      this .verticalSplitterRight = $("<div></div>")
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .appendTo (this .verticalSplitter);

      this .vSplitter = new Splitter (this .verticalSplitter, "vertical");

      this .verticalSplitter .on ("position", () => this .onSplitterPosition ());

      // Toolbar

      this .toolbar = $("<div></div>")
         .attr ("id", "animation-editor-toolbar")
         .addClass (["animation-editor-toolbar", "toolbar", "horizontal-toolbar"])
         .appendTo (this .animationEditor);

      this .createAnimationIcon = $("<span></span>")
         .addClass (["material-symbols-outlined", "disabled"])
         .attr ("title", _("Create animation."))
         .text ("animation")
         .appendTo (this .toolbar)
         .on ("click", () => this .createAnimation ());

      this .separator1 = $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .addMemberIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Add member to animation."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .addMember ());

      this .removeMemberIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Remove member from animation."))
         .text ("remove")
         .appendTo (this .toolbar)
         .on ("click", () => this .addMember ());

      this .separator2 =$("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .closeAnimationIcon = $("<span></span>")
         .addClass (["material-symbols-outlined", "right"])
         .attr ("title", _("Close animation."))
         .text ("close")
         .appendTo (this .toolbar)
         .on ("click", () => this .closeAnimation ());

      // Animations List

      this .animations = $("<div></div>")
         .addClass ("animations")
         .appendTo (this .verticalSplitterLeft);

      this .nodeListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .animations);

      this .nodeName = $("<input></input>")
         .addClass ("node-name")
         .attr ("placeholder", _("Enter node name."))
         .appendTo (this .animations)
         .renameNodeInput (null, null);

      this .nodeList = new NodeList (this .nodeListElement, node => this .isAnimation (node), animation => this .setAnimation (animation));

      // Selection

      const selection = require ("../Application/Selection");

      selection .addInterest (this, () => this .setSelection (selection));

      // Setup

      this .setup ();
   }

   onSplitterPosition ()
   {
      if (this .vSplitter .position)
         this .toggleSidebarButton .addClass ("active");
      else
         this .toggleSidebarButton .removeClass ("active");
   }

   isAnimation (node)
   {
      if (node .getTypeName () !== "Group")
         return false;

      if (!node .hasMetaData ("Animation/duration"))
         return false;

      return true;
   }

   setAnimation (animation)
   {
      this .animation = animation;

      this .enableIcons (this .animation);

      if (this .animation)
      {
         this .nodeName .renameNodeInput (this .animation);

         this .executionContext = this .animation .getExecutionContext ();
         this .timeSensor       = this .animation ._children .find (node => node .getType () .includes (X3D .X3DConstants .TimeSensor));

         if (!this .timeSensor)
            this .nodeList .setNode (null);
      }
      else
      {
         this .nodeName .renameNodeInput (null, null);
      }
   }

   enableIcons (enabled)
   {
      $([
         this .addMemberIcon,
         this .removeMemberIcon,
         this .closeAnimationIcon,
      ]
      .flatMap (object => [... object]))
      .removeClass (enabled ? "disabled" : [ ])
      .addClass (enabled ? [ ] : "disabled");
   }

   setSelection (selection)
   {
      if (this .isGroupingNodeLike (selection .nodes .at (-1)))
         this .createAnimationIcon .removeClass ("disabled");
      else
         this .createAnimationIcon .addClass ("disabled");
   }

   isGroupingNodeLike (node)
   {
      if (!node)
         return;

      if (node .getType () .includes (X3D .X3DConstants .X3DGroupingNode))
         return true;

      if (node .getType () .includes (X3D .X3DConstants .ViewpointGroup))
         return true;

      return false;
   }

   createAnimation ()
   {
      Editor .undoManager .beginUndo (_("Add Animation"));

      const
         selection        = require ("../Application/Selection"),
         group            = selection .nodes .at (-1),
         executionContext = group .getExecutionContext ();

      Editor .addComponent (executionContext .getLocalScene (), "Time");

      const
         animation  = executionContext .createNode ("Group", false),
         timeSensor = executionContext .createNode ("TimeSensor", false);

      animation ._children .push (timeSensor);

      timeSensor .setup ();
      animation  .setup ();

      executionContext .addNamedNode (executionContext .getUniqueName ("NewAnimation"), animation);
      animation .setMetaData ("Animation/duration",  new X3D .SFInt32 (10));
      animation .setMetaData ("Animation/frameRate", new X3D .SFInt32 (10));

      Editor .insertValueIntoArray (executionContext, group, group ._children, 0, animation);
      Editor .undoManager .endUndo ();

      this .nodeList .setNode (animation);
   }

   closeAnimation ()
   {
      this .nodeList .setNode (null);
   }

   addMember ()
   {

   }
}
