# This is the makefile for generating combination files
# from the individual fdjt files.

FDJT_FILES=header.js jsutils.js json.js setops.js \
	    domutils.js handlers.js completion.js

all: fdjt.js

fdjt.js: $(FDJT_FILES)
	cat $(FDJT_FILES) > $@


