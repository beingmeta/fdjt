/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/string.js ###################### */

/* Copyright (C) 2009-2014 beingmeta, inc.
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
/* jshint browser: true */
// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.Template=(function(){
    "use strict";
    var fdjtLog=fdjt.Log;
    var templates={};

    function Template(text,data,xdata){ /* Filling in templates */
        var dom=false;
        if (typeof data === "string") {
            var tmp=data; data=text; text=tmp;}
        if ((!(text))&&(data)&&(data.template)) text=data.template;
        // Maybe a warning?
        if (typeof text === "string") {}
        else if (text.nodeType===3) {
            dom=text; text=dom.nodeValue;}
        else if (text.nodeType===1) {
            dom=text; text=dom.innerHTML;}
        else {
            fdjtLog.warn("Bad argument %o to Template",text);
            return;}
        if (Template.localTemplates.hasOwnProperty(text))
            text=Template.localTemplates[text];
        else if (templates.hasOwnProperty(text))
            text=templates[text];
        else {}
        var substs=text.match(/{{\w+}}/gm), done={};
        if (substs) {
            var i=0, n=substs.length; while (i<n) {
                var match=substs[i++];
                var prop=match.slice(2,-2);
                if (done[prop]) continue;
                if (!((data.hasOwnProperty(prop))||
                      ((xdata)&&(xdata.hasOwnProperty(prop))))) {
                    fdjtLog.warn("No data for %s in %s to use in %s",prop,data,text);
                    done[prop]=prop;
                    continue;}
                var val=data[prop]||((xdata)&&(xdata[prop]))||"";
                done[prop]=prop;
                text=text.replace(new RegExp(match,"gm"),val.toString());}}
        if (dom) {
            if (dom.nodeType===3) dom.nodeValue=text;
            else dom.innerHTML=text;
            return dom;}
        else return text;}

    var template=Template;

    fdjt.Templates=templates;
    Template.localTemplates={};

    function toDOM(text,data,dom_arg){
        var output=template(text,data);
        var dom=((!(dom_arg))?(document.createElement("div")):
                 (dom_arg.nodeType)?(dom_arg):
                 (typeof dom_arg === "string")?
                 (document.createElement(dom_arg)):
                 (document.createElement("div")));
        dom.innerHTML=output;
        if ((dom_arg)&&(dom_arg.nodeType)) return dom;
        else if (!(dom.childNodes)) return false;
        else if (dom.childNodes.length===1)
            return dom.childNodes[0];
        else {
            var frag=document.createDocumentFragment, nodes=[];
            var children=dom.childNodes;
            var i=0, lim=children.length;
            while (i<lim) nodes.push(children[i++]);
            i=0; while (i<lim) frag.appendChild(nodes[i++]);
            return frag;}}

    Template.toDOM=toDOM;

    return Template;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
