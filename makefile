# This is the makefile for generating combination files
# from the individual fdjt files.

FDJT_FILES=header.js jsutils.js oids.js json.js domutils.js \
	    handlers.js scrolling.js richtips.js completion.js ajax.js

all: fdjt.js

fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@

buildstamp.js: $(FDJT_FILES)
	echo "var fdjt_buildhost='"`hostname`"';" > buildstamp.js
	echo "var fdjt_buildtime='"`date`"';" >> buildstamp.js 

