# This is the makefile for generating combination files
# from the individual fdjt files.

all: fdjt.js

fdjt.js: jsutils.js json.js setops.js domutils.js handlers.js completion.js
	cat $^ > $@

