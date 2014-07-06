---
layout: page
title: Packaging
---

## Introduction

Because of the desire to share blueberries, and the idea that they are
"fundamental units of composition", it is important to be able to
package a BlueberryVariety to appear to be a single autonomous unit.

In practice, it may be necessary to deliver a BluberryVariety in
several distinct pieces (the JavaScript, CSS, icons, images,
etc. probably need to be delivered separately), but the goal should be
to allow all of those pieces to be stored "in the same place" and
identified as a single root with a single name.

All of the packaging should be handled by Ziniki and should involve
setting up through tools or UI, uploading "source" files and then
delivering "transpiled" output files.  I'm sure it would be possible
to do this _not_ using Ziniki, and probably this specification should
be written that way, but for now, that's the only case I'm going to
consider.

## Creating BlueberryVarieties

In order to create a new BlueberryVariety, it is necessary to invoke
the "createVariety" method on the Ziniki container.

[String of notes here.  First off, it's not clear exactly "who" is
expected to do this in terms of tool, UI, Ember, etc.  Secondly, the
"createBlueberry" method is probably actually going to be under the
"flasck" protocol because that's what I did years ago.  Thirdly, given
the uncertainty about the interface, the API is even more free flowing
than before.]

``
createVariety: String uniqueName -> BlueberryVariety variety
``

This is the root of the BlueberryVariety and establishes its name for
us.

``
getVariety: String uniqueName -> BlueberryVariety variety
``

This method recovers an existing Variety.  This can be useful either
for editing or at runtime.  It should be possible for the
BlueberryContainer to request this metadata and to consider before
instantiating the blueberry what it wants to do.

We can then attach files to this.  There are two sorts of file
attachments: ones that we expect Ziniki to process and ones that we
just want to push on up there.  This means that we have two separate
methods.

``
attachAndProcess: String path, String processAs, File contents -> Void
``

This method requests that we upload the given file under the given
name and process it in a particular, specified way.  At the moment,
the only processing options we are going to offer are "es6" and "hbs"
for ES6->AMD transpilation and "Handlebars Templates" respectively.

While the file will be delivered as part of the standard package, the
path enables it to be repeatedly uploaded and overwritten and also to
be recovered using `getFile`

``
attachFile: String path, String mimeType, File contents -> Void
``

This enables an arbitrary file to be attached with a given path
relative to the BlueberryVariety root and specifies its "mime" type
for delivery.  It can be accessed from `<BlueberryRoot/path>`

``
getFile: String path -> File contents
``

This recovers the (previously stored) path as a file.  If is was
uploaded using `attachFile`, it is returned with the specified mime
type, otherwise it is returned with a type appropriate to its
processing characteristics.

It is also possible to recover files as if they were static files on
the server by looking at the URL:
`<server>/<blueberryVarietyName>/path`

``
setProperty: String property, String value -> Void
``

It seems to me that a lot of the process of packaging involves adding
additional meta data to the blueberry.  I'm not sure what all the
properties are, but is seems that some of them might be:

* `mainClass` - in order to instantiate a blueberry, you need to
recover some named item that you can call the init method on.  This
property would enable you to say "find the class with this path" and
instantiate that.

* `deliverAs` - it seems like it might be useful to be able to specify
the name of the composite JS and HBS files when downloading, but I'm
not sure it's really necessary given that we can just use standard
names "underneath" the variety name.

* `envelopeName` and `templateName` - it seems reasonable to allow the
blueberry to offer templates and envelopes that it would like to use
to render itself if it cannot be instantiated.  On the other hand, I
think that this is actually a concern for a container.

* `contentType` - it may be useful to specify the Ziniki content type that it
expects; this would also allow us to figure out how to project data to
envelopes.  But given we will generally have the data, I'm not sure
how useful it is.

* `displayInstead` - if the blueberry cannot be rendered and it's too
hard to use a template, display an image instead.  It seems like there
might be two options - one is just a straight path to a JPEG to use
for all instances; the other might be a property on the object which
is the ID of an image somewhere.

In lieu of setting individual properties, it is possible to create/get
the main BlueberryVariety object, update it, and save it in the usual
way of objects.

### Trust

I'm not quite sure how the trust mechanism is going to work, but each
BlueberryVariety needs to say what other BlueberryVarieties it is
happy to have living in "its" space.  In order for two
BlueberryVarieties to be put together WITHOUT having an IFrame or
Popup boundary between them, both of them must trust the other.

It seems that the simplest thing is to have a list property that can
be retrieved and stored:

``
whoDoYouTrust: -> List<String> trustedVarieties
trustVarieties: List<String> varieties -> Void
``

## Implementation Notes

Having played a little bit with transpiling, it seems that it should
not be unreasonable to have all the modules go into a module name that
is the start of the blueberry name and to require all CSS rules to
start with a class specifier that is the name of the module.  When
instantiating a blueberry, the system can place a `<div
class='variety`>` tag around the area to contain the blueberry.  This
should be possible to set up in such a way that it is consistent
between development and production.

In addition to allowing all of this to be configured using tools, the
`PMZiniki` environment - used by developers - should be able to be
configured in such a way that it automatically creates the appropriate
objects and "uploads" the appropriate files from the user's machine
both at startup and as they change, thus making a "configuration over
doing" seamless, fast process from a single server which can be
restarted at will.
