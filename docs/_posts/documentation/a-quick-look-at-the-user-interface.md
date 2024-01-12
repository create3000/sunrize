---
title: A Quick Look at the User Interface
date: 2024-01-12
nav: documentation
categories: [documentation]
tags: [Outline Editor]
---
The user interface consists of four main parts: Menubar, Dashboard, Sidebar, and Footer. These all have special task which will be explained here.

## Menubar

### File Menu

- **New File:** opens a new tab and creates a new empty scene.
- **Open:** opens and reads a scene saved in X3D and related formats.
- **Open Location:** opens a web location and reads a scene.
- **Open Recent:** opens a tab with the recently opened files.
- **Save:** saves the scene in X3D format (.x3d, .x3dv or .x3dj).
- **Save As:** saves the current scene under a new filename.
- **Save A Copy:** saves the current scene under a new filename without affecting the current file.
- **Auto Save:** toggle auto save on/off.
- **Export As:** exports the current scene as HTML page.
- **Scene Properties:** edit scene properties like units and world information.
- **Close Window:** exits Sunrize.

### Edit Menu

- **Undo:** undoes each previous operation in a linear succession. You may "rewind" back any number of steps until you opened the file.
- **Redo:** redoes what was just undone, if applicable.
- **Undo History:** opens the Undo History editor where every single undo step is listed.
- **Cut:** removes the selected objects from the scene, and retains it in the clipboard for further use.
- **Copy:** copies the selected items into the clipboard for further use.
- **Paste:** pastes a new copy of objects from the clipboard into the scene.
- **Delete:** removes the selected items from the scene

### View

- **Menubar:** toggle menubar on/off
- **Toolbar:** toggle toolbar on/off
- **Sidebar:** toggle sidebar with the Viewpoint List, History, Library and Outline Editor on/off
- **Footer:** toggle footer area with the Console on/off
- **Environment**
  - **Browser:** switch to browser mode to view and test your application
  - **Editor:** switch to editor mode to edit arange and compose your content
- **Motion Blur:** opens a dialog where motion blur can be enabled to display the scene more realistic.
- **Shading**
  - **Phong:** switch to phong shading (supported in X\_ITE Compatibility Mode)
  - **Gouraud:** switch to Gouraud shading, this is the default shading when opening a world
  - **Flat:** switch to flat shading
  - **Wireframe:** switch to wireframe
  - **Pointset:** switch to pointset
- **Primitive Quality**
  - **High:** switch to highest primitive quality
  - **Medium:** switch to medium primitive quality
  - **Low:** switch to lowest primitive quality
- **Texture Quality**
  - **High:** switch to highest texture quality
  - **Medium:** switch to medium texture quality
  - **Low:** switch to lowest texture quality
- **Show/Hide Environmental Effects**
  - **Backgrounds:** toggles between showing and hiding background nodes added to the scene.
  - **Fogs:** toggles between showing and hiding fog nodes added to the scene.
- **Show/Hide Object Icons:** toggles between hiding or showing all object icons in the scene; these include objects like proximity sensors and visibility sensors.
- **Display Rubberband:** toggle the display of the rubberband when the Walk Viewer is active.
- **Rendering Properties:** toggle the display of the rendering properties on/off. This provides you with useful information about your system.
- **Fullscreen:** toggle fullscreen, you can leave the full screen mode again by pressing the *F11* key

### Selection

- **Select All:** selects all top-level objects in the scene.
- **Deselect All:** deselects all objects in the scene.
- **Hide Selected Objects:** hides selected objects from view.
- **Hide Unselected Objects:** hides all unselected objects from view.
- **Show Selected Objects:** shows all selected objects that were hidden by choosing *»Hide Selected Objects«*.
- **Show All Objects:** displays any objects that were hidden using *»Hide Selected Objects«.*
- **Select Lowest:** toggle between the selection of the lowest level object picked or the selection of the highest level parent group that contains the picked objects.
- **Follow Primary Selection:** automatically expand the tree in the Outline Editor to what is currently selected.
- **Static Transform Tool:** toggles between static and dynamic Transform Tool. The dynamic Transform Tool has fixed axes. If static is enabled the the axes are scaled depending on the distance of the currently bound viewpoint.

### Geometry

