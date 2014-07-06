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
the `init` method:

```javascript
init: BlueberryStalk s -> Void
```

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

The `BlueberryStalk` interface is probably the single most important
one in the scope of this API.  The Stalk is passed in to the blueberry
when it is initialized and needs to be preserved and shared through
the blueberry's code.

### Initialization

In order to get the blueberry under way, a number of methods are
used to set up interfaces between the blueberry and its environment

```javascript
requestContract: String name -> Interface contract
requestContract: ContractDefn defn -> Interface contract
```

Whichever of these methods is called, the result is a JavaScript
object which provides the methods associated with the specified
contract.  This object is good for the lifetime of the blueberry.
While it is not necessary to call this during the `init` method,
this is generally the most useful practice.

Not every contract desired by a blueberry will be implemented by its
environment.  The BlueberryStalk may choose to return `null` rather
than a contract object, in which case the contract is not available.
However, it is not acceptable for the BlueberryStalk to return a
_partial_ contract: it must either return the whole contract or none
of it.

The two forms here are equivalent.  Each contract has a unique name,
and in order for the environment to be able to provide a service which
implements a contract it must have the contract loaded.  However, if
for any reason the blueberry finds it easier to ask for the contract
explicitly by its definition it can do so.

```javascript
provideService: ContractDefn defn, Object service -> Void
```

If this blueberry wants to provide services to its **children** only,
it can call the `provideService` method.  This does not initially do
anything, but if this blueberry creates children blueberries, and they
request the specified contract, then this will be the service
provider.

The "service" object provided must implement **all** the methods of
the specified contract.

```javascript
denyServiceDefaults: Void
```

This method denies access to this blueberry's default services to any
children.  In order for children to be able to find a service, it must
have been specifically provided using the method above.

### Creating other blueberries

From within a blueberry it is possible to create sub-blueberries.  It
is possible either to do this using a seed or using the elements that
constitute a blueberry.

```javascript
instantiateBlueberry: BlueberrySeed seed -> BlueberryParent parent -> BlueberryHandle handle
instantiateBlueberry: String varietyName -> BlueberryParent parent -> BlueberryHandle handle
```

### Creating punnets

Because of the special place that punnets have in the Blueberry
ecosystem, there are special methods for creating them, one for each
of the six archetypes.

While they return special return types, these are just richer versions
of a BlueberryPunnetHandle (itself a richer version of a
BlueberryHandle) and can always be treated as a BlueberryHandle or
BlueberryPunnetHandle.

```javascript
instantiateNarrativePunnet: -> BlueberryNarrativePunnetHandle
instantiateDiscoveryPunnet: -> BlueberryDiscoveryPunnetHandle
instantiateWorkflowPunnet: -> BlueberryWorkflowPunnetHandle
instantiateConversationPunnet: -> BlueberryConversatonPunnetHandle
```

Because the punnets are part of the framework they are *always*
created as local blueberries.

## BlueberryHandle

A `BlueberryHandle` offers a parent blueberry an interface to its
child blueberry.

The main use of the BlueberryHandle is to add it to a model to be
rendered by a template.  The template library will need to be enhanced
to understand how to render a Blueberry in all the appropriate cases.

Note that regardless of how a Blueberry is instantiated (locally, in
an iframe or using an envelope/template combination) a BlueberryHandle
will be returned and should operated in basically the same way, with
the caveat that obviously no operations will be applicable on an
"envelope-only" blueberry.

### Communicating with a nested Blueberry

If one blueberry instantiates another, it becomes the default place
for the new Blueberry to look for services.  Likewise, any "services"
that are provided by the nested Blueberry can be accessed by the
parent.

If the parent does _not_ specifically provide a service through the
Stalk's provideService method, then it is looked up in the parent's
containing environment until a match is found (if no match is found,
or the first match is a "deny", null is returned).

In order to communicate with a nested blueberry, an appropriate
implementation of a contract interface must first be obtained:

```javascript
requestContract: String name -> Interface contract
requestContract: ContractDefn defn -> Interface contract
```

This is essentially the same operation as called by the blueberry on
its own Stalk, but the difference is that this returns the "service
half" of the contract.  This handle is the one that is used to make
requests of (and/or provide data to) the child blueberry.

The respond-to-request quarter of the contract is located in the
service object that is attached to the stalk during initialization
using the provideService method.

## BlueberryPunnetHandle

Because a `BlueberryPunnet` has the ability to store multiple nested
blueberries, there is the need to add them to the punnet.  This can be
done either by adding seeds and expecting the Punnet to grow them, or
instantiating the Blueberry locally and then adding them

```javascript
add: BlueberrySeed seed -> Void
add: BlueberryHandle handle -> Void
```

For punnets that can display envelope data in lieu of displaying
actual cards, this method is used:

```javascript
renderEnvelopeWithTemplate: String envelopeType, String templateName -> Void
```

This specifies that all blueberries that wish to be added to the
punnet must implement the specified envelopeType and that the envelope
data can be rendered with the given template.  Note that because this
method is called from the containing blueberry, both of these objects
are referenced from within the containing blueberry and thus no
references are needed to the contents of the nested BlueberryVariety.

There is also (picking up and repeating a loose end from elsewhere),
probably the need to support the notion of adding a "tree" of
BlueberrySeeds to a punnet and expecting it to automatically grow them
into a full UI.  This is needed to support the "Recipe" functionality
in Ziniki.

## Blueboard

Although we like to think of contracts as all just being "additional"
features, the `Render` contract is special in a number of ways.  Most
importantly, it really isn't that optional; secondly, it is the place
where the blueberry is given access to a portion of screen real estate
(the entire screen, a fixed portion of the screen inside an `iframe`, or
a `div` within one of these).

The key method of the render contract is, reasonably enough, `render`:

```javascript
render: Blueboard space -> Void
```

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
support and use an HTML templating library and that the BlueberryVariety
will include a set of named templates.  This being the case, the
Blueboard has a method to render a template into the available space
as follows:

```javascript
renderTemplate: String name, Hash model -> Void
```

The template is looked up by name and rendered with the model
provided.

### Nesting Blueberries in the DOM

In order to nest blueberries visually, it is necessary to first create
new blueberries through the blueberry stalk and then take the returned
handles and insert them into the model so that the template finds them
and renders them into the DOM.

