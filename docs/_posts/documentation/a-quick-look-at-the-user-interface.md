---
title: A Quick Look at the User Interface
date: 2024-01-12
nav: documentation
categories: [documentation]
tags: [User Interface, Outline Editor, Script Editor]
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
- **Cut:** removes the selected objects from the scene, and retains it in the clipboard for further use.
- **Copy:** copies the selected items into the clipboard for further use.
- **Paste:** pastes a new copy of objects from the clipboard into the scene.
- **Delete:** removes the selected items from the scene

### Selection

- **Select All:** selects all top-level objects in the scene.
- **Deselect All:** deselects all objects in the scene.
- **Hide Unselected Objects:** hides all unselected objects from view.
- **Show Selected Objects:** shows all selected objects that were hidden by choosing *»Hide Selected Objects«*.
- **Show All Objects:** displays any objects that were hidden using *»Hide Selected Objects«.*

### View

- **Outline Editor**
  - **Expand ExternProto Declarations:** toggle display of extern-proto scenes
  - **Expand Prototype Instances**: toggle display of prototype instance body
  - **Expand Inline Nodes:** toggle display of Inline nodes internal scenes
- **Primitive Quality**
  - **High:** switch to highest primitive quality
  - **Medium:** switch to medium primitive quality
  - **Low:** switch to lowest primitive quality
- **Texture Quality**
  - **High:** switch to highest texture quality
  - **Medium:** switch to medium texture quality
  - **Low:** switch to lowest texture quality
- **Display Rubberband:** toggle the display of the rubberband when the Walk Viewer is active.
- **Display Timings:** toggle the display of the timings on/off. This provides you with useful information about your system.
- **Show Library:** opens the library window, where you can select nodes to add to your scene.
- **Fullscreen:** toggle fullscreen, you can leave the full screen mode again by pressing the *F11* key

### Layout

- **Browser Size:** set aspect ratio of browser size.

### Help

- **Learn More:** go to Sunrize website.

## Dashboard

>**Tip:** X3D authors can control the visibility of the dashboard.
{: .prompt-tip }

![hand](/assets/img/documentation/hand.png){: .normal }
<br>**Browser:** navigate in the scene as if in browser mode.

![arrow](/assets/img/documentation/arrow.png){: .normal }
<br>**Select:** manipulate and edit objects.

![play](/assets/img/documentation/play.png){: .normal }
<br>**Toggle live mode:** enables/disables active objects; these includes objects like TimeSensor, Script nodes and key device sensor nodes.

![look at selection](/assets/img/documentation/look-at-selection.png){: .normal }
<br>**Look at selected objects:** click to move the camera to a position where all selected objects are visible. If there is no selection, all objects in active layer are displayed.

![straighten](/assets/img/documentation/straighten.png){: .normal }
<br>**Straighten camera:** click to place your view upright and level in the world.

## Sidebar Panel

### Outline Editor

The [Outline Editor](../using-the-outline-editor/) is a very powerful editor, it lets you edit nodes and field, you can create routes and clones, manage prototypes and imported and exported nodes.

![Outline Editor](/assets/img/documentation/sidebar-outline-editor.png){: .w-50 .normal }
<br>Outline Editor with Scene Graph
{: .small }

## Footer

### Console

Displays the X3D console. In the console are errors or warnings shown when encountered in the world. The console also shows JavaScript debugging output from the »print« command.

![Console](/assets/img/documentation/console.png)
<br>Console
{: .small }

### Script Editor

The [Script Editor](../using-the-script-editor/) allows you to create and edit scripts that run within your scene. With the Script Editor you can easily edit Script and shader source code. **Tip:** Add, remove and edit Script and shader fields in the Node Properties Editor.

![Script Editor](/assets/img/documentation/script-editor-glsl.png)
<br>Script Editor
{: .small }

Scripts are written in ECMAScript, a lightweight, platform-independent programming language that is very similar to JavaScript. ECMAScript provides functions that are called when events come into the script, access to fields within the script, logic to operate on the fields, and the ability to send events from the script.

Shaders are written in OpenGL Shading Language (GLSL), a high-level shading language based on the syntax of the C programming language. With GLSL you can code (right up to) short programs, called shaders, which are executed on the GPU. With Shaders you are able for instance to write your own lighting model. But that's only one feature of shaders. There are thousands of other really nice possibilities: Shadows, Environment Mapping, Per-Pixel Lighting, Bump Mapping, Parallax Bump Mapping, HDR, and much more!

## Keyboard Shortcuts and Tricks

### Open, Import, Save

- New = ***Ctrl+n***
- Open = ***Ctrl+o***
- Save = ***Ctrl+s***
- Save As = ***Ctrl+Shift+s***
- Quit = ***Ctrl+q***

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
- Paste = ***Ctrl+v***
- Delete = ***Delete***

### Select &amp; Group

- Select all = ***Ctrl+a***
- Deselect all = ***Ctrl+Shift+a***
- Select multiple = ***Shift-click***

### Transform Tool

- Switch between Translate Tool, Rotate Tool, and Scale Tool = ***double click Transform Tool handles***
- Snap to predefined angles = ***Shift-drag rotation handles***

#### Move (drag arrow handles of manipulator)

- Move along one axis = ***drag arrow handles***
- Move in plane of surface = ***Alt/Option-drag arrow handles***

#### Rotate (drag circle handles of manipulator)

- Rotate one axis = ***drag circle handle***

#### Resize (drag corner boxes of manipulator)

- Uniform scale = ***drag corner handles or Shift-drag axes handles***
- Uniform scale from one corner = ***Alt/Option-drag corner handles***
- Squish &amp; stretch = ***drag axis handles***
- Squish &amp; stretch from one side = ***Alt/Option-drag axis handles***

### Outline Editor

- Fully expand node = ***Shift-click node expander arrow***
- Select node = ***click node name***

#### Wiring Routes

- Create a route = ***Click on two mating connectors***
- Remove a route = ***Ctrl/Command-click on connector***
- Follow a route = ***Click small circle next to connector***
- View info about route = ***Shift-click field expander arrow***

## Abbreviations

- ***Ctrl+Shift+u*** means to press at the same time the Ctrl, Shift, and u keys on your keyboard. Keys
  always appear in italics.
- ***Click*** means to quickly press and release the left mouse button.
- ***Click-middle*** means to quickly press and release the middle mouse button.
- ***Drag*** means to press and hold down the left mouse button while dragging the mouse.
- ***Drag-middle*** means to press and hold down the middle mouse button while dragging the
  mouse.

