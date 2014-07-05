---
layout: page
title: Blueberry API
---

## Introduction

Given all the different obstacles (no static type checking, no
interfaces, multiple implementations of an object model, multiple
frameworks), it is not possible to specify an API _as such_; however,
the intent here is to crystallize somewhat the concepts described
above to ensure that a similar "feel" is available across different
frameworks as much as possible.  Where possible, it would be good if
code could be reused across different blueberry frameworks, but in
practice it is expected that designers of both applications and
blueberries will choose the frameworks that most suit their needs; the
only real downside is that in choosing "different" frameworks, two
blueberries cannot be co-located in the same space, thus forcing
either an iframe break or the end of direct blueberry nesting and a
retreat to template/envelope rendering.

In the same vein, a lot of these so-called interfaces are really just
ways of describing constraints on certain user-implemented classes and
have no other effects on the code.

## BlueberryReceptacle

The BlueberryReceptacle is the top-level entry point into a Blueberry:
the "main" class.  The Receptacle has just one method on it which is
the ``init`` method:

``
init: BlueberryStalk s -> Void
``

The one argument is a BlueberryStalk which represents the Blueberry's
sole access to the containing system.  In the init method the
blueberry needs to set up such connections as it sees fit, in general
including requesting all its contracts.

I don't think at this point there needs to be a specifically different
interface for the overall application: I think the application as a
whole can just be treated as a very large blueberry.  However, it
might be useful for cases where the same code can represent either the
entire screen real estate or some part of it to know that.  If so, I
believe that should be a method either on the BlueberryStalk or
provided through the Render contract.

## BlueberryStalk

The ``BlueberryStalk`` interface is probably the single most important
one in the scope of this API.  The Stalk is passed in to the blueberry
when it is initialized and needs to be preserved and shared through
the blueberry's code.

### Initialization

In order to get the blueberry under way, a number of methods are
used to set up interfaces between the blueberry and its environment

``
requestContract: String name -> Interface contract
requestContract: ContractDefn defn -> Interface contract
``

Whichever of these methods is called, the result is a JavaScript
object which provides the methods associated with the specified
contract.  This object is good for the lifetime of the blueberry.
While it is not necessary to call this during the ``init`` method,
this is generally the most useful practice.

Not every contract desired by a blueberry will be implemented by its
environment.  The BlueberryStalk may choose to return ``null`` rather
than a contract object, in which case the contract is not available.
However, it is not acceptable for the BlueberryStalk to return a
_partial_ contract: it must either return the whole contract or none
of it.

The two forms here are equivalent.  Each contract has a unique name,
and in order for the environment to be able to provide a service which
implements a contract it must have the contract loaded.  However, if
for any reason the blueberry finds it easier to ask for the contract
explicitly by its definition it can do so.

### Creating other blueberries

From within a blueberry it is possible to create sub-blueberries.  It
is possible either to do this using a seed or using the elements that
constitute a blueberry.

``
instantiateBlueberry: BlueberrySeed seed -> BlueberryParent parent -> BlueberryHandle handle
``

``
instantiateBlueberry: String brandName -> BlueberryParent parent -> BlueberryHandle handle
``

## BlueberryHandle

A ``BlueberryHandle`` offers a parent blueberry an interface to its
child blueberry and is paired with a BlueberryParent object for
two-way communications.

## BlueberryParent


## Blueboard

Although we like to think of contracts as all just being "additional"
features, the `Render` contract is special in a number of ways.  Most
importantly, it really isn't that optional; secondly, it is the place
where the blueberry is given access to a portion of screen real estate
(the entire screen, a fixed portion of the screen inside an `iframe`, or
a `div` within one of these).

The key method of the render contract is, reasonably enough, `render`:

``
render: Blueboard space -> Void
``

This method is called after the completion of the `init` method on the
blueberry if it requested the `Render` contract and provides the
blueberry with a handle to an object which is capable of laying out
the screen contents.  By analogy to a blackboard for blueberries, this
is called a `Blueboard`.

Since the Blueboard needs the element into which the Blueberry will be
rendered to exist before it can be initialized, the Blueberry must be
inserted into the DOM through a template before the `render` method
can be called.

### Rendering Templates

In general, it is expected that the blueberry framework libraries will
support and use an HTML templating library and that the BlueberryBrand
will include a set of named templates.  This being the case, the
Blueboard has a method to render a template into the available space
as follows:

``
renderTemplate: String name, Hash model -> Void
``

The template is looked up by name and rendered with the model
provided.

### Nesting Blueberries

In order to nest blueberries, it is possible to create new blueberries
through the blueberry stalk and then taking the returned handles and
inserting them into the model in a way that causes them to be inserted
into the DOM.

## create nested blueberries and punnets

## do we need a separate render context?