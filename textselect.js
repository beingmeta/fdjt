/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

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

(function(){
     function wrapText(node,orig,wrapped,words){
	 if (node.nodeType===3) {
	     var text=node.nodeValue;
	     var sliced=text.split(/\b/), wordspans=[];
	     var i=0, lim=sliced.length, count=0;
	     while (i<lim) {
		 var word=sliced[i++];
		 if (word.length>0) {
		     var span=fdjtDOM("span",word);
		     span.id="FDJTWORD"+(allwords.length);
		     words.push(span);
		     wordspans.push(span);}}
	     return fdjtDOM("span.fdjtwrapped",wordspans);}
	 else if (node.nodeType!==1) return node;
	 else if (node.className==='fdjtwrapped') return node;
	 else if (node.nodeType===1) {
	     var children=node.childNodes;
	     if (!(children)) return node;
	     else if (children.length===0) return node;
	     else if (node.className==='wrapped') return node;
	     else {
		 var i=0, lim=children.length;
		 while (i<lim) {
		     var child=children[i++];
		     var wrapped=wrapText(child,orig,wrapped,words);
		     if (child!==wrapped) {
			 orig.push(child);
			 wrapped.push(wrapped);
			 node.replaceChild(wrapped,child);}}
		 return node;}}}

    function fdjtSelect(node){
	var orig=[], wrapped=[], words=[];
	var wrapper=fdjtDOM("div.fdjtselect",node);
	orig.push(node); wrapped.push(wrapper);
	this.orig=orig; this.wrapped=wrapped; this.words=words;
	this.wrapper=wrapper; this.node=node;
	this.start=false; this.end=false;
	this.start_off=-1; this.end_off=-1;
	wrapper.onclick=function(evt){
	    evt=evt||event;
	    var target=fdjtUI.T(evt);
	    while ((target)&&(target.nodeType!==1))
		target=target.parentNode;
	    if (!(this.start)) this.selectRange(target,target);
	    else this.selectRange(this.start,target);};
	wrapText(node,orig,wrapped,words);
	return this;}
	
    fdjtSelect.prototype.selectRange=function(start,end){
	var words=this.words;
	this.start=start; this.end=end;
	var start_off=parseInt(start.id.slice(8));
	var end_off=parseInt(end.id.slice(8));
	if (end_off<start_off) {
	    var tmp=start; start=end; end=tmp;
	    tmp=start_off; start_off=end_off; end_off=tmp;}
	if (this.start) 
	    dropClass(words.slice(this.start_off,this.end_off+1),"fdjtselected");
	var i=start_off;
	while (i<=end_off) addClass(words[i++],"fdjtselected");
	addClass(words[start_off],"fdjtselectstart");
	addClass(words[end_off],"fdjtselectend");
	this.start=start; this.end=end;
	this.start_off=start_off; this.end_off=end_off;};

    fdjtSelect.prototype.getString=function(){
	var words=this.words;
	var i=this.start_off, lim=this.end_off;
	if (i<0) return false;
	else return words.slice(i,lim+1).join("");};

    fdjtSelect.prototype.clear=function(){
	var orig=this.orig, wrapped=this.wrapped;
	var i=orig.length-1;
	while (i>=0) {
	    var o=orig[i], w=wrapped[i]; i--;
	    w.parentNode.replaceChild(o,w);}
	delete this.wrapped; delete this.orig;
	delete this.wrapper; delete this.node;};
    
    return fdjtSelect;})();
