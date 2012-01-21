# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
CLEAN=/bin/rm -f
FDJT_FILES=header.js string.js time.js dom.js kb.js state.js log.js ui.js \
	taphold.js ajax.js json.js hash.js wsn.js syze.js

all: fdjt.js

buildstamp.js: $(FDJT_FILES)
	$(ECHO) "var fdjt_revision='"`git describe`"';" > buildstamp.js
	$(ECHO) "var fdjt_buildhost='"`hostname`"';" >> buildstamp.js
	$(ECHO) "var fdjt_buildtime='"`date`"';" >> buildstamp.js 
fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
TAGS: $(FDJT_FILES)
	etags -o $@ $^
ext/underscore.js: ext/underscore/underscore.js
	cp -p ext/underscore/underscore.js ext/underscore.js
ext/sizzle.js: ext/sizzle/sizzle.js
	cp -p ext/sizzle/sizzle.js ext/sizzle.js
ext/augment/dist/augment-0.2.1.js ext/underscore/underscore.js ext/sizzle/sizzle.js:
	git submodule init
	git submodule update

clean: 
	$(CLEAN) fdjt.js buildstamp.js
