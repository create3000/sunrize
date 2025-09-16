"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   X3D         = require ("../X3D"),
   Interface   = require ("../Application/Interface"),
   Splitter    = require ("../Controls/Splitter"),
   NodeList    = require ("./NodeList"),
   MemberList  = require ("./AnimationMemberList"),
   Editor      = require ("../Undo/Editor"),
   _           = require ("../Application/GetText");

require ("../Bits/Validate");

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

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .addMembersIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Add member(s) to animation."))
         .text ("add")
         .appendTo (this .toolbar)
         .on ("click", () => this .addMembers ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .closeAnimationIcon = $("<span></span>")
         .addClass (["material-symbols-outlined", "right"])
         .attr ("title", _("Close animation."))
         .text ("close")
         .appendTo (this .toolbar)
         .on ("click", () => this .closeAnimation ());

      // Animations List

      this .nodeListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .verticalSplitterLeft);

      this .membersListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .verticalSplitterLeft);

      this .animationName = $("<input></input>")
         .addClass ("node-name")
         .attr ("title", _("Rename animation."))
         .attr ("placeholder", _("Enter animation name."))
         .appendTo (this .verticalSplitterLeft)
         .validate (Editor .Id, () =>
         {
            electron .shell .beep ();
            this .highlight ();
         })
         .on ("keydown", event => this .renameAnimation (event));

      this .memberList = new MemberList (this .membersListElement);

      this .nodeList = new NodeList (this .nodeListElement, node => this .isAnimation (node), animation => this .setAnimation (animation));

      // Selection

      const selection = require ("../Application/Selection");

      selection .addInterest (this, () => this .setSelection (selection));

      this .setSelection (selection);

      // Setup

      this .setup ();
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
      // Remove

      this .animation ?._children    .removeInterest ("set_interpolators",  this);
      this .animation ?.name_changed .removeInterest ("set_animation_name", this);

      // Set

      this .animation = animation;

      // Add

      this .enableIcons (this .animation);

      if (this .animation)
      {
         // TimeSensor

         this .executionContext = this .animation .getExecutionContext ();
         this .timeSensor       = this .animation ._children .find (node => node .getValue () .getType () .includes (X3D .X3DConstants .TimeSensor)) .getValue ();

         if (!this .timeSensor)
            this .nodeList .setNode (null);

         // Show Member List

         this .nodeListElement .hide ();
         this .membersListElement .show ();

         // Interpolators

         this .animation ._children .addInterest ("set_interpolators", this);

         this .set_interpolators ();

         // Animation Name

         this .animationName .removeAttr ("disabled");

         this .animation .name_changed .addInterest ("set_animation_name", this);

         this .set_animation_name ();
      }
      else
      {
         // Show Animations List

         this .memberList .clearNodes ();
         this .membersListElement .hide ();
         this .nodeListElement .show ();

         // Animation Name

         this .animationName .val ("");
         this .animationName .attr ("disabled", "");
      }
   }

   enableIcons (enabled)
   {
      $([
         this .addMembersIcon,
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

      if (selection .nodes .at (-1))
         this .addMembersIcon .removeClass ("disabled");
      else
         this .addMembersIcon .addClass ("disabled");
   }

   #groupingNodes = new Set ([
      X3D .X3DConstants .X3DGroupingNode,
      X3D .X3DConstants .ViewpointGroup,
   ]);

   isGroupingNodeLike (node)
   {
      if (!node)
         return;

      if (node .getType () .some (type => this .#groupingNodes .has (type)))
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

      Editor .addComponent (executionContext .getLocalScene (), "Grouping");
      Editor .addComponent (executionContext .getLocalScene (), "Time");

      const
         animation  = executionContext .createNode ("Group", false),
         timeSensor = executionContext .createNode ("TimeSensor", false);

      animation ._children .push (timeSensor);

      timeSensor .setup ();
      animation  .setup ();

      executionContext .addNamedNode (executionContext .getUniqueName ("NewAnimation"),      animation);
      executionContext .addNamedNode (executionContext .getUniqueName ("NewAnimationTimer"), timeSensor);

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

   set_animation_name ()
   {
      this .animationName .val (this .animation .getName () .replace (/Animation(?:_\d+)?$/, ""));
   }

   renameAnimation (event)
   {
      if (event .key !== "Enter")
         return;

      const { executionContext, animation, timeSensor } = this;
      const name = this .animationName .val ();

      Editor .undoManager .beginUndo (_("Rename Animation"));

      Editor .updateNamedNode (executionContext, executionContext .getUniqueName (`${name}Animation`), animation);
      Editor .updateNamedNode (executionContext, executionContext .getUniqueName (`${name}AnimationTimer`), timeSensor);

      Editor .undoManager .endUndo ();
   }

   addMembers ()
   {
      const selection = require ("../Application/Selection");

      this .memberList .addNodes (selection .nodes);
   }

   removeMember ()
   {

   }

   #interpolatorTypes = new Set ([
		X3D .X3DConstants .BooleanSequencer,
		X3D .X3DConstants .IntegerSequencer,
		X3D .X3DConstants .ColorInterpolator,
		X3D .X3DConstants .ScalarInterpolator,
		X3D .X3DConstants .OrientationInterpolator,
		X3D .X3DConstants .PositionInterpolator2D,
		X3D .X3DConstants .PositionInterpolator,
		X3D .X3DConstants .CoordinateInterpolator2D,
		X3D .X3DConstants .CoordinateInterpolator,
   ]);

   set_interpolators ()
   {
      const members = new Map ();

      for (const node of this .animation ._children)
      {
         const interpolatorNode = node .getValue ();

         if (!interpolatorNode .getType () .some (type => this .#interpolatorTypes .has (type)))
            continue;

         for (const route of interpolatorNode ._value_changed .getOutputRoutes ())
         {
            const
               node  = route .getDestinationNode (),
               field = node .getField (route .getDestinationField ());

            members .set (node, field);
         }
      }

      this .memberList .addNodes (Array .from (members .keys ()));
   }
}
