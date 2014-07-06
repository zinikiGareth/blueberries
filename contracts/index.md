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
a value.  I'm not quite sure how errors are handled, but presumably
"Void" methods actually return some context which can be used to
handle errors if desired.

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
pr subscribe: ID id -> Object value
pr findEnvelope: String envelopeType, ID id -> Object value
pr subscribeEnvelope: String envelopeType, ID id -> Object value
pr save: Object value -> Void
pr recipe: String recipe, ID? start -> Tree<BlueberrySeed> seeds
``

The `find` method recovers an object by ID.  Once recovered, the
object is constant and is not updated by the system.  The object
returned is the raw object hash stored in the system.  Because of
JavaScript semantics, it is to be expected that the immediate return
will be a promise rather than the object, but that the promise will
resolve to the value when ready.

The `subscribe` method recovers an object by ID but also expresses
interest in continuing to receive updates about the object.  Again,
everything depends on the JavaScript framework, but it is to be
expected that not the actual object but some "observable" will be
returned that can have handlers attached to it that reflect the
continuing updates.  In this case, the "first" update is not really
any different to the others; it's just that it goes from
"uninitialized" to the first value rather than from one value to the
next.

The `findEnvelope` and `subscribeEnvelope` methods correspond to
`find` and `subscribe` but instead of returning the "raw" object
hashes, they return a projection of the data through the requested
envelope mapping.

The `save` method asks the system to overwrite the current object
value with the provided value.  Essentially, the workflow has to be to
call `find` or `subscribe`, make modifications to the data until you
are happy, and then call `save`.  `save` can fail if the object
presented cannot be written for any number of reasons including if the
object has not taken all of the available updates (using subscribe
will generally ameliorate this problem).

Finally, the `recipe` command attempts to recover a tree of blueberry
seeds for instantiation.  While it's obvious to me how this would be
implemented (it's a call to the Ziniki recipe method), it's less
obvious what to do with the returned blueberry tree.  I think there
probably needs to be a Punnet that can handle this case
(BlueberryPagePunnet?) and that you just pass it the whole tree.