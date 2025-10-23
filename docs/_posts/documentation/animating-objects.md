---
title: Animating Objects
date: 2025-09-25
nav: documentation
categories: [documentation]
tags: [Animation, Animation Editor]
---
Animations in a 3D scene are an essential part to make the scene more interesting and true-to-life.

## Keyframe Animation Editor

**Find it:** Click on the »Keyframe Animation« tab in the footer.

The Keyframe Animation Editor lets you add action to your scene: fish can swim, birds can fly, and robots can dance. You define a set of key poses at particular points in time. These poses are called **keyframes.** The Keyframe Animation Editor then interpolates between the poses, filling in the motion to move from one pose to the next. Typically, the things you'll animate are Transform properties (translations, rotations, and scales). Other properties can be animated as well, so you'll want to experiment with the effects of animating materials and colors too. In addition, you can animate viewpoints, and you can »morph« from one shape to another. The basic principle is still the same: you define the object at various keyframes, and the Keyframe Animation Editor interpolates between the keyframes for you.

A scene can have one or more animations associated with it. Within each animation, there can be one or more **members.** Think of an animation member as one of the cast members of a play. It's an object (such as a rocking chair) or a collection of grouped objects (such as a linked chain or a human figure) that moves as a unit within the scene. Of course, the parts of a member can be articulated and can move independently of each other (when the man moves his hand, he may not move his elbow or leg). Once you've added an object as a member, all of the objects grouped underneath that object are automatically eligible to be animated.

Another key element of the animation is the **timeline,** since animation involves a series of changes over a particular time period. Each member of the animation has its own timeline.

![Keyframe Animation Editor](/assets/img/documentation/keyframe-animation-editor.png){: .normal .w-100 }

### Animation Toolbar

The Keyframe Animator Animation toolbar has the following options:

