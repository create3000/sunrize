"use strict";

const
   $           = require ("jquery"),
   electron    = require ("electron"),
   capitalize  = require ("capitalize"),
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
      this .members         = new Map ();
      this .interpolators   = [ ];

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-content")
         .addClass (["animation-editor-content", "vertical-splitter"])
         .appendTo (this .animationEditor)
         .on ("mouseleave", () => this .updateTracks ());

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter)
         .on ("mouseleave", () => this .updateTracks ());

      this .verticalSplitterRight = $("<div></div>")
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .on ("mouseleave mousemove", event => this .updateTracks (event))
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
         .addClass (["alternating", "node-list"])
         .appendTo (this .verticalSplitterLeft);

      this .membersListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .verticalSplitterLeft)
         .on ("scroll mousemove", () => this .updateTracks ());

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

      // Tracks

      this .tracks = $("<canvas></canvas>")
         .addClass ("tracks")
         .prependTo (this .animationEditor);

      this .tracksResizer = new ResizeObserver (() => this .updateTracks ());
      this .tracksResizer .observe (this .verticalSplitterRight [0]);

      // Lists

      this .memberList = new MemberList (this .membersListElement);

      this .nodeList = new NodeList (this .nodeListElement, node => this .isAnimation (node), animation => this .setAnimation (animation));

      // Selection

      const selection = require ("../Application/Selection");

      selection .addInterest (this, () => this .setSelection (selection));

      this .setSelection (selection);

      // Setup

      this .setup ();
   }

   colorScheme (shouldUseDarkColors)
   {
      this .updateTracks ();
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

         this .members .clear ();
         this .memberList .clearNodes ();
         this .membersListElement .hide ();
         this .nodeListElement .show ();

         // Animation Name

         this .animationName .val ("");
         this .animationName .attr ("disabled", "");

         // Interpolators

         this .interpolators .length = 0;
      }

      // Tracks

      this .updateTracks ();
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
      this .animationName .val (this .getAnimationName ());
   }

   getAnimationName ()
   {
      return this .animation .getDisplayName () .replace (/Animation$/, "");
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

      for (const interpolator of this .interpolators)
      {
         const name = this .getInterpolatorName (interpolator);

         if (!name)
            continue;

         Editor .updateNamedNode (executionContext, executionContext .getUniqueName (name), interpolator);
      }

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
      for (const node of this .animation ._children)
      {
         const interpolator = node .getValue ();

         if (!interpolator .getType () .some (type => this .#interpolatorTypes .has (type)))
            continue;

         this .interpolators .push (interpolator);

         for (const route of interpolator ._value_changed .getOutputRoutes ())
         {
            const
               node  = route .getDestinationNode (),
               field = node .getField (route .getDestinationField ());

            this .members .set (field, node);
         }
      }

      this .memberList .addNodes (Array .from (this .members .values ()));
   }

   getInterpolatorName (interpolator)
   {
      const route = Array .from (interpolator ._value_changed .getOutputRoutes ()) [0];

      if (!route)
         return;

      const
         destinationNode  = route .getDestinationNode (),
         destinationField = route .getDestinationField (),
         nodeName         = destinationNode .getDisplayName () || "Unnamed",
         fieldName        = capitalize (destinationField .replace (/^set_|_changed$/g, ""), true);

      return `${nodeName}${fieldName}Interpolator`;
   }

   updateTracks (event)
   {
      const
         width        = this .tracks .width (),
         height       = this .tracks .height (),
         context      = this .tracks [0] .getContext ("2d"),
         trackOffsets = this .memberList .getTrackOffsets ();

      this .tracks
         .prop ("width",  width)
         .prop ("height", height);

      const
         tint1 = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--tint-color1"),
         tint2 = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--tint-color2");

      context .lineWidth = 1;

      for (const { item, top, bottom, height } of trackOffsets)
      {
         // Track

         context .fillStyle = item .hasClass ("node") || item .data ("i") % 2 ? "transparent" : tint1;

         context .fillRect (0, top, width, height);

         // Track Tint

         const hover = this .isHoverTrack (event, top, bottom);

         if (hover)
            item .addClass ("hover-track");
         else
            item .removeClass ("hover-track");

         if (item .is (".hover, .hover-tracks") || hover)
         {
            context .fillStyle = tint2;

            context .fillRect (0, top, width, height);
         }

         // Node Border

         if (item .hasClass ("node") && item .data ("i"))
         {
            context .strokeStyle = tint2;

            context .beginPath ();
            context .moveTo (0, top - 1 + 0.5);
            context .lineTo (width, top - 1 + 0.5);
            context .stroke ();
         }
      }

      // // Outline

      // const
      //    blue   = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--system-blue"),
      //    orange = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--system-orange");

      // for (const { item, top, bottom, height } of trackOffsets)
      // {
      //    if (!item .is (".hover, .hover-track"))
      //       continue;

      //    context .strokeStyle = item .hasClass ("node") ? blue : orange;

      //    context .beginPath ();
      //    context .moveTo (0, top - 0.5);
      //    context .lineTo (width, top - 0.5);
      //    context .stroke ();

      //    const offset = item .hasClass ("node") ? Math .floor (item .closest ("li") .height ()) - height : 0;

      //    context .beginPath ();
      //    context .moveTo (0, bottom + offset + 1 + 0.5);
      //    context .lineTo (width, bottom + offset + 1 + 0.5);
      //    context .stroke ();
      // }
   }

   isHoverTrack (event, top, bottom)
   {
      if (!event)
         return false;

      const pointerY = event .pageY - this .tracks .offset () .top;

      return pointerY > top && pointerY < bottom;
   }
}
