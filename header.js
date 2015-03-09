/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2015 beingmeta, inc.
   This file was created from several component files and is
   part of the FDJT web toolkit (www.fdjt.org)

   Portions of this code are available under the following license:
   * iScroll v4.2.5 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
   * Released under MIT license, http://cubiq.org/license

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
/* global
   fdjt_revision, fdjt_buildhost,
   fdjt_buildtime, fdjt_builduuid */

var fdjt=((typeof fdjt === "undefined")?({}):(fdjt));
var fdjt_versions=((typeof fdjt_versions === "undefined")?([]):
		   ((fdjt_versions)||[]));
(function(){
    "use strict";
    fdjt_versions.decl=function(name,num){
        if ((!(fdjt_versions[name]))||(fdjt_versions[name]<num))
            fdjt_versions[name]=num;};

    // Some augmentations
    if (!(Array.prototype.indexOf))
        Array.prototype.indexOf=function(elt,i){
            if (!(i)) i=0; var len=this.length;
            while (i<len) if (this[i]===elt) return i; else i++;
            return -1;};
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = function(o){
            if (o !== Object(o))
                throw new TypeError('Object.keys called on non-object');
            var ret=[], p;
            for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
            return ret;};}

    if (!String.prototype.trim) {
        String.prototype.trim = (function () {
            var trimLeft  = /^\s+/, trimRight = /\s+$/;
            
            return function () {
                return this.replace(trimLeft, "").replace(trimRight, "");};});}
})();

fdjt.revision=fdjt_revision;
fdjt.buildhost=fdjt_buildhost;
fdjt.buildtime=fdjt_buildtime;
fdjt.builduuid=fdjt_builduuid;
