# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
CLEAN=/bin/rm -f
FDJT_FILES=header.js string.js time.js dom.js kb.js state.js log.js ui.js \
	    ajax.js json.js

all: fdjt.js

buildstamp.js: $(FDJT_FILES)
	$(ECHO) "var fdjt_revision='"`git describe`"';" > buildstamp.js
	$(ECHO) "var fdjt_buildhost='"`hostname`"';" >> buildstamp.js
	$(ECHO) "var fdjt_buildtime='"`date`"';" >> buildstamp.js 
fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
clean: 
	$(CLEAN) fdjt.js buildstamp.js
