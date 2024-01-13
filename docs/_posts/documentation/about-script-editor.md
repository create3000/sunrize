---
title: About Script Editor
date: 2024-01-12
nav: documentation
categories: [documentation]
tags: [Script Editor]
---
The Script Editor allows you create scripts that run within your scene.

>**Tip:** Use the context menu in the Outline Editor to add, remove edit, and rearrange Script and shader fields.
{: .prompt-tip }

A script is written in JavaScript, a lightweight, platform-independent programming language. JavaScript provides functions that are called when events come into the script, access to fields within the script, logic to operate on the fields, and the ability to send events from the script.

![Script Editor](/assets/img/documentation/script-editor-javascript.png)
<small><br>Script Editor</small>

## Description of the Scripting Language

A detailed description of JavaScript and the Script node can be found at:

- <http://www.web3d.org/documents/specifications/19777-1/V3.0/Part1/functions.html>
- <http://www.web3d.org/documents/specifications/19775-1/V4.0/Part01/components/scripting.html>
- <https://developer.mozilla.org/de/docs/JavaScript/Guide>

In Sunrize, the script itself is contained in the url field of the Script node, as a single string. The string must begin with »ecmascript:«. The script defines functions for each *inputOnly* and *inputOutput* fields. Internal fields called *initializeOnly* and *outputOnly* fields can be used as variables.

### Example

Here is a simple example of including a Script node in a X3D file:

```js
#X3D V3.3 utf8

DEF XFORM Transform {
  children [
    Shape {
      geometry Cone { }
    },
    DEF SENSOR TouchSensor { },
    DEF SCRIPT Script {
      inputOnly SFBool set_active
      outputOnly SFFloat fraction_changed
      initializeOnly SFFloat fraction 0
      url "ecmascript:
function set_active (value, time)
{
   if (!value)
   {
     fraction         = fraction + 0.1;
     fraction_changed = fraction;
   }
}"
    },
    DEF INTERP PositionInterpolator {
      keys [0.0, 1.0]
      values [0 0 0, 3 0 0]
    }
  ]
}

ROUTE SENSOR.isActive TO SCRIPT.set_active
ROUTE SCRIPT.fraction_changed TO INTERP.set_fraction
ROUTE INTERP.value_changed TO XFORM.translation
```

## Context Menu of a Script Node

Here's a quick guide to the Context Menu of a Script node or shader:

![add new field](/assets/img/documentation/add-new-field.png){: .normal .w-50 }
<small><br>Add/Edit Field popup editor</small>

- **Context Menu of a Field or Node:**
  - **Add Field:** when you add a field, you can specify its access type, data type and field name.
  - **Edit Field**: edit name, access type and data type of a custom field.
  - **Remove Field** removes the selected field.
  - **Drag & Drop:** to reorder your defined fields to your desired order.

## Creating a Script

>**Find it:** Activate in the footer the **Script Editor** tab. Click the + button in the Script Editor's toolbar.
{: .prompt-info }

Use the Script Editor to build special behaviors into your scene file using scripts. A script can be routed to the incoming and outgoing events that are part of the nodes in your scene. It can also be connected to sensors that notify the script when certain things happen--for example, when the user approaches a certain spot, clicks an object, or bumps into a wall.

## Scripting Basics

You'll need some programming knowledge to use the Script Editor, and you need to understand X3D as well. With this tool, you can create scripts written in JavaScript, a platform-independent programming language.

### Script Template

Use the user-defined fields »Add Field« button in the context menu of a Script node or shader, to specify the basic components of your script, which can be any number of the following:

- ***initializeOnly***
- ***inputOnly***
- ***outputOnly***
- ***inputOutput***

Each inputOnly has an associated function with the same name inside the script. Each inputOutput has an associated function with the same name inside the script but starting with *set_* thus you have to name your function *set_fieldName.* When an inputOnly is sent to the Script node with a new value, this function is called and the new value for the event is passed in.

First, you specify each initializeOnly, inputOnly, outputOnly, and inputOutput field with the »Add Field« button in the context menu of an node in the Outline Editor. Field and event names must be unique within the script. Then you add the callback function to the script in the Script Editor.

### inputOnly/inputOutput Functions

Every inputOnly/inputOutput function has two predefined arguments: a value and a time. The value is the new value of the incoming event. The time is a time stamp, of type *double.* When you edit the script, you can change the name of these arguments. If you use only one argument, it is assumed to be the value.

### Outgoing Events

An outputOnly is simply a piece of data that the script sends out along a route. It does not have an associated function within the script. You can assign new values to an outputOnly that will send later along its connected routes. You can also read out the value assigned to an outputOnly.

### initialize ()

You can define an *initialize ()* method. This method is invoked before the browser presents the world to the user and before any events are processed by any nodes in the same X3D file as the Script node containing this script. Events generated by the *initialize()* method have timestamps less than any other events generated by the Script node. This allows script initialization tasks to be performed prior to the user interacting with the world.

