---
title: Using the Outline Editor
date: 2024-01-12
nav: documentation
categories: [documentation]
tags: [Outline Editor]
---
The Outline Editor lets you

- browse and edit the X3D source file for your scene
- edit field values
- create routes between fields
- make precise selections within the scene file

It shows the entire scene hierarchy, including nodes, fields, field values and types, as well as the routes between events. Node type names are in boldface type. Field types and field names are in roman type. Routes are shown to the right of fields and events.

![Outline Editor](/assets/img/documentation/sidebar-outline-editor.png){: .w-50 .normal }

When you select an object in the main window, the Outline Editor highlights the parts of the X3D file that define those objects. Clones (multiple instances) of an object are indicated with the notation \[N\], where N indicates how many instances of a node have been created in the file. Edits to one instance affect all instances of the object. If you select an object that has multiple instances, all are highlighted.

Each node or field has a small expander arrow to its left. When the arrow is clicked once, the information is in its condensed form. **When the arrow is *Shift*-clicked, the information is in its expanded version.** Click the arrow next to a node to reveal the fields within that node. Click the arrow next to a field name to reveal the field's values. Each node type has a particular icon that is associated with it.

Each node shows a context menu while hovering the mouse over the node or a field of the node. The node must not be selected just move the mouse over the node and right click. There are various operations what you can do depending on the type of the node (extern proto, proto, node).

![Context menu of a node](/assets/img/documentation/outliner-node-context-menu.png){: .w-50 .normal }
<br>Context menu of a node
{: .small }

## See Also

- [Keyboard Shortcuts and Tricks](../a-quick-look-at-the-user-interface/#keyboard-shortcuts-and-tricks)
