---
layout: page
title: Blueberry Concepts
---

## Introduction

There are a whole bunch of moving parts that go together.
We look at them one at a time.

The actual form of the APIs will reflect the object model(s) that
are supported by the enclosing framework, but in each Blueberry
implementation there should be some implementation of each of these
concepts.

## Application

The application consists of an automatically generated HTML file that
includes all the framework files and all of the code, templates and
resources needed for the application.

This requires a configuration object.

## BlueberryContainer

The BlueberryContainer is a projection of the key framework which
provides the root entry point through inversion of control and injects
itself into the main code.

This needs to have all the controls to handle partial routes.

This needs to have to recover all the seeds for a particular recipe.

This needs to have a method that instantiates blueberries from seeds.

This is created as part of the initialization process and then creates
the root blueberry, injecting itself into it.

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

There are six well-known archetypes for punnets which are: list,
stream, dashboard, ...

Each blueberry environment should provide all six punnets in an easy
to use form.

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