- **Union:** unites one ore more IndexedFaceSet nodes together leaving one visible polygons.
- **Difference:** subtracts one ore more IndexedFaceSet nodes from the first selection.
- **Intersection:** combines one ore more IndexedFaceSet nodes together leaving only the intersection of the selected nodes.
- **Combine:** combines all selected geometries into one object.
- **Transform To Zero:** sets all field of the Transform nodes in the selected hierarchy to their default values and applies the transformation to the coordinate points.

### Layout

- **Browser Size:** set aspect ratio of browser size.
- **Background Image:** opens a dialog to set a background images for multi view browsers (top, right, front, …). This can be helpful for constructing a polygon object.
- **Activate Grid Layout Tool:** displays a rectangular grid as construction aid.
- **Activate Angle Layout Tool:** displays a circular grid as construction aid.
- **Grid Properties:** opens a dialog with advanced properties where either Grid and Angle Layout Tool can be adjusted to fit your needs.
- **Activate Snap Target:** places the yellow Snap Target in the scene.
- **Activate Snap Source:** places the green Snap Source arrow in the scene.
- **Center Snap Target in Selection:** centers snap target in the middle of the nearest plane of the
  selected object.
- **Move Selection to Snap Target:** moves a face of the selected object to the Snap Target.
- **Move Selection Center to Snap Target:** moves the selected object's center to the Snap
  Target.

### Help

- **X\_ITE Compatibility:** enable this feature to force Sunrize to provide at least exactly the same functionality and rendering effects as in X\_ITE.
- **Info:** shows version information about Sunrize.

## Dashboard

