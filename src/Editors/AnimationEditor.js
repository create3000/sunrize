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

      this .verticalSplitter = $("<div></div>")
         .attr ("id", "animation-editor-content")
         .addClass (["animation-editor-content", "vertical-splitter"])
         .appendTo (this .animationEditor)
         .on ("mouseleave", () => this .requestDrawTimeline ());

      this .verticalSplitterLeft = $("<div></div>")
         .addClass ("vertical-splitter-left")
         .css ("width", "30%")
         .appendTo (this .verticalSplitter)
         .on ("mouseleave", () => this .requestDrawTimeline ());

      this .timelineElement = $("<div></div>")
         .attr ("tabindex", 0)
         .addClass (["timeline", "vertical-splitter-right"])
         .css ("width", "70%")
         .on ("mouseleave", () => this .clearPointer ())
         .on ("mousedown", event => this .on_mousedown (event))
         .on ("mouseup", event => this .on_mouseup (event))
         .on ("mousemove", event => this .on_mousemove (event))
         .on ("wheel", event => this .on_wheel (event))
         .on ("keydown", event => this .on_keydown (event))
         .appendTo (this .verticalSplitter);

      this .scrollbarElement = $("<div></div>")
         .addClass ("scrollbar")
         .css ("width", "100%")
         .on ("mousedown", event => this .on_mousedown_scrollbar (event))
         .on ("mouseup", event => this .on_mouseup_scrollbar (event))
         .on ("mousemove", event => this .on_mousemove_scrollbar (event))
         .appendTo (this .timelineElement);

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

      this .cutFrameIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Cut selected keyframes."))
         .text ("content_cut")
         .appendTo (this .toolbar)
         .on ("click", () => this .cutKeyframes ());

      this .copyFrameIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Copy selected keyframes."))
         .text ("content_copy")
         .appendTo (this .toolbar)
         .on ("click", () => this .copyKeyframes ());

      this .pasteFrameIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Paste keyframes at current frame."))
         .text ("content_paste")
         .appendTo (this .toolbar)
         .on ("click", () => this .pasteKeyframes ());

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

      this .loopIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Loop animation."))
         .text ("loop")
         .appendTo (this .toolbar)
         .on ("click", () => this .toggleLoop ());

      this .frameInput = $("<input></input>")
         .addClass ("input")
         .attr ("type", "number")
         .attr ("step", 1)
         .attr ("min", 0)
         .attr ("max", 0)
         .attr ("title", _("Current frame."))
         .css ("width", "70px")
         .appendTo (this .toolbar)
         .on ("change input", () => this .setCurrentFrame (this .getCurrentFrame ()));

      this .propertiesIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Edit animation properties."))
         .text ("access_time")
         .appendTo (this .toolbar)
         .on ("click", () => this .showProperties ());

      $("<span></span>") .addClass ("separator") .appendTo (this .toolbar);

      this .keyTypeElement = $("<select></select>")
         .addClass ("select")
         .attr ("title", _("Select keyframe type."))
         .append ($("<option></option>") .text ("CONSTANT"))
         .append ($("<option></option>") .text ("LINEAR") .attr ("selected", ""))
         .append ($("<option></option>") .text ("SPLINE"))
         .append ($("<option></option>") .text ("SPLIT"))
         .append ($("<option></option>") .text ("MIXED") .hide ())
         .appendTo (this .toolbar)
         .on ("change", () => this .setKeyType ());

      this .timeElement = $("<span></span>")
         .addClass (["text", "right"])
         .attr ("title", _("Current frame time (hours:minutes:seconds:frames)."))
         .css ("top", "7.5px")
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
         .attr ("title", _("Zoom timeline out."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("zoom_out")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomOut ());

      this .zoomInIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom timeline in."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("zoom_in")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomIn ());

      this .zoomFitIcon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Zoom timeline to fit in window."))
         .css ("transform", "scale(1.4)")
         .css ("margin-bottom", "15px")
         .text ("fit_screen")
         .appendTo (this .navigation)
         .on ("click", () => this .zoomFit ());

      this .zoom100Icon = $("<span></span>")
         .addClass ("material-icons")
         .attr ("title", _("Default timeline zoom."))
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
         .on ("scroll mousemove", () => this .drawTimeline ());

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

      this .tracksResizer = new ResizeObserver (() => this .resizeTimeline ());
      this .tracksResizer .observe (this .timelineElement [0]);

      // Lists

      this .memberList = new MemberList (this, this .membersListElement);

      this .nodeList = new NodeList (this .nodeListElement,
      {
         filter: node => this .isAnimation (node),
         callback: animation => this .setAnimation (animation),
      });

      // Selection

      const selection = require ("../Application/Selection");

      selection .addInterest (this, () => this .setSelection (selection));

      this .setSelection (selection);

      // Setup

      this .setup ();
   }

   configure ()
   {
      this .config .file .setDefaultValues ({
         scaleKeyframes: true,
         keyType: "LINEAR",
      });

      this .keyTypeElement .val (this .config .file .keyType);
   }

   colorScheme (shouldUseDarkColors)
   {
      this .requestDrawTimeline ();
   }

   isAnimation (node)
   {
      if (!node .getType () .includes (X3D .X3DConstants .Group))
         return false;

      if (!node .hasMetaData ("Animation/duration"))
         return false;

      if (!node ._children .find (node => node .getValue () .getType () .includes (X3D .X3DConstants .TimeSensor)))
         return false;

      return true;
   }

   setAnimation (animation)
   {
      // Remove

      this .setPickedKeyframes ([ ]);
      this .setSelectedKeyframes ([ ]);
      this .setSelectionRange (0, 0);

      this .animation ?._children    .removeInterest ("updateMemberList",    this);
      this .animation ?.name_changed .removeInterest ("updateAnimationName", this);

      if (this .timeSensor)
      {
         this .timeSensor ._loop             .removeInterest ("set_loop",     this);
         this .timeSensor ._isActive         .removeInterest ("set_active",   this);
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
            this .timeSensor ._stopTime  = 1;
         }

         for (const interpolator of this .interpolators)
            interpolator ._set_fraction = 0;
      }

      // Set

      this .animation = animation;

      // Add

      this .enableIcons (this .animation);

      if (this .animation)
      {
         // TimeSensor

         this .timeSensor = this .animation ._children
            .find (node => node .getValue () .getType () .includes (X3D .X3DConstants .TimeSensor)) .getValue ();

         this .timeSensor ._loop             .addInterest ("set_loop",     this);
         this .timeSensor ._isActive         .addInterest ("set_active",   this);
         this .timeSensor ._fraction_changed .addInterest ("set_fraction", this);

         this .timeSensor ._evenLive = true;
         this .timeSensor ._range    = [0, 0, 1];

         this .set_loop (this .timeSensor ._loop);
         this .set_active (this .timeSensor ._isActive);

         this .updateRange ();

         // Show Member List

         this .animation ._children .addInterest ("updateMemberList", this);

         this .nodeListElement .hide ();
         this .membersListElement .show ();
         this .memberList .setAnimation (this .animation, this .timeSensor);

         this .updateMemberList ();

         // Animation Name

         this .animationName .removeAttr ("disabled");

         this .animation .name_changed .addInterest ("updateAnimationName", this);

         this .updateAnimationName ();

         // Timeline

         this .frameInput .attr ("max", this .getDuration ());
      }
      else
      {
         // Show Animations List

         this .updateMemberList ();

         this .membersListElement .hide ();
         this .nodeListElement .show ();

         // Animation Name

         this .animationName .val ("");
         this .animationName .attr ("disabled", "");

         // Timeline

         this .frameInput .attr ("max", 0);
      }

      // Timeline

      this .setSelection (require ("../Application/Selection"));
      this .zoomFit ();
      this .setCurrentFrame (0);
      this .requestDrawTimeline ();
   }

   enableIcons (enabled)
   {
      $([
         this .addMembersIcon,
         this .cutFrameIcon,
         this .copyFrameIcon,
         this .pasteFrameIcon,
         this .firstFrameIcon,
         this .toggleAnimationIcon,
         this .lastFrameIcon,
         this .loopIcon,
         this .frameInput,
         this .propertiesIcon,
         this .keyTypeElement,
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

      if (!this .animation)
         return;

      if (selection .nodes .at (-1))
         this .addMembersIcon .removeClass ("disabled");
      else
         this .addMembersIcon .addClass ("disabled");
   }

   #groupingNodes = new Set ([
      X3D .X3DConstants .X3DLayerNode,
      X3D .X3DConstants .X3DGroupingNode,
      X3D .X3DConstants .ViewpointGroup,
   ]);

   isGroupingNodeLike (node)
   {
      if (!node)
         return true; // X3DScene

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
         executionContext = group ?.getExecutionContext () ?? this .browser .currentScene,
         node             = group ?? executionContext,
         field            = group ?._children ?? executionContext ._rootNodes;

      Editor .addComponent (executionContext .getLocalScene (), "Grouping");
      Editor .addComponent (executionContext .getLocalScene (), "Time");

      const
         animation  = executionContext .createNode ("Group", false),
         timeSensor = executionContext .createNode ("TimeSensor", false);

      animation ._children .push (timeSensor);
      timeSensor ._description = "New Animation";

      timeSensor .setup ();
      animation  .setup ();

      executionContext .addNamedNode (executionContext .getUniqueName ("NewAnimation"),      animation);
      executionContext .addNamedNode (executionContext .getUniqueName ("NewAnimationTimer"), timeSensor);

      animation .setMetaData ("Animation/duration",  new X3D .SFInt32 (10));
      animation .setMetaData ("Animation/frameRate", new X3D .SFInt32 (10));

      Editor .insertValueIntoArray (executionContext, node, field, 0, animation);

      Editor .undoManager .endUndo ();

      // Wait until NodeList knows animation, to have it restored after reload.
      setTimeout (() => this .nodeList .setNode (animation));
   }

   resizeAnimation (newDuration, newFrameRate, scaleKeyframes)
   {
      this .config .file .scaleKeyframes = scaleKeyframes;

      const
         duration  = this .getDuration (),
         frameRate = this .getFrameRate ();

      if (newDuration === duration && newFrameRate === frameRate)
         return;

      if (newDuration < 1)
         return;

      Editor .undoManager .beginUndo (_("Resize Animation"));

      const
         timeSensor       = this .timeSensor,
         executionContext = timeSensor .getExecutionContext ()

      Editor .setFieldValue (executionContext, timeSensor, timeSensor ._cycleInterval, newDuration / newFrameRate);

      Editor .setNodeMetaData (this .animation, "Animation/duration",  new X3D .SFInt32 (newDuration));
      Editor .setNodeMetaData (this .animation, "Animation/frameRate", new X3D .SFInt32 (newFrameRate));

      if (scaleKeyframes)
      {
         const scale = newDuration / duration;

         for (const interpolator of this .interpolators)
         {
            const key = interpolator .getMetaData ("Interpolator/key", new X3D .MFInt32 ())
               .map (value => value * scale);

            Editor .setNodeMetaData (interpolator, "Interpolator/key", key);
         }

         this .setCurrentFrame (Math .floor (this .getCurrentFrame () * scale));
      }
      else
      {
         // Remove keyframes greater than duration.

         for (const interpolator of this .interpolators)
         {
            const key      = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
            const keyValue = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
            const keyType  = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());

            const index = X3D .Algorithm .upperBound (key, 0, key .length, newDuration);

            Editor .setNodeMetaData (interpolator, "Interpolator/key",      key      .slice (0, index));
            Editor .setNodeMetaData (interpolator, "Interpolator/keyValue", keyValue .slice (0, index));
            Editor .setNodeMetaData (interpolator, "Interpolator/keyType",  keyType  .slice (0, index));
         }

         this .setCurrentFrame (Math .min (this .getCurrentFrame (), newDuration));
      }

      this .updateInterpolators ()
      this .registerZoomFit ();

      Editor .undoManager .endUndo ();

      this .frameInput .attr ("max", newDuration);
   }

   closeAnimation ()
   {
      this .nodeList .setNode (null);
   }

   updateAnimationName ()
   {
      const name = this .animation .getDisplayName ();

      this .animationName .val (name);
      this .memberList .setAnimationName (name);
   }

   renameAnimation (event)
   {
      if (event .key !== "Enter")
         return;

      const getDescription = (animation) =>
      {
         return animation .getDisplayName ()
            .replace (/(\d+)/g, " $1")
            .replace (/([A-Z]+[a-z\d ]+)/g, " $1")
            .replace (/([A-Z][a-z]+)/g, " $1")
            .replace (/\s+/g, " ")
            .trim ();
      }

      Editor .undoManager .beginUndo (_("Rename Animation"));

      const { animation, timeSensor } = this;
      const executionContext = animation .getExecutionContext ();
      const name             = this .animationName .val ();
      const oldDescription   = getDescription (animation);

      Editor .updateNamedNode (executionContext, executionContext .getUniqueName (`${name}`), animation);
      Editor .updateNamedNode (executionContext, executionContext .getUniqueName (`${name}Timer`), timeSensor);

      // Don't update description if manually set.
      if (!timeSensor ._description .getValue () || timeSensor ._description .getValue () === oldDescription)
         Editor .setFieldValue (executionContext, timeSensor, timeSensor ._description, getDescription (animation));

      for (const interpolator of this .interpolators)
      {
         const name = this .getInterpolatorName (interpolator);

         if (!name)
            continue;

         Editor .updateNamedNode (executionContext, executionContext .getUniqueName (name), interpolator);
      }

      Editor .undoManager .endUndo ();
   }

   // Members Handling

   addMembers ()
   {
      const selection = require ("../Application/Selection");

      this .memberList .addNodes (selection .nodes);

      this .requestDrawTimeline ();
   }

   removeMembers (nodes)
   {
       const
            animation        = this .animation,
            executionContext = animation .getExecutionContext ();

      Editor .undoManager .beginUndo (_("Remove Member from »%s«"), animation .getDisplayName ());

      for (const node of nodes)
      {
         const
            interpolators = Array .from (node .getFields (), field => this .fields .get (field)),
            children      = animation ._children .filter (node => !interpolators .includes (node .getValue ()));

         Editor .setFieldValue (executionContext, animation, animation ._children, children);
      }

      this .registerRequestDrawTimeline ();

      Editor .undoManager .endUndo ();

      // Update member list.

      this .updateMembers ();
      this .memberList .removeNodes (nodes);

      // Prevent losing members without interpolator.

      this .#changing = true;

      this .browser .nextFrame () .then (() => this .#changing = false);
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
		X3D .X3DConstants .NormalInterpolator,
   ]);

   members       = new Set ();
   fields        = new Map (); // [field, interpolator]
   interpolators = new Set ();

   updateMembers ()
   {
      for (const interpolator of this .interpolators)
         interpolator ._value_changed .removeRouteCallback (this);

      this .members .clear ();
      this .fields .clear ();
      this .interpolators .clear ();

      for (const node of this .animation ?._children ?? [ ])
      {
         const interpolator = node .getValue ();

         if (!interpolator .getType () .some (type => this .#interpolatorTypes .has (type)))
            continue;

         this .interpolators .add (interpolator);

         for (const route of interpolator ._value_changed .getOutputRoutes ())
         {
            const
               node  = route .getDestinationNode (),
               field = node .getField (route .getDestinationField ());

            this .members .add (node);
            this .fields .set (field, interpolator);
         }
      }

      for (const interpolator of this .interpolators)
         interpolator ._value_changed .addRouteCallback (this, () => this .updateMemberList ());
   }

   updateMemberList ()
   {
      if (this .#changing)
         return;

      this .updateMembers ();

      this .memberList .saveScrollbars ();
      this .memberList .clearNodes ();
      this .memberList .addNodes (Array .from (this .members));
      this .memberList .restoreScrollbars ();

      this .requestDrawTimeline ();
   }

   // Interpolators

   #interpolatorTypeNames = new Map ([
      [X3D .X3DConstants .SFBool,     "BooleanSequencer"],
      [X3D .X3DConstants .SFInt32,    "IntegerSequencer"],
      [X3D .X3DConstants .SFColor,    "ColorInterpolator"],
      [X3D .X3DConstants .SFFloat,    "ScalarInterpolator"],
      [X3D .X3DConstants .SFRotation, "OrientationInterpolator"],
      [X3D .X3DConstants .SFVec2f,    "PositionInterpolator2D"],
      [X3D .X3DConstants .SFVec3f,    "PositionInterpolator"],
      [X3D .X3DConstants .MFVec2f,    "CoordinateInterpolator2D"],
      [X3D .X3DConstants .MFVec3f,    "CoordinateInterpolator"],
      // NormalInterpolator
   ]);

   #components = new Map ([
      [X3D .X3DConstants .BooleanSequencer,         1],
      [X3D .X3DConstants .IntegerSequencer,         1],
      [X3D .X3DConstants .ColorInterpolator,        3],
      [X3D .X3DConstants .ScalarInterpolator,       1],
      [X3D .X3DConstants .OrientationInterpolator,  4],
      [X3D .X3DConstants .PositionInterpolator2D,   2],
      [X3D .X3DConstants .PositionInterpolator,     3],
      [X3D .X3DConstants .CoordinateInterpolator2D, 2],
      [X3D .X3DConstants .CoordinateInterpolator,   3],
      [X3D .X3DConstants .NormalInterpolator,       3],
   ]);

   getKeyType ()
   {
      return this .keyTypeElement .val ();
   }

   setKeyType ()
   {
      const value = this .getKeyType ();

      this .config .file .keyType = value;

      // Update interpolators.

      const keyframes = this .getSelectedKeyframes ();

      if (keyframes .length)
      {
         Editor .undoManager .beginUndo (_("Change Key Type of Selected Keyframes"));

         for (const { field, interpolator, index } of keyframes)
         {
            const keyType = interpolator .getMetaData ("Interpolator/keyType", new X3D .MFString ());

            keyType [index] = this .restrictKeyType (field, interpolator, value);

            Editor .setNodeMetaData (interpolator, "Interpolator/keyType", keyType);
         }

         for (const interpolator of new Set (keyframes .map (({ interpolator }) => interpolator)))
            this .updateInterpolator (interpolator);

         Editor .undoManager .endUndo ();
      }
   }

   updateKeyType ()
   {
      if (this .getSelectedKeyframes () .length)
      {
         const keyTypes = {
            CONSTANT: 0,
            LINEAR: 0,
            SPLINE: 0,
            SPLIT: 0,
         };

         for (const { interpolator, index } of this .getSelectedKeyframes ())
         {
            const keyType = interpolator .getMetaData ("Interpolator/keyType", new X3D .MFString ());

            ++ keyTypes [keyType [index]];
         }

         const keyType = Object .entries (keyTypes)
            .find (([key, value]) => value === this .getSelectedKeyframes () .length);

         this .keyTypeElement .val (keyType ?.[0] ?? "MIXED");
      }
      else
      {
         this .keyTypeElement .val (this .config .file .keyType);
      }
   }

   restrictKeyType (field, interpolator, keyType)
   {
      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFInt32:
         {
            return "CONSTANT";
         }
         case X3D .X3DConstants .SFColor:
         {
            if (keyType .match (/^(?:SPLINE|SPLIT)$/))
               return "LINEAR";

            return keyType;
         }
         case X3D .X3DConstants .MFVec3f:
         {
            if (keyType .match (/^(?:SPLINE|SPLIT)$/))
            {
               if (interpolator instanceof X3D .NormalInterpolator)
                  return "LINEAR";
            }

            return keyType;
         }
         default:
         {
            return keyType;
         }
      }
   }

   addKeyframes (keyframes)
   {
      // Create interpolators.

      const count = keyframes .reduce ((p, { field }) => p + !this .fields .has (field), 0);

      if (count === 1)
         Editor .undoManager .beginUndo (_("Add Interpolator to »%s«"), this .animation .getDisplayName ());
      else
         Editor .undoManager .beginUndo (_("Add Interpolators to »%s«"), this .animation .getDisplayName ());

      for (const { node, field, typeName } of keyframes)
         this .getInterpolator (node, field, typeName)

      Editor .undoManager .endUndo ();

      // Add keyframes.

      if (keyframes .length === 1)
         Editor .undoManager .beginUndo (_("Add Keyframe to »%s«"), this .animation .getDisplayName ());
      else
         Editor .undoManager .beginUndo (_("Add Keyframes to »%s«"), this .animation .getDisplayName ());

      for (const { node, field, typeName } of keyframes)
         this .addKeyframe (node, field, typeName);

      Editor .undoManager .endUndo ();
   }

   addKeyframe (node, field, typeName)
   {
      Editor .undoManager .beginUndo (_("Add Keyframe to »%s«"), this .animation .getDisplayName ());

      const
         interpolator = this .getInterpolator (node, field, typeName),
         frame        = this .getCurrentFrame (),
         type         = this .restrictKeyType (field, interpolator, this .getKeyType ());

      switch (field .getType ())
      {
         case X3D .X3DConstants .SFBool:
         case X3D .X3DConstants .SFInt32:
         case X3D .X3DConstants .SFColor:
         case X3D .X3DConstants .SFFloat:
         case X3D .X3DConstants .SFRotation:
         case X3D .X3DConstants .SFVec2f:
         case X3D .X3DConstants .SFVec3f:
         {
            this .addKeyframeToInterpolator (interpolator, frame, type, field);
            break;
         }
         case X3D .X3DConstants .MFVec2f:
         case X3D .X3DConstants .MFVec3f:
         {
            if (field .length === 0)
               break;

            const keySize = interpolator .getMetaData ("Interpolator/keySize", new X3D .SFInt32 ());

            if (keySize .getValue () !== 0 && keySize .getValue () !== field .length)
            {
               this .showArraySizeErrorDialog (keySize .getValue ());
               break;
            }

            keySize .setValue (field .length);

            Editor .setNodeMetaData (interpolator, "Interpolator/keySize", keySize);

            const value = Array .from (field) .flatMap (value => Array .from (value));

            this .addKeyframeToInterpolator (interpolator, frame, type, value);
            break;
         }
      }

      this .updateInterpolator (interpolator);

      Editor .undoManager .endUndo ();
   }

   #changing = false;

   getInterpolator (node, field, typeName)
   {
      if (this .fields .has (field))
         return this .fields .get (field);

      typeName ??= this .#interpolatorTypeNames .get (field .getType ());

      Editor .undoManager .beginUndo (_("Add Interpolator"));

      const executionContext = this .animation .getExecutionContext ();

      if (typeName .includes ("Sequencer"))
         Editor .addComponent (executionContext .getLocalScene (), "EventUtilities");
      else if (typeName .includes ("Interpolator"))
         Editor .addComponent (executionContext .getLocalScene (), "Interpolation");

      const interpolator = executionContext .createNode (typeName, false);

      interpolator .setup ();

      this .fields .set (field, interpolator);
      this .interpolators .add (interpolator);

      Editor .appendValueToArray (executionContext, this .animation, this .animation ._children, interpolator);
      Editor .addRoute (executionContext, this .timeSensor, "fraction_changed", interpolator, "set_fraction");
      Editor .addRoute (executionContext, interpolator, "value_changed", node, field .getName ());

      const name = this .getInterpolatorName (interpolator);

      Editor .updateNamedNode (executionContext, executionContext .getUniqueName (name), interpolator);

      Editor .undoManager .endUndo ();

      // Prevent losing members without interpolator.

      this .#changing = true;

      this .browser .nextFrame () .then (() => this .#changing = false);

      return interpolator;
   }

   getInterpolatorName (interpolator)
   {
      const route = Array .from (interpolator ._value_changed .getOutputRoutes ()) [0];

      if (!route)
         return;

      const
         destinationNode  = route .getDestinationNode (),
         destinationField = route .getDestinationField (),
         nodeName         = destinationNode .getDisplayName () || destinationNode .getTypeName (),
         fieldName        = capitalize (destinationField .replace (/^set_|_changed$/g, ""), true),
         typeName         = interpolator .getTypeName () .match (/(Sequencer|Interpolator)$/) [1];

      return `${nodeName}${fieldName}${typeName}`;
   }

   removeInterpolator (node, field)
   {
      const
         animation        = this .animation,
         executionContext = animation .getExecutionContext (),
         interpolator     = this .fields .get (field),
         children         = animation ._children .filter (node => node .getValue () !== interpolator);

      Editor .undoManager .beginUndo (_("Remove Interpolator from »%s«"), animation .getDisplayName ());

      Editor .setFieldValue (executionContext, animation, animation ._children, children);

      this .registerRequestDrawTimeline ();

      Editor .undoManager .endUndo ();
   }

   updateInterpolators ()
   {
      Editor .undoManager .beginUndo (_("Update Interpolators"));

      for (const interpolator of this .interpolators)
         this .updateInterpolator (interpolator)

      Editor .undoManager .endUndo ();
   }

   updateInterpolator (interpolator)
   {
      Editor .undoManager .beginUndo (_("Update Interpolator"));

      switch (interpolator .getType () .at (-1))
      {
         case X3D .X3DConstants .BooleanSequencer:
         case X3D .X3DConstants .IntegerSequencer:
         {
            this .updateSequencer (interpolator);
            break;
         }
         case X3D .X3DConstants .ColorInterpolator:
         case X3D .X3DConstants .ScalarInterpolator:
         case X3D .X3DConstants .OrientationInterpolator:
         case X3D .X3DConstants .PositionInterpolator2D:
         case X3D .X3DConstants .PositionInterpolator:
         {
            this .updateScalarInterpolator (interpolator);
            break;
         }
         case X3D .X3DConstants .CoordinateInterpolator2D:
         case X3D .X3DConstants .CoordinateInterpolator:
         case X3D .X3DConstants .NormalInterpolator:
         {
            this .updateArrayInterpolator (interpolator);
            break;
         }
      }

      interpolator ._set_fraction .addEvent ();

      Editor .undoManager .endUndo ();
   }

   updateSequencer (interpolator)
   {
      this .resizeInterpolator (interpolator);

      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());

      keyValue .length = key .length * components;
      keyType  .length = key .length;

      const size      = key .length;
      const duration  = this .getDuration ();
      const keys      = [ ];
      const keyValues = [ ];

      let i  = 0; // index in key
      let iN = 0; // index in meta data keyValue

      while (i < size)
      {
         if (key [i] < 0 || key [i] > duration)
            continue;

         const fraction = key [i] / duration;
         const value    = keyValue [iN];

         keys      .push (fraction);
         keyValues .push (value);

         ++ i;
         iN += components;
      }

      const executionContext = interpolator .getExecutionContext ();

      Editor .setFieldValue (executionContext, interpolator, interpolator ._key,      keys);
      Editor .setFieldValue (executionContext, interpolator, interpolator ._keyValue, keyValues);

      this .registerRequestDrawTimeline ();
   }

   #vectors = new Map ([
      [2, X3D .Vector2],
      [3, X3D .Vector3],
      [4, X3D .Vector4],
   ]);

   updateScalarInterpolator (interpolator)
   {
      this .resizeInterpolator (interpolator);

      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());

      keyValue .length = key .length * components;
      keyType  .length = key .length;

      const size      = key .length;
      const duration  = this .getDuration ();
      const keys      = [ ];
      const keyValues = [ ];

      let i  = 0; // index in key
      let iN = 0; // index in meta data keyValue

      while (i < size)
      {
         if (key [i] < 0 || key [i] > duration)
         {
            ++ i;
            continue;
         }

         const value    = this .getValue (keyValue, iN, components);
         const fraction = key [i] / duration;

         let iT = i;

         if (keyType [iT] === "SPLIT" && iT + 1 < size)
            ++ iT;

         switch (keyType [iT])
         {
            case "CONSTANT":
            {
               keys      .push (fraction);
               keyValues .push (... value);

               if (key [i] < duration)
               {
                  const nextFraction = i === size - 1 ? 1 : key [i + 1] / duration;

                  keys      .push (nextFraction);
                  keyValues .push (... value);
               }

               break;
            }
            case "LINEAR":
            case "SPLIT":
            {
               keys      .push (fraction);
               keyValues .push (... value);
               break;
            }
            case "SPLINE":
            {
               const currentKeys = new X3D .MFFloat ();

               const currentKeyValues = interpolator instanceof X3D .OrientationInterpolator
                  ? new X3D .MFRotation ()
                  : components === 1 ? new X3D .MFFloat () : new X3D [`MFVec${components}f`] ();

               const currentKeyVelocities = currentKeyValues .create ();
               const Vector               = this .#vectors .get (components);

               for (; i < size; ++ i, iN += components)
               {
                  let value = this .getValue (keyValue, iN, components);

                  if (interpolator instanceof X3D .ColorInterpolator)
                     value = new X3D .Color3 (... value) .getHSV ();

                  currentKeys      .push (key [i]);
                  currentKeyValues .push (components === 1 ? value [0] : new Vector (... value));

                  if (currentKeys .length === 1)
                     continue;

                  if (keyType [i] !== "SPLINE")
                     break;
               }

               if (currentKeys .length < 2)
               {
                  // This can happen if only the last frame is of type SPLINE.

                  keys      .push (fraction);
                  keyValues .push (... value);
                  break;
               }

               // currentKeyVelocities .length = currentKeys .length;

               const closed = currentKeys .at (0) === 0
                  && currentKeys .at (-1) === duration
                  && (components === 1
                     ? currentKeyValues .at (0) === currentKeyValues .at (-1)
                     : currentKeyValues .at (0) .equals (currentKeyValues .at (-1)));

               const normalizeVelocity = false;

               const spline = interpolator instanceof X3D .OrientationInterpolator
                  ? new X3D .SquadInterpolator ()
                  : new X3D [`CatmullRomSplineInterpolator${components}`] ();

               spline .generate (closed,
                                 currentKeys,
                                 currentKeyValues,
                                 currentKeyVelocities,
                                 normalizeVelocity);

               const length = currentKeys .length - 1;

               for (let k = 0; k < length; ++ k)
               {
                  const frames   = currentKeys [k + 1] - currentKeys [k];
                  const fraction = currentKeys [k] / duration;
                  const distance = frames / duration;
                  const framesN  = frames + (k + 1 === length && i === key .length);

                  for (let f = 0; f < framesN; ++ f)
                  {
                     const weight = f / frames;

                     let value = spline .interpolate (k, k + 1, weight, currentKeyValues);

                     if (interpolator instanceof X3D .ColorInterpolator)
                        value = new X3D .Color3 () .setHSV (... value);

                     keys      .push (fraction + weight * distance);
                     keyValues .push (... (components === 1 ? [value] : value));
                  }
               }

               if (i + 1 !== size)
               {
                  i  -= 1;
                  iN -= components;
               }

               break;
            }
         }

         i  += 1;
         iN += components;
      }

      const executionContext = interpolator .getExecutionContext ();

      Editor .setFieldValue (executionContext, interpolator, interpolator ._key,      keys);
      Editor .setFieldValue (executionContext, interpolator, interpolator ._keyValue, keyValues);

      this .registerRequestDrawTimeline ();
   }

   updateArrayInterpolator (interpolator)
   {
      this .resizeInterpolator (interpolator);

      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());
      const keySize    = interpolator .getMetaData ("Interpolator/keySize",  new X3D .SFInt32 ());

      keyValue .length = key .length * components * keySize;
      keyType  .length = key .length;

      const size      = key .length;
      const duration  = this .getDuration ();
      const keys      = [ ];
      const keyValues = [ ];

      let i  = 0; // index in key
      let iN = 0; // index in meta data keyValue

      while (i < size)
      {
         if (key [i] < 0 && key [i] > duration)
         {
            ++ i;
            continue;
         }

         const fraction = key [i] / duration;

         let iT = i;

         if (keyType [iT] === "SPLIT" && iT + 1 < size)
            ++ iT;

         switch (keyType [iT])
         {
            case "CONSTANT":
            {
               const length = components * keySize;

               keys .push (fraction);

               for (let a = 0; a < length; a += components)
                  keyValues .push (... this .getValue (keyValue, iN + a, components));

               if (key [i] < duration)
               {
                  const nextFraction = (i === size - 1 ? 1 : key [i + 1] / duration);

                  keys .push (nextFraction);

                  for (let a = 0; a < length; a += components)
                     keyValues .push (... this .getValue (keyValue, iN + a, components));
               }

               break;
            }
            case "LINEAR":
            case "SPLIT":
            {
               const length = components * keySize;

               keys .push (fraction);

               for (let a = 0; a < length; a += components)
                  keyValues .push (... this .getValue (keyValue, iN + a, components));

               break;
            }
            case "SPLINE":
            {
               const first = keyValues .length;

               // Generate key.

               const currentKeys = interpolator ._key .create ();

               for (; i < size; ++ i)
               {
                  currentKeys .push (key [i]);

                  if (currentKeys .length === 1)
                     continue;

                  if (keyType [i] !== "SPLINE")
                     break;
               }

               if (currentKeys .length < 2)
               {
                  // This can happen if only the last frame is of type SPLINE.

                  const length = components * keySize;

                  keys .push (fraction);

                  for (let a = 0; a < length; a += components)
                     keyValues .push (... this .getValue (keyValue, iN + a, components));

                  break;
               }

               const length = currentKeys .length - 1;

               for (let k = 0; k < length; ++ k)
               {
                  const frames   = currentKeys [k + 1] - currentKeys [k];
                  const fraction = currentKeys [k] / duration;
                  const distance = frames / duration;
                  const framesN  = k + 1 === length && i === key .length ? frames + 1 : frames;

                  for (let f = 0; f < framesN; ++ f)
                  {
                     const weight = f / frames;

                     keys .push (fraction + weight * distance);
                  }
               }

               // Generate keyValue.

               for (let a = 0; a < keySize; ++ a)
               {
                  const currentKeyValues     = interpolator ._keyValue .create ();
                  const currentKeyVelocities = interpolator ._keyValue .create ();
                  const Vector               = this .#vectors .get (components);

                  for (let i = 0, aiN = iN + a * components; i < currentKeys .length; ++ i, aiN += components * keySize)
                     currentKeyValues .push (new Vector (... this .getValue (keyValue, aiN, components)));

                  // currentKeyVelocities .length = currentKeys .length;

                  const closed = currentKeys .at (0) === 0
                     && currentKeys .at (-1) === duration
                     && currentKeyValues .at (0) .equals (currentKeyValues .at (-1));

                  const normalizeVelocity = false;

                  const spline = new X3D [`CatmullRomSplineInterpolator${components}`] ();

                  spline .generate (closed,
                                    currentKeys,
                                    currentKeyValues,
                                    currentKeyVelocities,
                                    normalizeVelocity);

                  const length = currentKeys .length - 1;

                  let totalFrames = 0;

                  for (let k = 0; k < length; ++ k)
                  {
                     const frames  = currentKeys [k + 1] - currentKeys [k];
                     const framesN = frames + (k + 1 === length && i === key .length);

                     for (let f = 0; f < framesN; ++ f)
                     {
                        const weight = f / frames;
                        const value  = spline .interpolate (k, k + 1, weight, currentKeyValues);
                        const index  = first + (a + (totalFrames + f) * keySize) * components;

                        if (index >= keyValues .length)
                           keyValues .length = index + 1;

                        keyValues .splice (index, components, ... value);
                     }

                     totalFrames += frames;
                  }
               }

               if (i + 1 !== size)
                  i -= 1;

               iN += components * keySize * (currentKeys .length - 2);
               break;
            }
         }

         i  += 1;
         iN += components * keySize;
      }

      const executionContext = interpolator .getExecutionContext ();

      Editor .setFieldValue (executionContext, interpolator, interpolator ._key,      keys);
      Editor .setFieldValue (executionContext, interpolator, interpolator ._keyValue, keyValues);

      this .registerRequestDrawTimeline ();
   }

   getValue (keyValue, index, components)
   {
      const value = [ ];

      for (let i = 0; i < components; ++ i)
         value .push (keyValue [index + i]);

      return value;
   }

   resizeInterpolator (interpolator)
   {
      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());
      const keySize    = interpolator .getMetaData ("Interpolator/keySize",  new X3D .SFInt32 (1));
      const size       = X3D .Algorithm .upperBound (key, 0, key .length, this .getDuration ());
      const sizeN      = size * components * keySize;

      // Remove frames greater than duration.

      key      .length = size;
      keyValue .length = sizeN;
      keyType  .length = size;

      Editor .setNodeMetaData (interpolator, "Interpolator/key",      key);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyValue", keyValue);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyType",  keyType);

      if (key .length === 0)
         Editor .removeNodeMetaData (interpolator, "Interpolator/keySize", new X3D .SFInt32 ());

      this .registerRequestDrawTimeline ();
   }

   addKeyframeToInterpolator (interpolator, frame, type, value)
   {
      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());
      const keySize    = interpolator .getMetaData ("Interpolator/keySize",  new X3D .SFInt32 (1));
      const index      = X3D .Algorithm .lowerBound (key, 0, key .length, frame);
      const indexN     = index * components * keySize;

      keyValue .length = key .length * components * keySize;
      keyType  .length = key .length;

      const deleteCountN = index === key .length || frame === key [index]
         ? components * keySize // update
         : 0;                   // insert

      key     .splice (index, deleteCountN ? 1 : 0, frame);
      keyType .splice (index, deleteCountN ? 1 : 0, type);

      // Use slice and concat instead of splice to support very large arrays.

      const
         before = keyValue .slice (0, indexN),
         after  = keyValue .slice (indexN + deleteCountN),
         insert = new X3D .MFDouble ();

      insert .setValue (components === 1 ? [value] : Array .from (value));

      const newKeyValue = before .concat (insert) .concat (after);

      Editor .setNodeMetaData (interpolator, "Interpolator/key",      key);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyValue", newKeyValue);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyType",  keyType);

      this .registerRequestDrawTimeline ();

      return index;
   }

   removeKeyframes (keyframes)
   {
      Editor .undoManager .beginUndo (_("Delete Keyframes"));

      // Sort keyframes in descending order.
      keyframes .sort (({ index: a }, { index: b }) => b - a);

      for (const { interpolator, index } of keyframes)
         this .removeKeyframeFromInterpolator (interpolator, index);

      for (const interpolator of new Set (keyframes .map (({ interpolator }) => interpolator)))
         this .updateInterpolator (interpolator);

      Editor .undoManager .endUndo ();
   }

   removeKeyframeFromInterpolator (interpolator, index)
   {
      const components = this .#components .get (interpolator .getType () .at (-1));
      const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
      const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
      const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());
      const keySize    = interpolator .getMetaData ("Interpolator/keySize",  new X3D .SFInt32 (1));
      const indexN     = index * components * keySize;

      keyValue .length = key .length * components * keySize;
      keyType  .length = key .length;

      const deleteCountN = components * keySize;

      const frame        = key      .splice (index, 1);
      const frameKeyType = keyType  .splice (index, 1);
      const frameValue   = keyValue .splice (indexN, deleteCountN);

      Editor .setNodeMetaData (interpolator, "Interpolator/key",      key);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyValue", keyValue);
      Editor .setNodeMetaData (interpolator, "Interpolator/keyType",  keyType);

      if (!key .length)
         Editor .removeNodeMetaData (interpolator, "Interpolator/keySize", new X3D .SFInt32 ());

      this .registerRequestDrawTimeline ();

      return { interpolator, index, frame: frame [0], keyType: frameKeyType [0], value: Array .from (frameValue) };
   }

   cutKeyframes ()
   {
      switch (this .getSelectedKeyframes () .length)
      {
         case 0:
            return;
         case 1:
            Editor .undoManager .beginUndo (_("Cut Keyframe"));
            break;
         default:
            Editor .undoManager .beginUndo (_("Cut Keyframes"));
            break;
      }

      this .copyKeyframes ();
      this .removeKeyframes (this .getSelectedKeyframes ());
      this .registerClearSelectedKeyframes ();

      Editor .undoManager .endUndo ();
   }

   copyKeyframes ()
   {
      const string = JSON .stringify ({
         "sunrize-keyframes": this .getSelectedKeyframes () .map (({ field, interpolator, index }) =>
         {
            const components = this .#components .get (interpolator .getType () .at (-1));
            const key        = interpolator .getMetaData ("Interpolator/key",      new X3D .MFInt32 ());
            const keyValue   = interpolator .getMetaData ("Interpolator/keyValue", new X3D .MFDouble ());
            const keyType    = interpolator .getMetaData ("Interpolator/keyType",  new X3D .MFString ());
            const keySize    = interpolator .getMetaData ("Interpolator/keySize",  new X3D .SFInt32 (1));
            const indexN     = index * components * keySize;
            const countN     = components * keySize;

            return {
               field: field .getId (),
               frame: key [index],
               type: keyType [index],
               value: Array .from (keyValue .slice (indexN, indexN + countN)),
            };
         }),
      });

      navigator .clipboard .writeText (string);
   }

   async pasteKeyframes ()
   {
      const
         string = await navigator .clipboard .readText (),
         json   = $.try (() => JSON .parse (string));

      if (!json)
         return;

      const keyframes = json ["sunrize-keyframes"];

      if (!keyframes)
         return;

      try
      {
         Editor .undoManager .beginUndo (_("Paste Keyframes"));

         const
            currentFrame      = this .getCurrentFrame (),
            firstFrame        = keyframes .reduce ((p, c) => Math .min (p, c .frame), Number .POSITIVE_INFINITY),
            selectedKeyframes = [ ];

         for (const { field: id, frame, type, value } of keyframes)
         {
            for (const field of this .fields .keys ())
            {
               if (field .getId () !== id)
                  continue;

               const interpolator = this .fields .get (field);
               const newFrame     = frame - firstFrame + currentFrame;

               if (newFrame > this .getDuration ())
                  continue;

               if (interpolator ._value_changed instanceof X3D .X3DArrayField)
               {
                  const components = this .#components .get (interpolator .getType () .at (-1));
                  const keySize    = interpolator .getMetaData ("Interpolator/keySize", new X3D .SFInt32 ());

                  if (keySize .getValue () === 0)
                  {
                     keySize .setValue (value .length / components);

                     Editor .setNodeMetaData (interpolator, "Interpolator/keySize", keySize);
                  }

                  const countN = components * keySize;

                  if (value .length !== countN)
                     continue;
               }

               const index = this .addKeyframeToInterpolator (interpolator, newFrame, type, value);

               selectedKeyframes .push ({ field, interpolator, index });
            }
         }

         for (const interpolator of new Set (selectedKeyframes .map (({ interpolator }) => interpolator)))
            this .updateInterpolator (interpolator);

         this .registerClearSelectedKeyframes ();
         this .setSelectedKeyframes (selectedKeyframes);
         this .setSelectionRange (0, 0);
         this .registerRequestDrawTimeline ();
      }
      catch (error)
      {
         console .error (error);
      }
      finally
      {
         Editor .undoManager .endUndo ();
      }
   }

   deleteKeyframes ()
   {
      switch (this .getSelectedKeyframes () .length)
      {
         case 0:
            return;
         case 1:
            Editor .undoManager .beginUndo (_("Delete Keyframe"));
            break;
         default:
            Editor .undoManager .beginUndo (_("Delete Keyframes"));
            break;
      }

      this .removeKeyframes (this .getSelectedKeyframes ());
      this .registerClearSelectedKeyframes ();

      Editor .undoManager .endUndo ();
   }

   moveKeyframes (keyframes, distance)
   {
      switch (keyframes .length)
      {
         case 0:
            return;
         case 1:
            Editor .undoManager .beginUndo (_("Move Keyframe"));
            break;
         default:
            Editor .undoManager .beginUndo (_("Move Keyframes"));
            break;
      }

      const
         removed = [ ],
         added   = [ ];

      // Sort keyframes in descending order.
      keyframes = keyframes
         .sort (({ index: a }, { index: b }) => b - a)
         .map (keyframe => Object .assign (keyframe, { keyframe }));

      for (const { interpolator, index, keyframe } of keyframes)
         removed .push (Object .assign (this .removeKeyframeFromInterpolator (interpolator, index), { keyframe }));

      // Sort keyframes in ascending order.
      removed .sort (({ index: a }, { index: b }) => a - b);

      for (const { interpolator, frame, keyType, value, keyframe } of removed)
      {
         const newFrame = frame + distance;

         if (newFrame < 0 || newFrame > this .getDuration ())
            continue;

         if (interpolator ._value_changed instanceof X3D .X3DArrayField)
         {
            const components = this .#components .get (interpolator .getType () .at (-1));
            const keySize    = interpolator .getMetaData ("Interpolator/keySize", new X3D .SFInt32 ());

            if (keySize .getValue () === 0)
            {
               keySize .setValue (value .length / components);

               Editor .setNodeMetaData (interpolator, "Interpolator/keySize", keySize);
            }
         }

         const index = this .addKeyframeToInterpolator (interpolator, newFrame, keyType, value);

         added .push (Object .assign (keyframe, { index }));
      }

      for (const interpolator of new Set (keyframes .map (({ interpolator }) => interpolator)))
         this .updateInterpolator (interpolator);

      this .registerClearSelectedKeyframes ();
      this .setSelectedKeyframes (added);
      this .setSelectionRange (0, 0);

      Editor .undoManager .endUndo ();
   }

   registerRequestDrawTimeline ()
   {
      Editor .undoManager .beginUndo (_("Request Draw Tracks"));

      this .requestDrawTimeline ();

      Editor .undoManager .registerUndo (() =>
      {
         this .registerRequestDrawTimeline ();
      });

      Editor .undoManager .endUndo ();
   }

   showArraySizeErrorDialog (keySize)
   {
      console .error (_(`The key size has changed!`));
      console .error (_(`The number of values must remain consistent throughout the animation. Set size is ${keySize}.`));
   }

   // Player

   firstFrame ()
   {
      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
         this .setCurrentFrame (0);
      else
         this .setCurrentFrame (selectionRange [0]);
   }

   lastFrame ()
   {
      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
         this .setCurrentFrame (this .getDuration ());
      else
         this .setCurrentFrame (selectionRange [1]);
   }

   previousFrame ()
   {
      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
      {
         if (this .getCurrentFrame () === 0)
            this .lastFrame ();
         else
            this .setCurrentFrame (Math .max (this .getCurrentFrame () - 1, 0));
      }
      else
      {
         if (this .getCurrentFrame () <= selectionRange [0])
            this .lastFrame ();
         else
            this .setCurrentFrame (Math .max (this .getCurrentFrame () - 1, 0));
      }
   }

   nextFrame ()
   {
      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
      {
         if (this .getCurrentFrame () === this .getDuration ())
            this .firstFrame ()
         else
            this .setCurrentFrame (Math .min (this .getCurrentFrame () + 1, this .getDuration ()));
      }
      else
      {
         if (this .getCurrentFrame () >= selectionRange [1])
            this .firstFrame ()
         else
            this .setCurrentFrame (Math .min (this .getCurrentFrame () + 1, this .getDuration ()));
      }
   }

   toggleAnimation ()
   {
      require ("../Application/Window") .requestAutoSave ();

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
      require ("../Controls/AnimationPropertiesPopover");

      this .propertiesIcon .animationPropertiesPopover (this);
   }

   updateRange ()
   {
      if (!this .timeSensor)
         return;

      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
      {
         this .timeSensor ._range [1] = 0;
         this .timeSensor ._range [2] = 1;
      }
      else
      {
         const duration = this .getDuration ();

         this .timeSensor ._range [1] = selectionRange [0] / duration;
         this .timeSensor ._range [2] = selectionRange [1] / duration;
      }
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

      this .requestDrawTimeline ();
   }

   // Navigation Function Handlers

   on_keydown (event)
   {
      // console .log (event .key);

      switch (event .key)
      {
         case " ":
         {
            this .toggleAnimation ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "ArrowLeft":
         {
            this .previousFrame ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "ArrowRight":
         {
            this .nextFrame ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "ArrowDown":
         {
            this .firstFrame ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "ArrowUp":
         {
            this .lastFrame ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "-":
         {
            this .zoomOut ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "+":
         {
            this .zoomIn ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "0":
         {
            this .zoomFit ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "1":
         {
            this .zoom100 ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
         case "a":
         {
            if (event .metaKey || event .ctrlKey)
            {
               if (event .shiftKey)
               {
                  this .setSelectedKeyframes ([ ]);
                  this .setSelectionRange (0, 0);
               }
               else
               {
                  this .setSelectionRange (0, this .getDuration ());
               }

               event .preventDefault ();
               event .stopPropagation ();
            }

            break;
         }
         case "x":
         {
            if (event .metaKey || event .ctrlKey)
            {
               this .cutKeyframes ();

               event .preventDefault ();
               event .stopPropagation ();
            }

            break;
         }
         case "c":
         {
            if (event .metaKey || event .ctrlKey)
            {
               this .copyKeyframes ();

               event .preventDefault ();
               event .stopPropagation ();
            }

            break;
         }
         case "v":
         {
            if (event .metaKey || event .ctrlKey)
            {
               this .pasteKeyframes ();

               event .preventDefault ();
               event .stopPropagation ();
            }

            break;
         }
         case "Backspace":
         {
            this .deleteKeyframes ();

            event .preventDefault ();
            event .stopPropagation ();
            break;
         }
      }
   }

   zoomOut ()
   {
      const x = this .getPointerFromFrame (this .getCurrentFrame ());

      this .zoom ("out", x, this .SCROLL_FACTOR);
   }

   zoomIn ()
   {
      const x = this .getPointerFromFrame (this .getCurrentFrame ());

      this .zoom ("in", x, this .SCROLL_FACTOR);
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
      this .setScale (this .getFitScale ());
      this .setTranslation (0);
   }

   registerZoomFit ()
   {
      Editor .undoManager .beginUndo (_("Zoom Fit"));

      setTimeout (() => this .zoomFit ());

      Editor .undoManager .registerUndo (() =>
      {
         this .registerZoomFit ();
      });

      Editor .undoManager .endUndo ();
   }

   zoom100 ()
   {
      const
         frame = this .getCurrentFrame (),
         x     = this .getPointerFromFrame (frame);

      this .setScale (this .DEFAULT_SCALE);
      this .setTranslation (x - frame * this .DEFAULT_SCALE);
   }

   // Timeline Properties

   TIMELINE_PADDING    = 15;         // in pixels
   FRAME_SIZE          = 7;          // in pixels
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

      this .requestDrawTimeline ();
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
      const max   = width - (this .getDuration () * this .getScale ());

      translation = Math .max (translation, max);
      translation = Math .min (translation, 0);

      this .translation = translation;

      this .updateScrollbar ();
      this .requestDrawTimeline ();
   }

   getScale ()
   {
      return this .scale;
   }

   setScale (scale)
   {
      this .scale = Math .max (Math .min (scale, this .MIN_SCALE), this .getFitScale ());

      this .updateScrollbar ();
      this .requestDrawTimeline ();
   }

   getFitScale ()
   {
      return this .getWidth () / this .getDuration ();
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
      return Math .floor (this .timelineElement .width () - this .TIMELINE_PADDING * 2);
   }

   // Update Tracks

   #button;

   on_mousedown (event)
   {
      $(document)
         .on ("mousemove.AnimationEditor", event => this .updatePointer (event))
         .on ("mouseup.AnimationEditor",   event => this .on_mouseup (event))
         .on ("mousemove.AnimationEditor", event => this .on_mousemove (event));

      this .#button = event .button;

      switch (this .#button)
      {
         case 0:
         {
            this .updatePointer (event);
            this .addAutoScroll ();

            const pickedKeyframes = this .pickKeyframes ();

            this .startMovingFrame = this .getFrameFromPointer (this .pointer .x);

            if (!event .shiftKey && !pickedKeyframes .length)
               this .clearSelectedKeyframes ();

            if ((event .shiftKey || !this .getSelectedKeyframes () .length) && pickedKeyframes .length)
            {
               this .togglePickedKeyframes (pickedKeyframes);
            }
            else if (event .shiftKey)
            {
               const frame = this .getFrameFromPointer (this .pointer .x);

               this .setPickedKeyframes ([ ]);
               this .setSelectedKeyframes ([ ]);
               this .expandSelectionRange (frame);
            }
            else
            {
               if (!pickedKeyframes .length || !pickedKeyframes .every (p => this .getSelectedKeyframes () .some (s => this .equalKeyframe (p, s))))
               {
                  const frame = this .getFrameFromPointer (this .pointer .x);

                  this .setPickedKeyframes (pickedKeyframes);
                  this .setSelectedKeyframes (pickedKeyframes);
                  this .setSelectionRange (frame, frame);
               }
               else
               {
                  this .setPickedKeyframes (this .getSelectedKeyframes ());
               }
            }
            break;
         }
      }
   }

   on_mouseup (event)
   {
      $(document) .off (".AnimationEditor");

      this .updatePointer (event);
      this .removeAutoScroll ();

		if (this .#movingKeyframesOffset)
		 	this .moveKeyframes (this .getSelectedKeyframes (), this .#movingKeyframesOffset);

		this .#button                = undefined;
      this .#movingKeyframesOffset = 0;
   }

   on_mousemove (event)
   {
      switch (this .#button)
      {
         case undefined:
         {
            this .updatePointer (event);
            this .updateCursor ();
            break;
         }
         case 0:
         {
            this .updatePointer (event);
            this .moveOrSelectKeyframes (event);
            break;
         }
      }
   }

   on_wheel (event)
   {
      const deltaY = event .originalEvent .deltaY;

      this .updatePointer (event);
      this .zoom (deltaY > 0 ? "out" : "in", this .pointer .x, this .WHEEL_SCROLL_FACTOR);
   }

   updateCursor ()
   {
      if (this .pickKeyframes () .length)
         this .timelineElement .addClass ("pointer");
      else
         this .timelineElement .removeClass ("pointer");
   }

   pointer = new X3D .Vector2 (-1, -1);

   clearPointer ()
   {
      this .pointer .set (-1, -1);

      this .requestDrawTimeline ();
   }

   updatePointer (event)
   {
      const offset = this .tracks .offset ();

      const x = event .pageX - offset .left - this .getLeft ();
      const y = event .pageY - offset .top;

      this .pointer .set (x, y);

      this .requestDrawTimeline ();
   }

   getFrameFromPointer (x)
   {
	   const frame = Math .round ((x - this .getTranslation ()) / this .getScale ());

      return X3D .Algorithm .clamp (frame, 0, this .getDuration ());
   }

   getPointerFromFrame (frame)
   {
      return frame * this .getScale () + this .getTranslation ();
   }

   pickKeyframes ()
   {
      const
         width        = this .getWidth (),
         translation  = this .getTranslation (),
         scale        = this .getScale (),
         trackOffsets = this .memberList .getTrackOffsets (),
         firstFrame   = Math .max (0, Math .floor (-translation / scale)),
         lastFrame    = Math .min (this .getDuration (), Math .ceil ((width - translation) / scale)) + 1,
         keyframes    = [ ];

      for (const { item, bottom } of trackOffsets .values ())
      {
         switch (item .attr ("type"))
         {
            case "main":
            {
               for (const field of this .fields .keys ())
                  this .pickKeyframe (field, firstFrame, lastFrame, bottom - this .TRACK_PADDING, keyframes);

               break;
            }
            case "node":
            {
               const node = item .data ("node");

               for (const field of node .getFields ())
                  this .pickKeyframe (field, firstFrame, lastFrame, bottom - this .TRACK_PADDING, keyframes);

               break;
            }
            case "field":
            {
               this .pickKeyframe (item .data ("field"), firstFrame, lastFrame, bottom - this .TRACK_PADDING, keyframes);
               break;
            }
         }
      }

      return keyframes;
   }

   #frameBox = new X3D .Box2 ();
   #frameSize = new X3D .Vector2 (this .FRAME_SIZE, this .FRAME_SIZE);
   #frameCenter = new X3D .Vector2 ();

   pickKeyframe (field, firstFrame, lastFrame, bottom, keyframes)
   {
      const interpolator = this .fields .get (field);

      if (!interpolator)
         return;

      this .#defaultIntegers .length = 0;

      const
		   key   = interpolator .getMetaData ("Interpolator/key", this .#defaultIntegers),
		   first = X3D .Algorithm .lowerBound (key, 0, key .length, firstFrame),
		   last  = X3D .Algorithm .upperBound (key, 0, key .length, lastFrame);

      for (let index = first; index < last; ++ index)
		{
         const frame = key [index];
         const x     = Math .floor (this .getPointerFromFrame (frame)) + 0.5;
         const y     = Math .floor (bottom - this .FRAME_SIZE / 2) + 0.5;

         this .#frameBox .set (this .#frameSize, this .#frameCenter .set (x, y));

         if (this .#frameBox .containsPoint (this .pointer))
            keyframes .push ({ field, interpolator, index });
		}
   }

   #pickedKeyframes = [ ];
   #selectedKeyframes = [ ];
   #movingKeyframesOffset = 0;

   getPickedKeyframes ()
   {
      return this .#pickedKeyframes;
   }

   setPickedKeyframes (pickedKeyframes)
   {
      this .#pickedKeyframes = pickedKeyframes .slice ();
   }

   togglePickedKeyframes (pickedKeyframes)
   {
      // Picked Keyframes
      {
         const add = pickedKeyframes .filter (n => this .getPickedKeyframes () .every (o => !this .equalKeyframe (n, o)));

         this .setPickedKeyframes (this .getPickedKeyframes ()
            .filter (o => !pickedKeyframes .some (n => this .equalKeyframe (n, o)))
            .concat (add));
      }

      // Selected Keyframes
      {
         const add = pickedKeyframes .filter (n => this .getSelectedKeyframes () .every (o => !this .equalKeyframe (n, o)));

         this .setSelectedKeyframes (this .getSelectedKeyframes ()
            .filter (o => !pickedKeyframes .some (n => this .equalKeyframe (n, o)))
            .concat (add));
      }
   }

   equalKeyframe (a, b)
   {
      return a .field === b .field && a .index === b .index;
   }

   getSelectedKeyframes ()
   {
      return this .#selectedKeyframes;
   }

   setSelectedKeyframes (selectedKeyframes)
   {
      this .#selectedKeyframes = selectedKeyframes .slice ();

      this .updateKeyType ();
   }

   clearSelectedKeyframes ()
   {
      this .#selectedKeyframes = [ ];

      this .updateKeyType ();
   }

   registerClearSelectedKeyframes ()
   {
      Editor .undoManager .beginUndo (_("Clear Selected Keyframes"));

      this .setPickedKeyframes ([ ]);
      this .setSelectedKeyframes ([ ]);

      Editor .undoManager .registerUndo (() =>
      {
         this .registerClearSelectedKeyframes ();
      });

      this .registerRequestDrawTimeline ();

      Editor .undoManager .endUndo ();
   }

   #autoScrollId;

   addAutoScroll ()
   {
      this .#autoScrollId = setInterval (() => this .autoScroll (), 100);
   }

   removeAutoScroll ()
   {
      clearInterval (this .#autoScrollId);
   }

   autoScroll ()
   {
      // Autoscroll area.

      const width = this .getWidth ();

      if (this .pointer .x < 0)
      {
         this .setTranslation (this .getTranslation () - this .pointer .x);
         this .moveOrSelectKeyframes ();
      }
      else if (this .pointer .x > width)
      {
         this .setTranslation (this .getTranslation () - (this .pointer .x - width));
         this .moveOrSelectKeyframes ();
      }
   }

   #selectionRange = [0, 0];

   getSelectionRange ()
   {
      const [a, b] = this .#selectionRange;

      if (a < b)
         return [a, b];

      return [b, a];
   }

   setSelectionRange (start, end)
   {
      this .#selectionRange = [start, end];

      const frame = start === end
         ? this .getCurrentFrame ()
         : X3D .Algorithm .clamp (this .getCurrentFrame (), start, end);

      this .setCurrentFrame (frame);
      this .updateRange ();
      this .selectKeyframesInRange ();
      this .requestDrawTimeline ();
   }

   expandSelectionRange (frame)
   {
      const
         selectionRange = this .getSelectionRange (),
         middle         = (selectionRange [0] + selectionRange [1]) / 2;

      if (frame < middle)
         this .setSelectionRange (frame, selectionRange [1]);
      else if (frame > middle)
         this .setSelectionRange (selectionRange [0], frame);
   }

   selectKeyframesInRange ()
   {
      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] === selectionRange [1])
         return;

      const selectedKeyframes = [ ];

      for (const [field, interpolator] of this .fields)
      {
         const
            key   = interpolator .getMetaData ("Interpolator/key", this .#defaultIntegers),
            first = X3D .Algorithm .lowerBound (key, 0, key .length, selectionRange [0]),
            last  = X3D .Algorithm .upperBound (key, 0, key .length, selectionRange [1]);

         for (let index = first; index < last; ++ index)
            selectedKeyframes .push ({ field, interpolator, index });
      }

      this .setSelectedKeyframes (selectedKeyframes);
      this .requestDrawTimeline ();
   }

   moveOrSelectKeyframes (event)
   {
      // Move keyframes or select range.

      const frame = this .getFrameFromPointer (this .pointer .x);

      if (this .getPickedKeyframes () .length)
      {
         this .#movingKeyframesOffset = frame - this .startMovingFrame;
      }
      else
      {
         // Select range.

         if (event ?.shiftKey)
            this .expandSelectionRange (frame);
         else
            this .setSelectionRange (this .#selectionRange [0], frame);
      }
   }

   /* Scrollbar Handling */

   MIN_SCROLLBAR_SCALE = 0.05; // in fractions

   #scrollButton;
   #scrollStart;
   #scrollLeft;

   on_mousedown_scrollbar (event)
   {
      $(document)
         .on ("mouseup.AnimationEditorScrollbar",   event => this .on_mouseup_scrollbar (event))
         .on ("mousemove.AnimationEditorScrollbar", event => this .on_mousemove_scrollbar (event));

      this .#scrollButton = event .button;
      this .#scrollStart  = event .pageX;
      this .#scrollLeft   = parseFloat (this .scrollbarElement .css ("left"));

      event .preventDefault ();
      event .stopPropagation ();
   }

   on_mouseup_scrollbar (event)
   {
      $(document) .off ("mouseup.AnimationEditorScrollbar");

      this .#scrollButton = undefined;
   }

   on_mousemove_scrollbar (event)
   {
      if (this .#scrollButton === undefined)
         return;

      const
         scale                = this .getScale (),
         duration             = this .getDuration (),
         width                = this .getWidth (),
         visibleFrames        = Math .min (width / scale, duration),
         scrollbarTranslation = event .pageX - this .#scrollStart,
         scrollbarWidth       = this .timelineElement .width () - this .scrollbarElement .width (),
         scrollbarLeft        = X3D .Algorithm .clamp (this .#scrollLeft + scrollbarTranslation, 0, scrollbarWidth),
         translation          = -scrollbarLeft / scrollbarWidth * (duration - visibleFrames) * scale;

      if (scrollbarWidth)
         this .setTranslation (translation);

      event .preventDefault ();
      event .stopPropagation ();
   }

   updateScrollbar ()
   {
      const translation    = this .getTranslation ();
      const scale          = this .getScale ();
      const duration       = this .getDuration ();
      const width          = this .getWidth ();
      const firstFrame     = Math .max (0, -translation / scale);
      const visibleFrames  = Math .min (width / scale, duration);
      const scrollbarScale = X3D .Algorithm .clamp (this .getFitScale () / scale, this .MIN_SCROLLBAR_SCALE, 1);
      const scrollbarWidth = this .timelineElement .width () - this .timelineElement .width () * scrollbarScale;
      const scrollbarLeft  = Math .max (firstFrame / (duration - visibleFrames) * scrollbarWidth, 0);

      if (duration === visibleFrames)
      {
         this .scrollbarElement
            .css ("left", 0)
            .css ("width", "100%");
      }
      else
      {
         this .scrollbarElement
            .css ("left", scrollbarLeft)
            .css ("width", `${scrollbarScale * 100}%`);
      }
   }

   /* Timeline Draw Handling */

   resizeTimeline ()
   {
      const
         tracksWidth  = this .tracks .width (),
         tracksHeight = this .tracks .height ();

      this .tracks
         .prop ("width",  tracksWidth)
         .prop ("height", tracksHeight);

      this .timelineClip = new Path2D ();
      this .timelineClip .rect (this .getLeft () - this .FRAME_SIZE, 0, this .getWidth () + this .FRAME_SIZE * 2, tracksHeight);

      this .drawTimeline ();
   }

   #updateTracksId = undefined;

   requestDrawTimeline ()
   {
      clearTimeout (this .#updateTracksId);

      this .#updateTracksId = setTimeout (() => this .drawTimeline ());
   }

   #style = window .getComputedStyle ($("body") [0]);

   TRACK_PADDING = 8;

   drawTimeline ()
   {
      const
         context      = this .tracks [0] .getContext ("2d"),
         tracksWidth  = this .tracks .width (),
         tracksHeight = this .tracks .height ();

      context .clearRect (0, 0, tracksWidth, tracksHeight);

      if (!this .animation)
         return;

      const
         left         = this .getLeft (),
         width        = this .getWidth (),
         translation  = this .getTranslation (),
         scale        = this .getScale (),
         trackOffsets = this .memberList .getTrackOffsets (),
         firstFrame   = Math .max (0, Math .floor (-translation / scale)),
         lastFrame    = Math .min (this .getDuration (), Math .ceil ((width - translation) / scale)) + 1;

		const [frameStep, frameFactor] = this .getFrameParams ();

      const
         blue   = this .#style .getPropertyValue ("--system-blue"),
         indigo = this .#style .getPropertyValue ("--system-indigo"),
         orange = this .#style .getPropertyValue ("--system-orange"),
         brown  = this .#style .getPropertyValue ("--system-brown"),
         red    = this .#style .getPropertyValue ("--system-red"),
         range  = this .#style .getPropertyValue ("--selection-range"),
         tint1  = this .#style .getPropertyValue ("--tint-color1"),
         tint2  = this .#style .getPropertyValue ("--tint-color2");

      // Draw selection range.

      context .save ();
      context .clip (this .timelineClip);

      const selectionRange = this .getSelectionRange ();

      if (selectionRange [0] !== selectionRange [1])
      {
         const minFrame = X3D .Algorithm .clamp (selectionRange [0], firstFrame, lastFrame - 1);
         const maxFrame = X3D .Algorithm .clamp (selectionRange [1], firstFrame, lastFrame - 1);
         const x0       = left + minFrame * scale + translation;
         const x1       = left + maxFrame * scale + translation;

         context .fillStyle = range;

         context .fillRect (Math .min (x0, x1) - 1, 0, Math .abs (x1 - x0) + 3, tracksHeight);
      }

      context .restore ();

      // Draw all tracks.

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

         const hover = this .pointer .y > top && this .pointer .y < bottom;

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
         context .lineWidth   = item .is (".main, .node") ? 3 : 1;

			for (let frame = firstFrame - (firstFrame % frameStep); frame < lastFrame; frame += frameStep)
			{
				const s = frame % frameFactor; // size (large or small)
            const y = Math .floor (top + height * (s ? 0.75 : 0.5));
				const x = Math .floor (left + this .getPointerFromFrame (frame));

            context .beginPath ();
				context .moveTo (x + 0.5, y - this .TRACK_PADDING);
				context .lineTo (x + 0.5, bottom - this .TRACK_PADDING);
            context .stroke ();
			}

         // Draw keyframes.

         switch (item .attr ("type"))
         {
            case "main":
            {
               for (const field of this .fields .keys ())
                  this .drawKeyframes (context, field, firstFrame, lastFrame, bottom - this .TRACK_PADDING, brown);

               break;
            }
            case "node":
            {
               const node = item .data ("node");

               for (const field of node .getFields ())
                  this .drawKeyframes (context, field, firstFrame, lastFrame, bottom - this .TRACK_PADDING, brown);

               break;
            }
            case "field":
            {
               this .drawKeyframes (context, item .data ("field"), firstFrame, lastFrame, bottom - this .TRACK_PADDING, orange);
               break;
            }
         }

         // Draw selected keyframes.

         switch (item .attr ("type"))
         {
            case "main":
            {
               const fields = new Set (this .fields .keys ())

               this .drawSelectedKeyframes (context, fields, bottom - this .TRACK_PADDING, red);
               break;
            }
            case "node":
            {
               const
                  node   = item .data ("node"),
                  fields = new Set (node .getFields ());

               this .drawSelectedKeyframes (context, fields, bottom - this .TRACK_PADDING, red);
               break;
            }
            case "field":
            {
               const fields = new Set ([item .data ("field")]);

               this .drawSelectedKeyframes (context, fields, bottom - this .TRACK_PADDING, red);
               break;
            }
         }

         context .restore ();
      }

      // Draw current frame cursor.

      context .save ();
      context .clip (this .timelineClip);

      const frame = this .getCurrentFrame ();
      const x     = Math .floor (left + this .getPointerFromFrame (frame));

      context .fillStyle = blue;

      context .fillRect (x - 1, 0, 3, tracksHeight);

      context .restore ();
   }

   #defaultIntegers = new X3D .MFInt32 ();
   #frames = [ ];

   drawKeyframes (context, field, firstFrame, lastFrame, bottom, color)
   {
      const interpolator = this .fields .get (field);

      if (!interpolator)
         return;

      this .#defaultIntegers .length = 0;

      const left = this .getLeft ();

      const
		   key   = interpolator .getMetaData ("Interpolator/key", this .#defaultIntegers),
		   first = X3D .Algorithm .lowerBound (key, 0, key .length, firstFrame),
		   last  = X3D .Algorithm .upperBound (key, 0, key .length, lastFrame);

      for (let index = first; index < last; ++ index)
		{
         const frame = key [index];
         const x     = Math .floor (left + this .getPointerFromFrame (frame));
			const x1    = x - (this .FRAME_SIZE / 2) + 0.5;

			context .fillStyle = color;

         context .fillRect (x1, bottom - this .FRAME_SIZE, this .FRAME_SIZE, this .FRAME_SIZE);
		}
   }

   drawSelectedKeyframes (context, fields, bottom, selectedColor)
   {
      if (!this .getSelectedKeyframes () .length)
         return;

      const
         left   = this .getLeft (),
         frames = this .#frames;

      frames .length = 0;

      // Count keyframes to avoid overdrawing.

      for (const field of fields)
      {
         const interpolator = this .fields .get (field);

         if (!interpolator)
            continue;

         this .#defaultIntegers .length = 0;

         const key = interpolator .getMetaData ("Interpolator/key", this .#defaultIntegers);

         for (const frame of key)
            frames [frame] = (frames [frame] ?? 0) + 1;
      }

      // Draw keyframes.

      for (const { field, interpolator, index } of this .getSelectedKeyframes ())
      {
         if (!fields .has (field))
            continue

         this .#defaultIntegers .length = 0;

         const key   = interpolator .getMetaData ("Interpolator/key", this .#defaultIntegers);
         const frame = key [index];

         if (-- frames [frame])
            continue;

         const moving = frame + this .#movingKeyframesOffset;
         const x      = Math .floor (left + this .getPointerFromFrame (moving));
         const x1     = x - (this .FRAME_SIZE / 2) + 0.5;

         context .fillStyle = selectedColor;

         context .fillRect (x1, bottom - this .FRAME_SIZE, this .FRAME_SIZE, this .FRAME_SIZE);
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
