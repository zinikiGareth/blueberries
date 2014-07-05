---
layout: page
title: Packaging
---

## Introduction

Because of the desire to share blueberries, and the idea that they are
"fundamental units of composition", it is important to be able to
package a BlueberryVariety to appear to be a single autonomous unit.  In
practice, it may be necessary to deliver it in several distinct pieces
(JavaScript, CSS, icons, images, etc), but the goal should be to allow
all of those pieces to be stored "in the same place" and identified as
a single root.

This includes things like modularizing JS & CSS files using AMD files
and a special div class to identify the CSS units.

It also involves how we describe that packaging in the Ziniki world.

Also how we upload files.

Can we have flags?  Variables?

We want to be able to say things like "mainBlueberry"

Envelope/Template name to use in lieu of actually installing me
Icon/JPEG to use to display instead of me (property of data object for
more specific; generic version associated with the overall variety).

We should be able to load metadata as JSON without loading whole package