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
   members       = [ ];
   interpolators = [ ];
   fields        = new Map ();

   constructor (element)
   {
      super (`Sunrize.AnimationEditor.${element .attr ("id")}.`);

      this .animationEditor = element;

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-content")
         .addClass (["animation-editor-content", "vertical-splitter"])
         .appendTo (this .animationEditor)
         .on ("mouseleave", () => this .requestDrawTracks ());

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter)
         .on ("mouseleave", () => this .requestDrawTracks ());

      this .verticalSplitterRight = $("<div></div>")
         .attr ("tabindex", 0)
         .addClass ("vertical-splitter-right")
         .css ("width", "70%")
         .on ("mouseleave", () => this .clearPointer ())
         .on ("mousedown mousemove wheel", event => this .updatePointer (event))
         .on ("mousedown", () => this .on_mousedown ())
         .on ("mouseup", () => this .on_mouseup ())
         .on ("mousemove", () => this .on_mousemove ())
         .on ("wheel", event => this .on_wheel (event))
         .on ("keydown", event => this .on_keydown (event))
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

      this .firstFrameIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Go to first frame."))
         .text ("first_page")
         .appendTo (this .toolbar)
         .on ("click", () => this .firstFrame ());

      this .toggleAnimationIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Start animation."))
         .text ("play_arrow")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleAnimation ());

      this .lastFrameIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Go to last frame."))
         .text ("last_page")
         .appendTo (this .toolbar)
         .on ("click", () => this .lastFrame ());

      this .frameInput = $("<input></input>")
         .addClass ("input")
         .attr ("type", "number")
         .attr ("step", 1)
         .attr ("min", 0)
         .attr ("max", 0)
         .attr ("title", _("Current frame."))
         .css ("width", "55px")
         .appendTo (this .toolbar)
         .on ("change input", () => this .setCurrentFrame (this .getCurrentFrame ()));

      this .loopIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Loop animation."))
         .text ("loop")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleLoop ());

      this .propertiesIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Edit animation properties."))
         .text ("access_time")
         .appendTo (this .toolbar)
         .on ("click", () => this .showProperties ());

      this .timeElement = $("<span></span>")
         .addClass (["text", "right"])
         .attr ("title", _("Current frame time."))
         .css ("top", "7px")
         .css ("margin-right", "6px")
         .text (this .formatFrames (0, 10))
         .appendTo (this .toolbar);

      // Navigation toolbar

      this .navigation = $("<div></div>")
         .attr ("id", "animation-editor-navigation")
         .addClass (["animation-editor-navigation", "toolbar", "vertical-toolbar"])
         .appendTo (this .animationEditor);

      this .zoomOutIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom out."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("zoom_out")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomOut ());

      this .zoomInIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom in."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("zoom_in")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomIn ());

      this .zoomFitIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom fit animation in window."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("fit_screen")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomFit ());

      this .zoom100Icon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom 1:1."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("1x_mobiledata")
         .appendTo (this .navigation)
         .on ("click", () => this .zoom100 ());

      // Animations List

      this .nodeListElement = $("<div></div>")
         .addClass (["alternating", "node-list"])
         .appendTo (this .verticalSplitterLeft);

      this .membersListElement = $("<div></div>")
         .addClass ("node-list")
         .appendTo (this .verticalSplitterLeft)
         .on ("scroll mousemove", () => this .requestDrawTracks ());

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

      this .tracksResizer = new ResizeObserver (() => this .resizeTracks ());
      this .tracksResizer .observe (this .verticalSplitterRight [0]);

      // Lists

      this .memberList = new MemberList (this .membersListElement, nodes => this .removeMembers (nodes), () => this .closeAnimation ());

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
      this .requestDrawTracks ();
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

      if (this .timeSensor)
      {
         this .timeSensor ._loop             .removeInterest ("set_loop",     this);
         this .timeSensor ._fraction_changed .removeInterest ("set_fraction", this);

         this .timeSensor ._evenLive = false;
         this .timeSensor ._range    = [0, 0, 1];

         if (this .timeSensor ._loop .getValue () && this .timeSensor ._isActive .getValue ())
         {
            this .timeSensor ._stopTime  = 0;
            this .timeSensor ._startTime = 0;
         }
         else
         {
            this .timeSensor ._startTime = 0;
            this .timeSensor ._stopTime = 1;
         }

         this .timeSensor ._fraction_changed = 0;
      }

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

         this .timeSensor ._loop             .addInterest ("set_loop",     this);
         this .timeSensor ._isActive         .addInterest ("set_active",   this);
         this .timeSensor ._fraction_changed .addInterest ("set_fraction", this);

         this .timeSensor ._evenLive      = true;
         this .timeSensor ._cycleInterval = this .getDuration () / this .getFrameRate ();

         this .set_loop (this .timeSensor ._loop);
         this .set_active (this .timeSensor ._isActive);

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

         // Timeline

         this .frameInput .attr ("max", this .getDuration ());

         this .zoomFit ();
      }
      else
      {
         // TimeSensor

         this .timeSensor = null;

         // Show Animations List

         this .members .length = 0;
         this .memberList .clearNodes ();
         this .membersListElement .hide ();
         this .nodeListElement .show ();

         // Animation Name

         this .animationName .val ("");
         this .animationName .attr ("disabled", "");

         // Timeline

         this .frameInput .attr ("max", 0);

         // Interpolators

         this .interpolators .length = 0;
         this .fields .clear ();
      }

      // Timeline

      this .setCurrentFrame (0);
      this .requestDrawTracks ();
   }

   enableIcons (enabled)
   {
      $([
         this .addMembersIcon,
         this .firstFrameIcon,
         this .toggleAnimationIcon,
         this .lastFrameIcon,
         this .frameInput,
         this .loopIcon,
         this .timeElement,
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
      this .frameInput .attr ("max", 10);
   }

   closeAnimation ()
   {
      this .nodeList .setNode (null);
   }

   set_animation_name ()
   {
      const name = this .getAnimationName ();

      this .animationName .val (name);
      this .memberList .setAnimationName (name);
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

      this .requestDrawTracks ();
   }

   removeMembers (nodes)
   {
      this .requestDrawTracks ();
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
      this .memberList .saveScrollbars ();
      this .memberList .removeNodes (this .members);

      this .members .length = 0;
      this .interpolators .length = 0;
      this .fields .clear ();

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

            this .members .push (node);
            this .fields .set (field, interpolator);
         }
      }

      this .memberList .addNodes (this .members);
      this .memberList .restoreScrollbars ();
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

   // Player

   firstFrame ()
   {
      const selectedRange = this .getSelectedRange ();

      if (selectedRange [0] === selectedRange [1])
         this .setCurrentFrame (0);
      else
         this .setCurrentFrame (selectedRange [0]);
   }

   lastFrame ()
   {
      const selectedRange = this .getSelectedRange ();

      if (selectedRange [0] === selectedRange [1])
         this .setCurrentFrame (this .getDuration ());
      else
         this .setCurrentFrame (selectedRange [1]);
   }

   previousFrame ()
   {
      if (this .getCurrentFrame () === 0)
         this .lastFrame ();
      else
         this .setCurrentFrame (Math .max (this .getCurrentFrame () - 1, 0));
   }

   nextFrame ()
   {
      if (this .getCurrentFrame () === this .getDuration ())
         this .firstFrame ()
      else
         this .setCurrentFrame (Math .min (this .getCurrentFrame () + 1, this .getDuration ()));
   }

   toggleAnimation ()
   {
      this .timeSensor ._stopTime = Date .now () / 1000;

      if (this .timeSensor ._isActive .getValue ())
         return;

      this .timeSensor ._evenLive  = true;
      this .timeSensor ._startTime = Date .now () / 1000;
   }

   toggleLoop ()
   {
      const node = this .timeSensor;

      Editor .setFieldValue (this .browser .currentScene, node, node ._loop, !node ._loop .getValue ());

      if (node ._loop .getValue () && node ._startTime .getValue () >= node ._stopTime .getValue ())
         node ._evenLive = true;
   }

   showProperties ()
   {

   }

   formatFrames (frame, framesPerSecond)
   {
      let time = Math .floor (frame);

      const frames = String (time % framesPerSecond) .padStart (2, "0");
      time /= framesPerSecond;
      time  = Math .floor (time);

      const seconds = String (time % 60) .padStart (2, "0");
      time /= 60;
      time  = Math .floor (time);


      const minutes = String (time % 60) .padStart (2, "0");
      time /= 60;
      time  = Math .floor (time);

      const hours = String (time) .padStart (2, "0");

      return `${hours}:${minutes}:${seconds}:${frames}`;
   }

   set_loop (loop)
   {
      if (loop .getValue ())
         this .loopIcon .addClass ("active");
      else
         this .loopIcon .removeClass ("active");
   }

   set_active (active)
   {
      if (!active .getValue ())
         this .timeSensor ._range [0] = this .getCurrentFrame () / this .getDuration ();

      this .toggleAnimationIcon .text (active .getValue () ? "pause" : "play_arrow");
   }

   set_fraction (fraction)
   {
      const frame = Math .round (this .getDuration () * fraction .getValue ());

      this .frameInput .val (frame);
      this .timeElement .text (this .formatFrames (frame, this .getFrameRate ()));

      this .requestDrawTracks ();
   }

   // Navigation Function Handlers

   on_keydown (event)
   {
      // console .log (event .key);

      switch (event .key)
      {
         case "-":
         {
            this .zoomOut ();
            break;
         }
         case "+":
         {
            this .zoomIn ();
            break;
         }
         case "0":
         {
            this .zoomFit ();
            break;
         }
         case "1":
         {
            this .zoom100 ();
            break;
         }
         case "ArrowLeft":
         {
            this .previousFrame ();
            break;
         }
         case "ArrowRight":
         {
            this .nextFrame ();
            break;
         }
         case "ArrowDown":
         {
            this .firstFrame ();
            break;
         }
         case "ArrowUp":
         {
            this .lastFrame ();
            break;
         }
      }
   }

   zoomOut ()
   {
      this .zoom ("out", this .getWidth () / 2, this .SCROLL_FACTOR);
   }

   zoomIn ()
   {
      this .zoom ("in", this .getWidth () / 2, this .SCROLL_FACTOR);
   }

   zoom (direction, position, factor)
   {
      const fromFrame = (position - this .getTranslation ()) / this .getScale ();

      switch (direction)
      {
         case "out": // Move backwards.
         {
            this .setScale (this .getScale () / factor);
            break;
         }
         case "in": // Move forwards.
         {
            this .setScale (this .getScale () * factor);
            break;
         }
      }

      const toFrame = (position - this .getTranslation ()) / this .getScale ();
      const offset  = (toFrame - fromFrame) * this .getScale ();

      this .setTranslation (this .getTranslation () + offset);
   }

   zoomFit ()
   {
      const width = this .getWidth () - 2 * this .DEFAULT_TRANSLATION;

      this .setScale (width / this .getDuration ());
      this .setTranslation (this .DEFAULT_TRANSLATION);
   }

   zoom100 ()
   {
      const frame = 0; // frame input value
      const x     = frame * this .getScale () + this .getTranslation ();

      this .setScale (this .DEFAULT_SCALE);
      this .setTranslation (x - frame * this .DEFAULT_SCALE);
   }

   // Timeline Properties

   TIMELINE_PADDING    = 10;         // in pixels
   FRAME_SIZE          = 7;          // in pixels
   DEFAULT_TRANSLATION = 8;          // in pixels
   DEFAULT_SCALE       = 16;         // in pixels
   MIN_SCALE           = 128;        // in pixels
   SCROLL_FACTOR       = 1 + 1 / 16; // something nice
   WHEEL_SCROLL_FACTOR = 1 + 1 / 30; // something nice

   translation = 0;
   scale = 1;

   getCurrentFrame ()
   {
      return X3D .Algorithm .clamp (Math .round (this .frameInput .val ()), 0, this .getDuration ());
   }

   setCurrentFrame (frame)
   {
      // Update interpolator fraction.

      this .frameInput .val (frame);
      this .timeElement .text (this .formatFrames (frame, this .getFrameRate ()));

      const fraction = frame / this .getDuration ();

      for (const interpolator of this .interpolators)
         interpolator ._set_fraction = fraction;

      if (this .timeSensor)
         this .timeSensor ._range [0] = fraction;

      this .requestDrawTracks ();
   }

   #defaultInteger = new X3D .SFInt32 ();

   getDuration ()
   {
      this .#defaultInteger .setValue (10);

      return Math .max (this .animation ?.getMetaData ("Animation/duration", this .#defaultInteger) ?? 10, 1);
   }

   getFrameRate ()
   {
      this .#defaultInteger .setValue (10);

      return Math .max (this .animation ?.getMetaData ("Animation/frameRate", this .#defaultInteger) ?? 10, 1);
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

      this .requestDrawTracks ();
   }

   getScale ()
   {
      return this .scale;
   }

   setScale (scale)
   {
      this .scale = Math .min (scale, this .MIN_SCALE);

      this .requestDrawTracks ();
   }

   /**
    *
    * @returns {number} start of timeline area
    */
   getLeft ()
   {
      return Math .floor (this .tracks .width () - this .getWidth () - this .TIMELINE_PADDING);
   }

   /**
    *
    * @returns {number} width of timeline area
    */
   getWidth ()
   {
      return Math .floor (this .verticalSplitterRight .width () - this .TIMELINE_PADDING * 2);
   }

   // Update Tracks

   clearPointer ()
   {
      this .pointerX = -1;
      this .pointerY = -1;

      this .requestDrawTracks ();
   }

   updatePointer (event)
   {
      this .pointerX = event .pageX - this .tracks .offset () .left - this .getLeft ();
      this .pointerY = event .pageY - this .tracks .offset () .top;

      this .requestDrawTracks ();
   }

   getFrameFromPointer (pointerX)
   {
	   const frame = Math .round ((pointerX - this .getTranslation ()) / this .getScale ());

      return X3D .Algorithm .clamp (frame, 0, this .getDuration ());
   }

   getSelectedRange ()
   {
      return [0, 0]
   }

   on_mousedown ()
   {
      this .mousedown = true;

      this .setCurrentFrame (this .getFrameFromPointer (this .pointerX));
   }

   on_mouseup ()
   {
		this .mousedown = false;
   }

   on_mousemove ()
   {
      if (!this .mousedown)
         return;

      this .setCurrentFrame (this .getFrameFromPointer (this .pointerX));
   }

   on_wheel (event)
   {
      const deltaY = event .originalEvent .deltaY;

      this .zoom (deltaY < 0 ? "out" : "in", this .pointerX, this .WHEEL_SCROLL_FACTOR);
   }

   #updateTracksId = undefined;

   requestDrawTracks ()
   {
      clearTimeout (this .#updateTracksId);

      this .#updateTracksId = setTimeout (() => this .drawTracks ());
   }

   resizeTracks ()
   {
      const
         tracksWidth  = this .tracks .width (),
         tracksHeight = this .tracks .height ();

      this .tracks
         .prop ("width",  tracksWidth)
         .prop ("height", tracksHeight);

      this .timelineClip = new Path2D ();
      this .timelineClip .rect (this .getLeft (), 0, this .getWidth (), tracksHeight);

      this .drawTracks ();
   }

   #style = window .getComputedStyle ($("body") [0]);

   drawTracks ()
   {
      const
         context      = this .tracks [0] .getContext ("2d"),
         left         = this .getLeft (),
         width        = this .getWidth (),
         tracksWidth  = this .tracks .width (),
         tracksHeight = this .tracks .height ();

      context .clearRect (0, 0, tracksWidth, tracksHeight);

      if (!this .animation)
         return;

      const
         trackOffsets = this .memberList .getTrackOffsets (),
         firstFrame   = Math .max (0, Math .floor (-this .getTranslation () / this .getScale ())),
         lastFrame    = Math .min (this .getDuration (), Math .ceil ((width - this .getTranslation ()) / this .getScale ())) + 1;

		const [frameStep, frameFactor] = this .getFrameParams ();

      const
         blue   = this .#style .getPropertyValue ("--system-blue"),
         indigo = this .#style .getPropertyValue ("--system-indigo"),
         orange = this .#style .getPropertyValue ("--system-orange");

      const
         tint1 = this .#style .getPropertyValue ("--tint-color1"),
         tint2 = this .#style .getPropertyValue ("--tint-color2");

      for (const [i, { item, top, bottom, height }] of trackOffsets .entries ())
      {
         // Track

         const odd = item .data ("i") % 2;

         if (odd || i === 0)
         {
            // Draw a line below last field.

            if (trackOffsets [i + 1] ?.item .hasClass ("node") ?? true)
            {
               context .fillStyle = tint2;

               context .fillRect (0, bottom - 1, tracksWidth, 1);
            }
         }
         else if (item .hasClass ("field"))
         {
            // Draw a bar.

            context .fillStyle = tint1;

            context .fillRect (0, top, tracksWidth, height);
         }

         // Highlight track on hover.

         const hover = this .pointerY > top && this .pointerY < bottom;

         if (hover)
            item .addClass ("hover-track");
         else
            item .removeClass ("hover-track");

         if (item .is (".hover, .hover-tracks") || hover)
         {
            context .fillStyle = tint2;

            context .fillRect (0, top, tracksWidth, height);
         }

         // Frames

         context .save ();
         context .clip (this .timelineClip);

			// Draw vertical lines.

         context .strokeStyle = item .hasClass ("main") ? indigo : blue;

			for (let frame = firstFrame - (firstFrame % frameStep); frame < lastFrame; frame += frameStep)
			{
				const s = frame % frameFactor; // size (large or small)
            const y = Math .floor (top + height * (s ? 0.75 : 0.5));
				const x = Math .floor (left + frame * this .getScale () + this .getTranslation ());

            context .lineWidth = item .is (".main, .node") ? 3 : 1;

            context .beginPath ();
				context .moveTo (x + 0.5, y);
				context .lineTo (x + 0.5, bottom);
            context .stroke ();
			}

         // Draw keyframes.

         if (item .hasClass ("main"))
         {
            for (const field of this .fields .keys ())
               this .drawKeyframes (context, field, firstFrame, lastFrame, left, bottom, orange);
         }
         else if (item .hasClass ("node"))
         {
            const node = item .data ("node");

            for (const field of node .getFields ())
               this .drawKeyframes (context, field, firstFrame, lastFrame, left, bottom, orange);
         }
         else if (item .hasClass ("field"))
         {
            this .drawKeyframes (context, item .data ("field"), firstFrame, lastFrame, left, bottom, orange);
         }

         context .restore ();
      }

      // Draw current frame cursor.

      context .save ();
      context .clip (this .timelineClip);

      const frame = this .getCurrentFrame ();
      const x     = Math .floor (left + frame * this .getScale () + this .getTranslation ());

      context .fillStyle = blue;

      context .fillRect (x - 1, 0, 3, tracksHeight);

      context .restore ();
   }

   #defaultKey = new X3D .MFInt32 ();

   drawKeyframes (context, field, firstFrame, lastFrame, left, bottom, color)
   {
      const
         FRAME_SIZE   = 7,
         interpolator = this .fields .get (field);

      if (!interpolator)
         return;

      this .#defaultKey .length = 0;

      const
		   key   = interpolator .getMetaData ("Interpolator/key", this .#defaultKey),
		   first = X3D. Algorithm .lowerBound (key, 0, key .length, firstFrame),
		   last  = X3D. Algorithm .upperBound (key, 0, key .length, lastFrame);

      for (let index = first; index < last; ++ index)
		{
         const frame = key [index];
         const x     = Math .floor (left + frame * this .getScale () + this .getTranslation ());
			const x1    = x - (FRAME_SIZE / 2) + 0.5;

			context .fillStyle = color;

         context .fillRect (x1, bottom - FRAME_SIZE, FRAME_SIZE, FRAME_SIZE);
		}
   }

   /**
    * Params for scaling steps of timeline.
    */
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
