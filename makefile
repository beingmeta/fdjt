# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
FDJT1_FILES=header.js jsutils.js oids.js json.js domutils.js \
            handlers.js scrolling.js richtips.js completion.js ajaxcall.js
FDJT2_FILES=header.js string.js time.js dom.js kb.js state.js log.js ui.js \
	    ajax.js json.js

all: fdjt.js v1.js v2.js

buildstamp1.js: $(FDJT1_FILES)
	$(ECHO) "var fdjt_revision='"`svnversion`"';" > buildstamp1.js
	$(ECHO) "var fdjt_buildhost='"`hostname`"';" >> buildstamp1.js
	$(ECHO) "var fdjt_buildtime='"`date`"';" >> buildstamp1.js 
buildstamp2.js: $(FDJT2_FILES)
	$(ECHO) "var fdjt_revision='"`svnversion`"';" > buildstamp2.js
	$(ECHO) "var fdjt_buildhost='"`hostname`"';" >> buildstamp2.js
	$(ECHO) "var fdjt_buildtime='"`date`"';" >> buildstamp2.js 

fdjt.js: $(FDJT_FILES) buildstamp2.js
	cat buildstamp2.js $(FDJT2_FILES) > $@
v1.js: $(FDJT1_FILES) buildstamp1.js
	cat buildstamp1.js $(FDJT1_FILES) > $@
v2.js: $(FDJT2_FILES) buildstamp2.js
	cat buildstamp2.js $(FDJT2_FILES) > $@


