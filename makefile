# This is the makefile for generating combination files
# from the individual fdjt files.

FDJT_FILES=header.js jsutils.js oids.js json.js domutils.js \
	    handlers.js scrolling.js richtips.js completion.js ajax.js
FDJT2_FILES=header.js string.js time.js dom.js kb.js state.js log.js ui.js

all: fdjt.js v1.js v2.js

fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
v1.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
v2.js: $(FDJT2_FILES) buildstamp.js
	cat buildstamp.js $(FDJT2_FILES) > $@

buildstamp.js: $(FDJT_FILES)
	echo "var fdjt_buildhost='"`hostname`"';" > buildstamp.js
	echo "var fdjt_buildtime='"`date`"';" >> buildstamp.js 

