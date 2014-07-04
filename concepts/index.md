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

## BlueberrySeed

Blueberries can either be created directly by other, containing, code
or they can be grown from seed.  A seed needs to specify the name of a
"BlueberryBrand", essentially the "class" of Blueberry, together with
the data (if applicable) and state (if any) to use to render the
blueberry.

Remember that a "card" (Blueberry) is an "application"
(BlueberryBrand) showing "data" at a "state".

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