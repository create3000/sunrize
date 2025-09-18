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
   members       = new Map ();
   interpolators = [ ];

   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`);

      this .animationEditor = element;

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

      // Zoom toolbar

      this .navigation = $("<div></div>")
         .attr ("id", "animation-editor-navigation")
         .addClass (["animation-editor-navigation", "toolbar", "vertical-toolbar"])
         .appendTo (this .animationEditor);

      this .zoomOutIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom out."))
         .css ("transform", "scale(1.2)")
         .text ("zoom_out")
         .appendTo (this .navigation)
         .on ("click", () => this .on_zoom_out ());

      this .zoomInIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom in."))
         .css ("transform", "scale(1.2)")
         .text ("zoom_in")
         .appendTo (this .navigation)
         .on ("click", () => this .on_zoom_in ());

      this .zoomFitIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom fit animation in window."))
         .css ("transform", "scale(1.2)")
         .text ("fit_screen")
         .appendTo (this .navigation)
         .on ("click", () => this .on_zoom_fit ());

      this .zoom100Icon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom 1:1."))
         .css ("transform", "scale(1.2)")
         .text ("1x_mobiledata")
         .appendTo (this .navigation)
         .on ("click", () => this .on_zoom_100 ());

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

      this .memberList = new MemberList (this .membersListElement, nodes => this .removeMembers (nodes));

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

         // Tracks

         this .on_zoom_fit ();
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

      this .requestUpdateTracks ();
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

      this .requestUpdateTracks ();
   }

   removeMembers (nodes)
   {
      this .requestUpdateTracks ();
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
      const oldMembers = Array .from (this .members .values ());

      this .members .clear ();
      this .interpolators .length = 0;

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

      const members = Array .from (this .members .values ());

      this .memberList .addNodes (members);
      this .memberList .removeNodes (oldMembers .filter (member => !members .includes (member)));
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

   // Draw Properties

   FRAME_SIZE          = 7;          // in pixel
   DEFAULT_TRANSLATION = 8;          // in pixel
   DEFAULT_SCALE       = 16;         // in pixel
   SCROLL_FACTOR       = 1 + 1 / 16; // something nice

   translation = 0;
   scale = 1;

   getDuration ()
   {
      return Math .max (this .animation ?.getMetaData ("Animation/duration", new X3D .SFInt32 (10)) ?? 10, 1);
   }

   getFrameRate ()
   {
      return Math .max (this .animation ?.getMetaData ("Animation/frameRate", new X3D .SFInt32 (10)) ?? 10, 1);
   }

   getTranslation ()
   {
      return this .translation;
   }

   setTranslation (translation)
   {
      const width = this .getWidth ();
      const max   = (width - this .DEFAULT_TRANSLATION) - (this .getDuration () * this .getScale ());

      translation = Math .max (translation, max);
      translation = Math .min (translation, this .DEFAULT_TRANSLATION);

      this .translation = translation;

      this .requestUpdateTracks ();
   }

   getScale ()
   {
      return this .scale;
   }

   setScale (scale)
   {
      this .scale = scale;

      this .requestUpdateTracks ();
   }

   /**
    *
    * @returns {number} start of tracks area
    */
   getX ()
   {
      return Math .floor (this .tracks .width () - this .getWidth () - 11);
   }

   /**
    *
    * @returns {number} width of tracks area
    */
   getWidth ()
   {
      return Math .floor (this .verticalSplitterRight .width () - 20);
   }

   // Draw Function Handlers

   on_zoom_out ()
   {
      this .on_zoom (this .getWidth () / 2, "down");
   }

   on_zoom_in ()
   {
      this .on_zoom (this .getWidth () / 2, "up");
   }

   on_zoom (position, direction)
   {
      const fromFrame = (position - this .getTranslation ()) / this .getScale ();

      switch (direction)
      {
         case "down": // Move backwards.
         {
            this .setScale (this .getScale () / this .SCROLL_FACTOR);
            break;
         }
         case "up": // Move forwards.
         {
            this .setScale (this .getScale () * this .SCROLL_FACTOR);
            break;
         }
      }

      const toFrame = (position - this .getTranslation ()) / this .getScale ();
      const offset  = (toFrame - fromFrame) * this .getScale ();

      this .setTranslation (this .getTranslation () + offset);
   }

   on_zoom_fit ()
   {
      const width = this .getWidth () - 2 * this .DEFAULT_TRANSLATION;

      this .setScale (width / this .getDuration ());
      this .setTranslation (this .DEFAULT_TRANSLATION);
   }

   on_zoom_100 ()
   {
      const frame = 0; // frame input value
      const x     = frame * this .getScale () + this .getTranslation ();

      this .setScale (this .DEFAULT_SCALE);
      this .setTranslation (x - frame * this .DEFAULT_SCALE);
   }

   // Update Tracks

   #updateTracksId = undefined;

   requestUpdateTracks ()
   {
      clearTimeout (this .#updateTracksId);

      this .#updateTracksId = setTimeout (() => this .updateTracks ());
   }

   updateTracks (event)
   {
      const
         tracksX      = this .getX (),
         tracksWidth  = this .tracks .width (),
         tracksHeight = this .tracks .height (),
         context      = this .tracks [0] .getContext ("2d"),
         trackOffsets = this .memberList .getTrackOffsets ();

      const
         firstFrame = Math .max (0, Math .floor (-this .getTranslation () / this .getScale ())),
         lastFrame  = Math .min (this .getDuration (), Math .ceil ((tracksWidth - this .getTranslation ()) / this .getScale ())) + 1;

		const [frameStep, frameFactor] = this .getFrameParams ();

      this .tracks
         .prop ("width",  tracksWidth)
         .prop ("height", tracksHeight);

      const
         blue   = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--system-blue"),
         orange = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--system-orange");

      const
         tint1 = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--tint-color1"),
         tint2 = window .getComputedStyle ($("body") [0]) .getPropertyValue ("--tint-color2");

      context .lineWidth = 1;

      for (const [i, { item, top, bottom, height }] of trackOffsets .entries ())
      {
         // Track

         const odd = item .data ("i") % 2;

         if (odd)
         {
            // Draw a line below last field.

            if (trackOffsets [i + 1] ?.item .hasClass ("node") ?? true)
            {
               const y = bottom + 0.5;

               context .strokeStyle = tint2;

               context .beginPath ();
               context .moveTo (0, y);
               context .lineTo (tracksWidth, y);
               context .stroke ();
            }
         }
         else if (item .hasClass ("field"))
         {
            // Draw a bar.
            
            context .fillStyle = tint1;

            context .fillRect (0, top, tracksWidth, height);
         }

         // Highlight track on hover.

         const hover = this .isHoverTrack (event, top, bottom);

         if (hover)
            item .addClass ("hover-track");
         else
            item .removeClass ("hover-track");

         if (item .is (".hover, .hover-tracks") || hover)
         {
            context .fillStyle = tint2;

            context .fillRect (0, top, tracksWidth, height);
         }

			// Draw vertical lines.

         context .strokeStyle = blue;

			for (let frame = firstFrame - (firstFrame % frameStep); frame < lastFrame; frame += frameStep)
			{
				const s = frame % frameFactor; // small
            const y = Math .floor (top + height * (s ? 0.75 : 0.5));
				const x = Math .floor (tracksX + frame * this .getScale () + this .getTranslation ());

            context .beginPath ();
				context .moveTo (x + 0.5, y);
				context .lineTo (x + 0.5, bottom);
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
      //    context .lineTo (tracksWidth, top - 0.5);
      //    context .stroke ();

      //    const offset = item .hasClass ("node") ? Math .floor (item .closest ("li") .height ()) - height : 0;

      //    context .beginPath ();
      //    context .moveTo (0, bottom + offset + 1 + 0.5);
      //    context .lineTo (tracksWidth, bottom + offset + 1 + 0.5);
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

   #params = Array .from ({ length: 7 }, (_, i) => Math .pow (10, i))
      .map (n => [5 / n, [n * 10, n * 50]])
      .reverse ();

   getFrameParams ()
   {
      const index = X3D .Algorithm .upperBound (this .#params, 0, this .#params .length, this .getScale (), (a, b) =>
      {
         return a < b [0];
      });

      return this .#params [index] ?.[1] ?? [1, 5];
   }
}
