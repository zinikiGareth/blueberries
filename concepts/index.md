---
layout: page
title: Blueberry Concepts
---

## Introduction

There are a whole bunch of moving parts that go together.
We look at them one at a time.

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