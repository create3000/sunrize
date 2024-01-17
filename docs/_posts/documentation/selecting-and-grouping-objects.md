---
title: Selecting and Grouping Objects
date: 2024-01-17
nav: documentation
categories: [documentation]
tags: [Selecting, Grouping, Outline Editor]
---
Group objects to specify several objects as a whole. You can use grouping to organize parts of a model — to make it easier to move and edit several objects at a time, for example. Or you can use grouping to define more advanced hierarchies — to make it easy to articulate parts of the model during an animation, for example.

## The Basics of Selecting and Grouping

Click an object to select it; *Shift*-click to extend the selection to include additional objects.

Use the grouping functions in the Outline Editor to group, ungroup, add to the existing group, and create a new parent group. The grouping functions are explained in more detail below.

Use group hierarchies to specify spatial relationships between objects in a group. For example, a robot leg that articulates at the knee and foot joints should be grouped so that moving the upper leg also moves the knee, lower leg, and foot. (This is where *Create Parent Group* and *Add To Group* become useful.)

## To Select all or Part

Use pick (arrow button found on Dashboard toolbar) to choose an object. When you click, the object's manipulator appears. This is a bounding box around the selected object with knobs for translating, rotating, and scaling the object:

![Cone with Manipulators](/assets/img/documentation/cone-with-manipulators.png){: .normal .w-50 }

>**Tip:** Double click a selected object's axis manipulators to switch between the move, rotate and scale tool.
{: .prompt-tip }

Choose *Selection > Select All or Deselect All* to quickly select and deselect all the objects in your scene. Shortcuts: *Ctrl-A* and *Ctrl-D*

Clicking on the background deselects all objects.

*Shift*-click a selected object to remove it from the selection.

You can also use the Outline Editor to select parts of an object by double clicking the object's Transform. The Transform becomes highlighted once you click it.

## To Select Multiple Objects

Select an object and use *Shift*-click to select additional objects. The last object selected in this manner is the master selection. You can place the cursor over the individual bounding boxes to move the group. Switch to resizing and rotating by double clicking an axis manipulator. Moving, rotating, and resizing affects all of the objects in the multiple selection at the same time.

When you click on another object, or in the scene, the objects are deselected. Pressing *Shift*-click again removes objects from the selection.

## To Group Objects

1. *Shift*-click to select the objects you want to group in the Outline Editor.
2. Choose *Context Menu > Add Parent Group.*

## To Add a New Object to an Existing Group

1. *Shift*-click to select the objects you want to add to the group.
2. Drag & drop the selected objects to the new group or field.

This technique applies to adding a new object to any existing group, including those defined by LOD and Switch. See [Creating Group Hierarchies](../creating-group-hierarchies) to learn how *Add To Group* differs from *Group*.