### eventsProcessed ()

You can define an *eventsProcessed ()* method that is called after one or more events are received. This method allows scripts that do not rely on the order of events received to generate fewer events than an equivalent script that generates events whenever events are received. If it is used in some other time-dependent way, *eventsProcessed ()* may be nondeterministic, since different browser implementations may call *eventsProcessed ()* at different times.

For a single event cascade, a given Script node's *eventsProcessed ()* method shall be called at most once. Events generated from an *eventsProcessed ()* method are given the timestamp of the last event processed.

### prepareEvents ()

You can define a *prepareEvents ()* method that is called exactly once per frame. *prepareEvents ()* is called before any ROUTE processing and allows a [Script](/x_ite/components/scripting/script/) node to collect any asynchronously generated data, such as input from a network queue or the results of calling field listeners, and generate events to be handled by the browser's normal event processing sequence as if it were a built-in sensor node.

## Local versus Global Scripts

Associate a particular script with an object or group of objects by grouping it in the Outline Editor to a set of nodes. If the object is cut and pasted into the scene, the local script follows along with its associated object. To create a local script, select the script in the Outline Editor and drag & drop it into the group node into which you want to place the script. Global scripts are scripts located at the root of the scene and are not associated with any object. You can create global scripts at any time, by clicking the »Add Script« button (+) in the Script Editor's toolbar.

## Steps for Creating a Script

These are the general steps required to create a script. The Try It! section offers a brief case study that creates a sample script and routes to events.

- Create and name the script. If it is a global script, simply clicking the »Add Script« button (+) in the Script Editor's toolbar. (The Script node appears in the Outline Editor as soon as the script is created.) If it is a local script, select the script, then drag & drop it into the group node into which you want to place the script. Select the script in the Script Editor's node list, type a name for the script in the box provided (always give your Script nodes describing names).
- Specify the events and fields used in your script. Choose *Context Menu > Add Field*. A dialog box appears, prompting you to select the access type (initializeOnly, inputOnly, outputOnly, or inputOutput), as well as the field data type and name. Fields and events cannot have the same names.
- Create a trigger sensor for the script using the Library. Current choices for the sensor are:
  - EnterWorld prototype: trigger the animation when the scene is first loaded;
  - Collision Node: trigger the animation when the user collides with a particular object;
  - ProximitySensor: trigger when the user is within a certain distance of an object
  - TouchSensor: trigger when the user clicks a particular object;
  - Viewpoint Binding: trigger when a viewpoint is bound (locked) to the camera;
  - VisibilitySensor: trigger when a particular object or group of objects is visible.
- Now you're ready to program. Fill in the rest of the script in the Script Editor's text editor.
- You can make intermediate saves of the script in your text editor and check the script's syntax. Errors are printed in the Console window located within the footer.
- Open the Outline Editor to route the script to the objects you want it to affect.

## Field Semantics

Fields define the persistent state of nodes, and values which nodes may send or receive in the form of events. X3D supports four types of access to a node''s fields

- *initializeOnly* access, which allows content to supply an initial value for the field but does not allow subsequent changes to its value, except within the script that defines the field;
- *inputOnly* access, which means that the node may receive an event to change the value of its field, but does not allow the field''s value to be read;
- *outputOnly* access, which means that the node may send an event when its value changes, but does not allow the field's value to be written, except within the script node that defines the field; and
- *inputOutput* access, which allows full access to the field: content may supply an initial value for the field, the node may receive an event to change the value of its field, and the node may send an event when its value changes.

An inputOutput field can receive events like an inputOnly field, can generate events like an outputOnly field, and can be stored in X3D files like an initializeOnly field. An inputOutput field named *zzz* can be referred to as *»set_zzz*« and treated as an inputOnly, and can be referred to as *»zzz_changed*« and treated as an outputOnly field. Fields with inputOutput access or inputOnly access are usually collectively referred to as *input* fields, fields with inputOutput access or outputOnly access are collectively referred to as *output* fields, and the events these fields receive and send are called *input events* and *output events*, respectively.

The initial value of an inputOutput field is its value in the X3D file, or the default value for the node in which it is contained, if a value is not specified. When an inputOutput field receives an event it generates an event with the same value and timestamp.

## Naming Conventions

The recommendations for naming initializeOnly fields, inputOutput fields, outputOnly fields, and inputOnly fields for built-in nodes are as follows and we recommend to follow these recommendations for user defined fields too:

- All names containing multiple words start with a lower case letter, and the first letter of all subsequent words is capitalized (*e.g.*, *addChildren*), with the exception of *set_* and *_changed*, as described below
- It is recommended that all inputOnly fields have the prefix »*set_*«, with the exception of the *addChildren* and *removeChildren* fields
- Certain inputOnly fields and outputOnly fields of type SFTime do not use the »*set_*« prefix or »*_changed*« suffix
- It is recommended that all other outputOnly fields have the suffix »*_changed*« appended, with the exception of outputOnly fields of type SFBool.
