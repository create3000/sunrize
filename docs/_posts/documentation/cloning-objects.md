---
title: Cloning Objects
date: 2024-01-14
nav: documentation
categories: [documentation]
tags: [Cloning]
---
## About Cloning

When you begin creating X3D scenes, you will want to capitalize on the economy of modeling an object once and then reusing it, with modifications, when it appears elsewhere in the scene. Aside from making the X3D file shorter and easier to read, this technique decreases the time it takes to download your scene and increases overall performance. Make it a general practice to reuse nodes whenever possible.

Creating a node and then referring to it by name in multiple places is called *cloning.* If you change the original named node, all clones of that node will change as well.

Sometimes you will have the same geometry repeated in a scene, but with different colors and textures. In such cases, you can name the geometry the first time and reuse it, but include different material and texture nodes to change the appearance.

## Creating a Clone

Suppose that you have the same texture used multiple time on different geometries.

The OutlineEditor might display something like this:

![Cloning Objects 1](/assets/img/documentation/cloning-objects-1.png){: .normal .w-50 }

If you want to clone the ImageTexture node now you just select the first node. Then drag the node and hold down Ctrl-key and drop the node to the second texture field.

Now the OutlineEditor will display this:

![Cloning Objects 2](/assets/img/documentation/cloning-objects-2.png){: .normal .w-50 }

You will notice now a small number in brackets behind the node name. This number indicates that the node is cloned and how many times.

## Unlink a Clone

If you don't want the clone anymore for several reasons, you can unlink the clone relationship again.

1. Place the mouse pointer over the node name.
2. Right click to open the context menu.
3. Choose *Unlink Clone*.

![Unlink Clone](/assets/img/documentation/unlink-clone.png){: .normal .w-50 }
<br>Unlink Clone menu item
{: .small }

The clone relationship is now broken. You will see no small number behind the node name now. For every instance a copy of the clone is made and the clone is replaced by the copy.

## Remove a Clone

Go to the Outline Editor, place the cursor over a clone and activate the context menu. Select *Delete* will remove only this one clone.
