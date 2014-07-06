---
layout: page
title: Blueberry Concepts
---

## Introduction

In order to create a blueberry application, it is necessary to
assemble a stack of components from different sources and encourage
them to communicate.  This section discusses these components at a
conceptual level.

Although it is not possible to precisely define an API in JavaScript
(in particular, given the many different frameworks and object model
implementations) the [API](/api) section attempts to define the key
interfaces between the blueberry framework and individual blueberries.

## Application

When we talk about an application it is in terms of how the overall
package of code and resources is assembled.

In constructing an application, it is necessary to provide Ziniki with
a set of vendor javascript files, core application files and/or a root
blueberry.  Ziniki then packages this and automatically generates a
root HTML file for distribution.

In order to use blueberries, the application package must include a
root BlueberryContainer and implementations of any Services that are
to be made available to the instantiated Blueberries.

## BlueberryContainer

If the application has a root JavaScript class, then it must at some
point instantiate a BlueberryContainer.  The exact form of this
instantiation depends on the underlying JavaScript being used.

If the application does not have a root Javascript class, then the
BlueberryContainer essentially serves as the root class and is
automatically instantiated.

The BlueberryContainer wraps the underlying framework and provides its
services in a bi-directional fashion to any created blueberries.  Once
instantiated, it can create nested blueberries, and, in particular,
can create one main "central" blueberry if desired.

I'm not sure how it's going to work, but it is necessary that the
BlueberryContainer handlers all of the "top-level" operations.  In
particular, it needs to be able to handle the "URL fragments" that do
routing within the JavaScript application and, where applicable,
request blueberry seeds from the server and then instantiate the
nested tree of blueberries.

One possibility is that the routes are "statically" configured as part
of the overall server-side configuration.  Another possibility would
be to either require a root class that sets up the container and makes
calls into it, or to require a configuration class which is called
from within the BlueberryContainer's initialization process.

In practice, it may be that what makes the most sense is to allow the
initialization mechanism to be dependent on the underlying framework.

## BlueberryShell

A BlueberryShell is an interface between the native framework and the
concept of blueberries.  Each blueberry has a BlueberryShell
connecting it to the container through contracts.

This is an element that ties the framework to the Blueberry itself.

## BlueberryStalk

When a blueberry is created some object is injected into it.  Using
duck typing, this may be any sort of framework environment object, but
it must conform to the Stalk API to provide the operations that the
blueberry needs.

## Service

A Service is something that plugs in to the native framework
_strictly_ in the containing environment (i.e. not nested within an
iframe).  The set of services is independent of the application or the
blueberries but is generally tightly bound to the native framework and
you will need a different set of services for each different
containing environment framework.

## Contract

In order to access a service, you need a **contract**.  Each contract
is a small JSON object which describes the service to be accessed.
Such objects can be included in the application code bundle or can be
downloaded from a repository.  Either way, when referenced the system
is able to turn a contract into an object which provides the methods
defined in the contract and connect them to the service implementation
in the containing environment.

Contracts have unique names and can be so referenced by a blueberry
when communicating with a stalk.

It is possible that when a blueberry requests a contract, the request
will be denied; the blueberry must deal with this.

## BlueberrySeed

Blueberries can either be created directly by other, containing, code
or they can be grown from seed.  A seed needs to specify the name of a
"BlueberryVariety", essentially the "class" of Blueberry, together with
the data (if applicable) and state (if any) to use to render the
blueberry.

Remember that a "card" (Blueberry) is an "application"
(BlueberryVariety) showing "data" at a "state".

## BlueberryPunnet(s)

Each blueberry has a corresponding layout, probably constructed using
some template to display its data.  It may nest blueberries in any
locations it sees fit, but in particular it may be interesting in
nesting some kind of "group" of blueberries in a single container.
Such a container for blueberries is called a blueberry punnet.

There are six well-known archetypes for punnets which are: page,
board, list, queue, thread, feed.

### BlueberryNarrativePunnet

