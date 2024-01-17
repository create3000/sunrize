---
title: Editing Prototypes
date: 2024-01-17
nav: documentation
categories: [documentation]
tags: [Prototypes, Outline Editor]
---
## Prototypes

X3D comes with a fixed set of objects, called nodes, which will cover most of your needs. But its creators have also planned ahead, knowing that you'll sometimes have to create own objects, and you'll often want to assemble the same types of nodes in similar ways, with only small changes. The prototyping feature added to X3D lets you create objects that you can reuse, changing certain characteristics of the objects when desired.

With Sunrize you can display, edit and use extern prototypes and prototypes within the Outline Editor:

![Extern Prototype »Rotor« with instance](/assets/img/documentation/prototypes.png){: .normal .w-50 }
<br>Extern Prototype »Rotor« with instance
{: .small }

To display the contents of extern prototypes, choose from menu *View > Outline Editor > Expand ExternProto Declarations.*

## Creating Extern Prototypes and Prototypes

Use *Context Menu > Add Prototype* to create a Prototype or Extern Prototype.

![Prototype Editor](/assets/img/documentation/prototype-editor.png){: .normal .w-50 }
<br>Prototype Editor
{: .small }

1. Choose *Context Menu > Add Prototype* and select PROTO or EXTERNPROTO.
2. Give the prototype a unique name.
3. Define interface fields for the prototype.

## Edit Extern Prototypes & Prototypes

Extern prototypes are references to prototypes located somewhere on your hard disk or in the Internet. Extern prototypes define a interface that can be a subset of the prototype's interface. You can fully expand the prototype and all of it's nodes.

## Creating References to Interface Fields

Your prototype may define one or more interface fields of various types. These fields can be connected to fields of a node within the prototype body. There are special rules when prototype interface fields can connected to node fields. The most important rule is, that the access type of both fields have to be of the same type. Sunrize handles this automatically and only shows you the fields that can be connected to node fields when creating references.

### Create a Reference

To create a reference to an interface field, open the context menu over a node field and choose *Create Reference To > YourInterfaceFieldName*. **Note:** the menu item is only visible if it is possible to create a reference. Once you have created the reference, the field name is displayed in bold face.

![Add Reference](/assets/img/documentation/add-reference.png){: .normal .w-50 }
<br>Add Reference to a prototype field
{: .small }

### Remove a Reference

To remove a reference to an interface field, open the context menu over a node field in bold face and choose *Remove Reference To > YourInterfaceFieldName.* This will disconnect the relationship between the interface field and your node field.

## Remove Extern Prototypes & Prototypes

You cannot easily remove prototypes as long as there is an instance of an extern prototype or prototype within your scene, but if not, you are free to remove it. Just choose *Context Menu > Delete Prototype* and the prototype is immediately removed from within your scene.

## Creating Prototype Instances

Once you have created a prototype, you want to use them within your scene one or more times. To use a prototype, it is important that this prototype is within your scene or you can save the prototype as external file and only create a reference to that file by importing the prototype as extern prototype. Now you can open the context menu over an extern prototype or prototype and choose *Context Menu > Add Instance.* The so created instance is placed as root node at the end of your scene graph. You can now follow the steps from [Creating Group Hierarchies](../creating-group-hierarchies/) to incorporate your instance into your scene.

## How to use Extern Prototypes

An extern prototype will often be the way of your choice when you use a prototype within a scene, but then you are responsible to manage the references to that file. This means, when you move your prototype to another folder then you have to change the url field of your extern prototype.

Also at some time you will have a library of your own prototypes, but how to use them within your projects? When you have imported the prototype as extern prototype and then made a change at the interface of your prototype, then you could come in trouble. Often the file can not be loaded due to parser errors, as the interface is not the same. So it is often more feasible to copy the used prototypes to your project folder and to create a extern prototype reference from there to it.

