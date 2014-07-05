---
layout: page
title: Contracts
---

## Overview

In addition to the core Blueberry API, a lot of the work is done
through the most significant contracts.  While all contracts are
grouped into the "Four Rs" (Render, ReStore, Report, React), a handful
of these are so important they effectively amount to a part of the
blueberry definition.

Contracts are essentially collections of methods and come in what
amounts to four pieces.  Each contract has a "service side" and a
"blueberry side" and on each side there is a "requestor" interface and
a "provider" object.  We can thus talk about a "service requestor", a
"service provider", a "blueberry requestor" and a "blueberry
provider".

Somewhere I have better adjectives than this, but here we will use the
initials `sr`, `sp`, `br` and `bp` to describe these four directions
of communication.  Furthermore, any such invocation may either by
asynchronous or request/response.  If the method has a denoted return
type of "Void" it is asynchronous, otherwise it is expected to return
a value.

Obviously, in conventional JavaScript parlance, this means that the
methods need to provide a callback to handle the asynchronous nature
of the communications; however, it is expected that the majority of
implementations will choose to use a modern Promises implementation
such as RSVP.js.

## Render

The Render contract is required in order to allocate screen real
estate to a blueberry and to ask it to render itself.  The `render`
method is invoked directly from within the BlueberryContainer library
_not_ from user code.  This happens when a template decides it needs
to add an existing blueberry into the DOM.

``
sr render: Blueboard space -> Void
``

This is a complex process and contains much of the logic associated
with the creation of blueberries and in particular with the decision
about how to render them.  Indeed, if the decision is taken that the
only way to render the blueberry is as a templated version of an
envelope, then no Blueberry will be created at all, but the template
will be instantiated in the DOM with the envelope version of the data.

``
sr renderMethod: -> String
pr renderMethod: -> String
``

It is often useful to know how the container has chosen to render the
blueberry.  I'm not sure what **all** the answers are but here are
some examples:

* `application` - this is the key blueberry in the system
* `application/nested` - this blueberry is not inside a nested iframe,
but is nested
* `iframe` - this blueberry was rendered at the top level of a nested
iframe
* `iframe/nested` - this blueberry was nested within a top-level
iframe
* `popup` - this blueberry was rendered in a popup frame
* `popup/nested` - this blueberry was nested within a popup frame
* `template` - this blueberry could only be rendered using a template

Note that this method can be called from either the containing
blueberry or inside the blueberry; it's important to make sure
therefore that you call it on the appropriate instance of the
contract!

## (Re)Store

The `(Re)Store` contract is the main way of moving data in an out of
the system.  It has the following methods:

``
pr find: ID id -> Object value
pr findEnvelope: String envelopeType, ID id -> Object value
pr recipe: String recipe, ID? start -> Tree<BlueberrySeed> seeds
pr save: Object value -> Void
sr update: -> Object value
``