A page is a very simple type of punnet; in fact, it's sufficiently
simple that I'm not convinced it actually needs to exist as a Punnet
per se.  But if it does, it requires a template to be provided, which
contains references to individual (named) nested blueberries.  The
number of nested blueberries must, of course, match the number of
slots in the template.

### BlueberryDiscoveryPunnet

Discovery containers are used for information that can be retrieved
and organized.  The exact organization depends on the provided
template and controls.

A board allows the user to organize nested blueberries on a
two-dimensional grid.  The metaphor for this is essentially an OS
desktop with blueberries being able to be
grown/shrunk/selected/moved/iconified etc.

A list is an ordered set of items, where the ordering is defined by
user interaction, for example using drag and drop.

A feed is a set of items which are ordered by something other than the
user, e.g. chronology (the case which gives rise to the name feed) but
can be sorted by name or other properties.

For a list and a feed at least (less so for a board?), there is a
commonality to the items which can generally be expressed by
specifying a contract which all the items must implement.  If all the
items in a feed implement an envelope contract, the feed can be
configured to require that any items added to the feed must implement
this contract and then they can be rendered using an appropriate
template.

### BlueberryWorkflowPunnet

A BlueberryWorkflowPunnet is designed to support emergent workflows.
As "tasks" are created and become the responsibility of a particular
user, they are associated with a list somewhere in the system that is
then rendered with a WorkflowPunnet.

The WorkflowPunnet should include operations and visual cues to make
the manipulation of the workflow backlog easier and more systematic.

### BlueberryConversationPunnet

This is designed to support the nested use of threaded conversations.

Not sure of the details.

### Implementation Notes

There is, I believe, an issue for punnets that when items in iframes
are moved around the iframes need to be completely reloaded.  This
being the case, these punnets should be able to be moved into an
"envelope-only" mode specified either by the user or during reordering
operations.  The nested template (or chroming around the nested
template) should then offer the opportunity to "rehydrate" the
blueberry.

## BlueberryVariety

A BlueberryVariety is a package of JavaScript class files, templates and
resources together with explicit dependencies on specific framework
implementations of the blueberry stack and rules about trusting and
permissions all wrapped up and given a name and stored in the
BlueberryMarket.

The unique name is the one that can be referenced in a seed.

## Blueberry (or BlueberryInstance)

A `Blueberry` is a specific instance of a `BlueberryVariety` that has been
initialized by assigning it a data object (or none for an empty
Blueberry) and an existing state (or none for a clean Blueberry) and
some screen real estate (although this may be virtual on a server).
The blueberry will also be provided with a stalk by which it can
obtain access to the services it needs.

Each blueberry is wrapped in a BlueberryShell which mediates control
between the blueberry and its environment.

## Envelope

Data items are generally best understood and interpreted by the
individual BlueberryVarieties that "own" them, i.e. create and edit them.

However, Ziniki provides for an automated field-mapping system which
allows arbitrary native (JSON) data objects to be re-mapped to more
semantically rich Envelope objects.  Such an object represents a
public interface through which (certain of its) fields can be
manipulated.

When in doubt about the availability and suitability of individual
BlueberryVarieties, a Blueberry may choose to request a piece of data as
a specific Envelope type and render it with a suitable template.

There is no guarantee that any given data object will conform to a
given envelope type, but that can be enforced in the contextual rules
(i.e. you can't nest a blueberry in a specific punnet unless its data
matches a certain envelope).

## Template

In order to render HTML, I think the framework must provide "some"
kind of templating library, even if it just to say that a particular
method on a particular type of object can insert/update a DOM element.

Templates are needed in order to ask a Punnet to render all of the
blueberries in it using a certain Envelope.

## BlueberryMarket

It should be possible to retrieve any BlueberryVariety you desire from
the BlueberryMarket.  Such retrieval should be done under
"authorization" and record the user using the BlueberryVariety and the
number of times it is retrieved for payment purposes.