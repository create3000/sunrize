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

Sunrize is an easy-to-use editor for X3D files, built on top of the [X_ITE](/x_ite/) framework. It provides an intuitive interface for creating, editing, and previewing interactive 3D scenes directly in the browser. With support for the full [X3D standard](https://www.web3d.org/standards) and X_ITE’s advanced rendering features, Sunrize makes it simple to experiment with nodes, materials, and animations while immediately seeing the results in real time.

![Image of Sunrize Editor](/assets/img/sunrize-light.avif){: .light width="2940" height="1846" }
![Image of Sunrize Editor](/assets/img/sunrize-dark.avif){: .dark width="2940" height="1846" }

[<i class="fa-solid fa-heart"></i> Support us on Patreon](https://patreon.com/X_ITE){: .patreon }

## Installer Packages and Binaries

The latest builds of Sunrize are available as installer packages or binaries on the [Sunrize releases](https://github.com/create3000/sunrize/releases) page on GitHub. From there, you can download precompiled binaries, for Windows, macOS, and Linux.

[<i class="fa-brands fa-windows"></i>
<span>Windows</span>
<small>Installer</small>
](https://github.com/create3000/sunrize/releases/download/v{{ site.version }}/Sunrize.X3D.Editor-{{ site.version }}.Setup.exe){: download="" .platform }
[<i class="fa-brands fa-apple"></i>
<span>macOS</span>
<small>ZIP</small>
](https://github.com/create3000/sunrize/releases/download/v{{ site.version }}/Sunrize.X3D.Editor-darwin-arm64-{{ site.version }}.zip){: download="" .platform }
[<i class="fa-brands fa-linux"></i>
<span>Linux</span>
<small>AppImage</small>
](https://github.com/create3000/sunrize/releases/download/v{{ site.version }}/Sunrize.X3D.Editor-{{ site.version }}-x64.AppImage){: download="" .platform }
[](){: .dummy .platform style="visibility: none; opacity: 0; pointer-events: none" }
{: .packages }


```sh
# macOS users first need to remove the quarantine status:
xattr -dr com.apple.quarantine "/Applications/Sunrize X3D Editor.app"
# Linux users first need to make the AppImage executable (or use File Manager):
chmod u+x Sunrize.X3D.Editor-{{ site.version }}-x64.AppImage
```

## Run from Console

First you need to install both Node.js and npm on your system. To accomplish this, you can use a [Node installer](https://nodejs.org/en/download/) (Windows), or use [Homebrew](https://brew.sh) to install node (macos), or use your Linux package manager.

Then you can run Sunrize without installing it using npm's **npx** command:

```sh
npx sunrize@latest [files]
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
