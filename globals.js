/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file was created from several component files and is
   part of the FDJT web toolkit (www.fdjt.org)

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   The copyright notice of the individual files are all prefixed by
   a copyright notice of the form "Copyright (C) ...".

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/
/* globals window, global */

(function(){
    "use strict";
    fdjt.useGlobals=fdjt.dbg=function(cxt){
        var names=["fdjtDOM","fdjtUI","fdjtTime","fdjtString","fdjtState",
                   "fdjtLog","fdjtHash","fdjtAjax","fdjtAsync","fdjtInit",
                   "fdjtDialog","fdjtTemplate","fdjtID","fdjtRef",
                   "fdjtTapHold","fdjtSelecting","fdjtTextIndex","fdjtRefDB",
                   "TextIndex","RefDB","CodexLayout","Pager"];
        if (!(cxt)) cxt=window;
        if (!(cxt)) {
            fdjt.Log("Nowhere to put globals");
            return;}
        var i=0, n=names.length; while (i<n) {
            var name=names[i++];
            var fname=((name.search("fdjt")===0)?(name.slice(4)):(name));
            if ((fdjt[fname])&&(!(cxt[name]))) {
                fdjt.Log("%s = fdjt.%s",name,fname);
                cxt[name]=fdjt[fname];}}
        return n;};
    window.addEventListener("load",function(){
        fdjt.useGlobals(global||window);});})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
