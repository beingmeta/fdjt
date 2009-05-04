# This is the makefile for generating combination files
# from the individual fdjt files.

FDJT_FILES=header.js jsutils.js json.js domutils.js \
	    handlers.js richtips.js completion.js ajax.js

all: fdjt.js

fdjt.js: $(FDJT_FILES)
	cat $(FDJT_FILES) > $@