![hand](http://www.create3000.de/wp-content/uploads/2017/08/hand.png)**Examine:** navigate in the scene as if in browser mode.

![arrow](http://www.create3000.de/wp-content/uploads/2017/08/arrow.png)**Select:** manipulate and edit objects.

![media play](http://www.create3000.de/wp-content/uploads/2017/08/media-play.png) **Toggle live mode:** enables/disables active objects; these includes objects like TimeSensor, Script nodes and key device sensor nodes.

![hierarchy up](http://www.create3000.de/wp-content/uploads/2017/08/hierarchy-up.png)**Select parent:** Selects the immediate parent of the current selection.

![hierarchy down](http://www.create3000.de/wp-content/uploads/2017/08/hierarchy-down.png)**Select child:** selects the next lower child objects within the selected &lt;link 67 - internal-link "Opens internal link in current window"&gt;group in the hierarchy.&lt;/link&gt;

![navigation button](http://www.create3000.de/wp-content/uploads/2017/08/navigation-button.png)**Viewer type menu:** select available viewers here.

![straighten](http://www.create3000.de/wp-content/uploads/2017/08/straighten.png)**Straighten camera:** click to place your view upright and level in the world.

![look at selection](http://www.create3000.de/wp-content/uploads/2017/08/look-at-selection.png)**Look at selected objects:** click to move the camera to a position where all selected objects are visible.

![look at all](http://www.create3000.de/wp-content/uploads/2017/08/look-at-all.png)**View all:** click to move the camera to a position where all objects are visible.

![look at](http://www.create3000.de/wp-content/uploads/2017/08/look-at.png)**Look At:** click and then click an object in the scene to go directly to it.

**Note:** X3D authors can control the visibility of the dashboard.

## Sidebar Pane

### Outline Editor

The Outline Editor is a very powerful editor, it lets you edit nodes and field, you can create routes and clones, manage prototypes and imported and exported nodes. Have a look at [Using the Outline Editor](http://create3000.de/titania/documentation/using-the-outline-editor/) for more information.

![sidebar-outline-editor](http://www.create3000.de/wp-content/uploads/2017/08/sidebar-outline-editor.png)

Outline Editor with Scene Graph

## Footer

### Console

Displays the X3D console. In the console are errors or warnings shown when encountered in the world. The console also shows JavaScript debugging output from the »print« command.

![console](http://www.create3000.de/wp-content/uploads/2017/08/console.png)

### Script Editor

The Script Editor allows you to create and edit scripts that run within your scene. With the Script Editor you can easily edit Script and shader source code. **Tip:** Add, remove and edit Script and shader fields in the Node Properties Editor.

![script-editor-1](http://www.create3000.de/wp-content/uploads/2017/08/script-editor-1.png)

Scripts are written in ECMAScript, a lightweight, platform-independent programming language that is very similar to JavaScript. ECMAScript provides functions that are called when events come into the script, access to fields within the script, logic to operate on the fields, and the ability to send events from the script.

Shaders are written in OpenGL Shading Language (GLSL), a high-level shading language based on the syntax of the C programming language. With GLSL you can code (right up to) short programs, called shaders, which are executed on the GPU. With Shaders you are able for instance to write your own lighting model. But that's only one feature of shaders. There are thousands of other really nice possibilities: Shadows, Environment Mapping, Per-Pixel Lighting, Bump Mapping, Parallax Bump Mapping, HDR, and much more!

Have a look at [Using the Script Editor](http://create3000.de/titania/documentation/script-editor/) for more information.

## Keyboard Shortcuts and Tricks

### Open, Import, Save

- New = ***Ctrl+n***
- Open = ***Ctrl+o***
- Import = ***Ctrl+i***
- Save = ***Ctrl+s***
- Save As = ***Ctrl+Shift+s***
- Quit = ***Ctrl+q***

### View Controls

- Temporarily switch from selection mode to view mode = ***Ctrl+Shift***

### Examiner Viewer

- Rotate camera around objects in scene = ***Click-drag***
- Pan to slide camera left, right, up, down = ***Click-middle-drag***
- Dolly = ***Scroll***

### Walk Viewer

- Move forward or back, turn left or right = ***Click-drag***
- Look around = ***Ctrl-drag***
- Pan to slide camera left, right, up, down = ***Click-middle-drag***
- Tilt up or down = ***Scroll***
- Move faster = ***Shift-click-drag***

### Plane Viewer

- Dolly = ***Scroll***
- Pan = ***Click-middle-drag***

### Edit

- Undo = ***Ctrl+z***
- Redo = ***Ctrl+Shift+z***
- Cut = ***Ctrl+x***
- Copy = ***Ctrl+c***
- Paste copy = ***Ctrl+v***
- Delete = ***Delete***

### Select &amp; Group

- Select all = ***Ctrl+a***
- Deselect all = ***Ctrl+Shift+a***
- Select multiple = ***Shift-click***

### Layout

- Place yellow Snap Target = ***click middle on object; also drag to place, Shift-drag makes***
  ***target "stick" to features***
- Constrain Snap Target to vertices, edges, centers = ***Shift-click middle on object***
- Place green Snap Source = ***Ctrl-click middle; also drag to place, Shift-drag makes source***
  ***"stick" to features***
- Move selection to snap target = ***Ctrl+m***
- Move selection center to snap target = ***Ctrl+Shift+m***
- Move grid freely = ***drag yellow handles***

### Transform Tool

- Switch between Translate Tool, Rotate Tool, and Scale Tool = ***double click Transform Tool handles***
- Temporarily disable snapping = ***Shift-drag handles***

#### Move (drag arrow handles of manipulator)

- Move along one axis = ***drag arrow handles***
- Move in plane of surface = ***drag bounding box face***
- Constrain move in plane of surface = ***Ctrl-drag bounding box face***
- Nudge along x-axis = ***arrow keys left and right, click Shift to nudge faster***
- Nudge along y-axis = ***arrow keys up and down, click Shift to nudge faster***
- Nudge along z-axis = ***arrow keys Ctrl+up and Ctrl+down, click Ctrl+Shift to nudge faster***

#### Rotate (drag circle handles of manipulator)

- Rotate one axis = ***drag circle handle***
- Constrain rotate one axis = ***Ctrl+drag circle handle***

#### Resize (drag corner boxes of manipulator)

- Uniform scale = **drag**
- Uniform scale from one corner = ***Ctrl-drag corner box***
- Squish &amp; stretch = ***drag axis handles***
- Squish &amp; stretch from one side = ***Ctrl-drag axis handles***

### Outline Editor

- Fully expand node = ***Shift-click node expander arrow***
- Select node = ***Double-click node name***

#### Wiring Routes

- Create a route = ***Click on two mating connectors***
- Remove a route = ***Ctrl-click on connector***
- Follow a route = ***Click small circle next to connector***
- View info on route = ***Shift-click field expander arrow***

## Abbreviations

- ***Ctrl+Shift+u*** means to press at the same time the Ctrl, Shift, and u keys on your keyboard. Keys
  always appear in italics.
- ***Click*** means to quickly press and release the left mouse button.
- ***Click-middle*** means to quickly press and release the middle mouse button.
- ***Drag*** means to press and hold down the left mouse button while dragging the mouse.
- ***Drag-middle*** means to press and hold down the middle mouse button while dragging the
  mouse.

