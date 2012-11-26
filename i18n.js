/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/i18n.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
   of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

if (window) {
    if (!(window.fdjt)) window.fdjt={};}
else if (typeof fdjt === "undefined") fdjt={};
else {}

if (!(fdjt.i18n))
    fdjt.i18n=(function(){
	var apps={};
	var maps=[];
	
	function getMap(app,lang){
	    var appmap=apps[app];
	    if (!(appmap)) apps[app]=appmap={};
	    if (appmap[lang]) return appmap[lang];
	    var newmap={_app: app, _lang: lang};
	    if (lang.indexOf("-")) {
		var base=lang.slice(0,lang.indexOf("-"));
		newmap._base=getMap(app,baselang);}
	    appmap[lang]=newmap;
	    maps.push(newmap);
	    return newmap;}

	
    })();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
