---
title: Sunrize — A Multi-Platform X3D Editor
date: 2023-04-20
nav: main
categories: []
tags: [Getting Started]
permalink: /
---
[![NPM Version](https://img.shields.io/npm/v/sunrize)](https://www.npmjs.com/package/sunrize)
[![NPM Downloads](https://img.shields.io/npm/dm/sunrize)](https://npmtrends.com/sunrize)
[![DeepScan grade](https://deepscan.io/api/teams/23540/projects/26817/branches/855450/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=23540&pid=26817&bid=855450)

## Introduction

Sunrize is an easy-to-use editor for X3D files that is based on the [X_ITE](/x_ite/) framework. The Outline Editor allows for intuitive scene editing, while the Script Editor provides comprehensive editing of [Script](/x_ite/components/scripting/script/) and [ComposedShader](/x_ite/components/shaders/composedshader/) nodes.

![Image of Sunrize Editor](/assets/img/sunrize.avif)

[<i class="fa-solid fa-heart"></i> Support us on Patreon](https://patreon.com/X_ITE){: .patreon }

## Installer Packages

The latest builds of Sunrize are available as installer packages on the [Sunrize Releases](https://github.com/create3000/sunrize/releases) page on GitHub. From there, you can download precompiled binaries currently only for Windows.

## Run from Console

First you need to install both Node.js and npm on your system. To accomplish this, you can use a [Node installer](https://nodejs.org/en/download/) (Windows), or use [Homebrew](https://brew.sh) to install node (macos), or use your Linux package manager.

Then you can run Sunrize without installing it using npm's **npx** command:

```console
$ npx sunrize@latest [files]
```

>**Note:** The first time, it may take a while for Sunrize to start.
{: .prompt-info }
<!--
## Download Sunrize v{{ site.version }}

[Windows Installer](https://github.com/create3000/sunrize/releases/download/v{{ site.version }}/Sunrize-X3D-Editor-{{ site.version }}-Setup.exe){: .left .download }

[macOS dmg](https://github.com/create3000/sunrize/releases/download/v{{ site.version }}/Sunrize-X3D-Editor-{{ site.version }}-x64.dmg){: .left .download }

Thank you for choosing our software!
{: .clear }

1. Click the download button.
2. Once the file is downloaded, double-click on the installer file to begin the installation process.
3. Follow the on-screen instructions to complete the installation.
   * On Windows click »More Information > Execute Anyway« to start the installer,
   * On macOS open the »System Setting > Security & Privacy« and scroll to bottom to allow the application to run.
4. Right-click the icon in the taskbar/dock to pin it.
-->