- **New animation** opens a new animation. A given scene can contain a number of animations.
- **Open animation** opens an existing animation.
- **Add member** adds a new member to an animation. An animation can contain one or more members. A member is like the cast member of a play. It could consist of one object (such as a bouncing ball), or it could consist of a number of grouped objects, such as a jack-in-the-box or a spinning top. Each member has its own timeline.
- **Remove animation, member or interpolator** removes the whole animation, a member from an animation or only one interpolator depending on the selection (master, member or field) within the member tree view. Note, however, that this option does not remove the trigger sensor for the animation.
- **Cutting:** Choose cut (or press <kbd>Ctrl</kbd>+<kbd>x</kbd> or *Delete*) to cut selected keyframes.
- **Copying:** Choose copy (or press <kbd>Ctrl</kbd>+<kbd>c</kbd>) to copy selected keyframes.
- **Paste** overlay at current time (<kbd>Ctrl</kbd>+<kbd>v</kbd>) pastes the selected keys at the current time. If the keys land at the same time as existing keys, the pasted keys replace the existing keys. If there is no new key to replace an existing key, the existing key is preserved (that is, you'll have a mixture of old and new keys).
- **First frame** lets you jump to the first frame.
- **Play/Pause** plays the selected range or the whole animation starting at the current frame.
- **Last frame** lets you jump to the last frame.
- **Time sensor loop** toggles whether the animation plays continuously when triggered or plays only once.
- **Key type menu** shows you the type of the current keyframe. A keyframe can be of type CONSTANT, LINEAR or SPLINE. Change the key type of the selected keyframes by selecting another type.

### Animation Properties

**Find it:** Click the ![Time Button](/assets/img/documentation/time-button.png){: .normal } button to open the animation properties.

- **Change frames** changes the length of the animation.
- **Change frames per second** changes the number of frames per second that are displayed on the timeline. The maximum number of frames per second is 60. Note that changing the number of frames per second does not affect the length of the animation itself (use Set duration to change the length). If the Snap to frames option is enabled, keyframes are snapped to the new grid.
- **Scale keyframes** compresses or expands the animation to fit within a given time period.

![Animation Properties](/assets/img/documentation/animation-properties.png){: .normal .w-25 }

### Zoom Buttons

- The **Zoom timeline out** button moves you farther away from the window. The timeline becomes smaller, so you can see more of it.
- The **Zoom timeline in** button moves you closer to the window. You see less of the timeline because it is magnified.
- The **Zoom timeline to fit** button sizes the timeline to fit within the current window.
- The **Default timeline zoom** level button returns the view to its original size.

## Animating a Viewpoint

You can animate a viewpoint using the Keyframe Animator and Viewpoint Editor. After you've defined the viewpoint in the Viewpoint Editor, add the viewpoint as a member of the animation and record different positions for the viewpoint using the Keyframe Animator. When the animation is triggered, the user''s view of the scene is defined by this animation.

Animated viewpoints are useful for guided tours and for cases where you want the browser to control how the user views the scene — for example, when the user steps onto a merry-go-round or a bus. They can also be used to allow the user to travel with other objects in the scene, such as a bird or a spaceship.

Some browsers (such as X_ITE) interpolate between viewpoints when the user moves from one viewpoint to the next. This interpolation is strictly mathematical and may result in a path that moves the user through walls and other objects. For more explicit control over animation between viewpoints, use this feature to define the exact path the user follows through the scene.

Follow these steps to animate a viewpoint:

1. In the Library, click on Navigation &gt; Viewpoint to create a global viewpoint.
2. In the Keyframe Animation Editor, choose Add Member.
3. In the Keyframe Animation Editor, move the time cursor to a new time.
4. Change the view in the main window.
5. In the Outline Editor open the context menu and click Move Viewpoint to User Position.
6. Click the Master record button (The small check box) to add keyframes.
7. Record additional keyframes by repeating steps 4 through 6.

There is another interesting thing you can do: click at one keyframe and drag it to a new time. The position and orientation of the viewpoint are now stored at that time frame.

**Note:** Press *Backspace* to delete a previously created keyframe.

## Selecting Keyframes

To select a keyframe, click it. The selected keyframe turns red. To select multiple keyframes, shift-click additional keyframes to add them to the selection. Once you've selected keyframes, you can drag them around in time. To deselect keyframes, click on an empty part of a timeline

You can select at any level of line (master, member, object, property, field). Selecting on a higher-level line is the same as selecting all keys at the same time on lower-level lines. Conversely, when you select on a lower-level line, that keyframe and all of its parents become highlighted.

### Defining and Using a Range

When you move the cursor trough the timeline a range is selected indicated by the darker background. All keyframes within this range are highlighted and added to the current selection. Press the Shift-key and then click on an empty part of the timeline to expand the range. To clear the range click on any part within the timeline.

**Tip:** Another useful option that uses the range selection is the playback button. Once defined a range the playback is limited to that range.

## Keyframe Type

The Keyframe Type menu allows you to select the type of interpolation that will be used to fill in the values between a given keyframe and the keyframe that follows it. The Keyframe Animation Editor allows you to choose from the following interpolation types:

### Constant

The value remains fixed until the next keyframe. No interpolation is performed. This type is useful for things that don''t change, such as a blinking neon sign.

### Linear (the default)

The value changes linearly from the current value to the next keyframe value. This type is useful for light rays bouncing off mirrors at equal angles. For shape animations only, the default interpolation type is Linear.

### Spline

The value passes through the key, but it follows a curve whose tangents are determined by the keys on either end of the segment, and the next one to either side. This type gives a continuous velocity curve. As an example, suppose you have four keys (A, B, C, and D). To find a value on the curve between B and C, the tangent at B is computed as the slope from A to C. The tangent at C is computed as the slope from B to D. And the value of the curve is a spline function of those two tangents and the values at B and C.

### Split

This type is similar to Spline, but it allows the tangent to be discontinuous at this point. For example, if B and C are Split, the tangent at B will be the slope from A to B, not A to C. And the tangent at C will be the slope from C to D, not from B to D.

### Mixed

If the *Keyframe Type* menu displays nothing then the selected keyframes are of different tangent types.

You can select a keyframe and change its interpolation type by changing the *Keyframe Type* button to the new type. If there are no keyframes selected, the button label changes to »Default Keyframe Type.« The value selected will be used for any keyframes that are created or changed.

## Master Timeline

This article describes the Keyframe Animation Editor's master timeline.

The master timeline is the boldface line at the top of the time panel. It indicates the time of the animation, either in frames or in seconds. You can click anywhere in the timeline to specify a new current time.

The colored bold vertical line, called the time cursor, points to the current time. You can click anywhere within the timeline and drag back and forth to preview (or scrub) the animation. The colored squares on the master timeline indicate any time that has a keyframe in any of the individual timelines shown below it.
