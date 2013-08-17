/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/string.js ###################### */

/* Copyright (C) 2009-2013 beingmeta, inc.
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

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.Template=(function(){
    var templates={};

    function Template(text,data){ /* Filling in templates */
	if (typeof data === "string") {
	    var tmp=data; data=text; text=tmp;}
	if ((!(text))&&(data)&&(data.template)) text=data.template;
	// Maybe a warning?
	if (typeof text !== "string") return;
	if (Template.localTemplates.hasOwnProperty(text))
	    text=Template.localTemplates[text];
	else if (templates.hasOwnProperty(text))
	    text=templates[text];
	else {}
	var substs=text.match(/{{\w+}}/gm);
	if (substs) {
	    var i=0, n=substs.length; while (i<n) {
		var match=substs[i++];
		var prop=match.slice(2,-2);
		var val=((data.hasOwnProperty(prop))&&(data[prop]));
		if (val) text=
		    text.replace(new RegExp(match,"g"),val.toString());}}
	return text;}

    fdjt.Templates=templates;
    Template.localTemplates={};

    function toDOM(text,data){
	var output=Template(text,data);
	var dom=document.createElement("div");
	dom.innerHTML=output;
	if (!(dom.childNodes)) return false;
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
