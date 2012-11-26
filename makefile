# This is the makefile for generating combination files
# from the individual fdjt files.

ECHO=/bin/echo
CLEAN=/bin/rm -f
FDJT_FILES=header.js string.js time.js log.js init.js state.js \
	dom.js kb.js json.js ajax.js hash.js wsn.js ui.js \
	completions.js taphold.js adjustfont.js selecting.js \
	iscroll.js scrollever.js syze.js \
	globals.js
BUILDUUID:=`uuidgen`
BUILDTIME:=`date`
BUILDHOST:=`hostname`

all: fdjt.js

buildstamp.js: $(FDJT_FILES)
	$(ECHO) "// FDJT build information" > buildstamp.js
	$(ECHO) "var fdjt_revision='"`git describe`"';" >> buildstamp.js
	$(ECHO) "var fdjt_buildhost='${BUILDHOST}';" >> buildstamp.js
	$(ECHO) "var fdjt_buildtime='"${BUILDTIME}"';" >> buildstamp.js
	$(ECHO) "var fdjt_builduuid='"${BUILDUUID}"';" >> buildstamp.js 
	$(ECHO) >> buildstamp.js

fdjt.js: $(FDJT_FILES) buildstamp.js
	cat buildstamp.js $(FDJT_FILES) > $@
TAGS: $(FDJT_FILES) codexlayout.js
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
