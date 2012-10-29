/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/textselect.js ###################### */

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

var fdjtSelecting=
    (function(){

	var dropClass=fdjtDOM.dropClass;
	var addClass=fdjtDOM.addClass;
	var getStyle=fdjtDOM.getStyle;
	var getParent=fdjtDOM.getParent;

	var selectors={}; var serialnum=1;

	function fdjtSelecting(nodes){
	    if (!(this instanceof fdjtSelecting))
		return new fdjtSelecting(nodes);
	    var sel=this;
	    if (typeof nodes==='string') {
		var elt=document.getElementById(nodes);
		if (!(elt)) return false;
		else nodes=[elt];}
	    else if (nodes.nodeType) nodes=[nodes];
	    else if (!(nodes.length)) return false;
	    else {}
	    var orig=[], wrapped=[], words=[], wrappers=[];
	    this.orig=orig; this.wrapped=wrapped;
	    this.nodes=nodes; this.wrappers=wrappers;
	    this.words=words; this.serial=serialnum++;
	    var k=0, n=nodes.length;
	    while (k<n) {
		var node=nodes[k++];
		var style=getStyle(node);
		var wrapper=
		    ((style.display==='inline')?
		     (fdjtDOM("span.fdjtselecting")):
		     (fdjtDOM("div.fdjtselecting")));
		wrapper.id="FDJTSELECTOR"+(serialnum++);
		selectors[wrapper.id]=sel;
		wrappers.push(wrapper);
		node.parentNode.replaceChild(wrapper,node);
		orig.push(node); wrapped.push(wrapper);
		this.wrapper=wrapper; this.node=node;
		this.start=false; this.end=false;
		this.min=-1; this.max=-1;
		var over=false;
		wrapper.onmouseup=updateRange;
		wrapper.onmousedown=updateRange;
		wrapper.onclick=fdjtUI.cancel;
		// wrapper.onmousemove=updateRange;
		wrapText(node,orig,wrapped,words);
		wrapper.appendChild(node);}
	    return this;}
	
	function wrapText(node,orig,wrapped,words){
	    if (node.nodeType===3) {
		var text=node.nodeValue;
		var sliced=text.split(/\b/), wordspans=[];
		var i=0, lim=sliced.length, count=0;
		while (i<lim) {
		    var word=sliced[i++];
		    if (word.length>0) {
			var span=fdjtDOM("span",word);
			span.id="FDJTWORD"+(words.length);
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
			var wrap=wrapText(child,orig,wrapped,words);
			if (child!==wrap) {
			    orig.push(child);
			    wrapped.push(wrap);
			    node.replaceChild(wrap,child);}}
		    return node;}}}

	function selectWords(words,start,end){
	    var i=start; while (i<=end)
		words[i++].className="fdjtselected";}
	function deselectWords(words,start,end){
	    var i=start; while (i<=end)
		words[i++].className="";}
	    

	fdjtSelecting.prototype.selectRange=function(start,end){
	    var words=this.words;
	    var min=parseInt(start.id.slice(8));
	    var max=parseInt(end.id.slice(8));
	    if (max<min) {
		var tmp=start; start=end; end=tmp;
		tmp=min; min=max; max=tmp;}
	    if (!(this.start)) {
		selectWords(words,min,max);
		words[max].className='fdjtselectend';
		words[min].className='fdjtselectstart';}
	    else {
		var cur_min=parseInt(this.start.id.slice(8));
		var cur_max=parseInt(this.end.id.slice(8));
		if (min<cur_min) 
		    selectWords(words,min,cur_min);
		else if (min>cur_min)
		    deselectWords(words,cur_min,min);
		else {}
		if (max>cur_max) 
		    selectWords(words,cur_max,max);
		else if (max<cur_max)
		    deselectWords(words,max,cur_max);
		else {}
		words[max].className="fdjtselectstart";
	    	words[min].className="fdjtselectstart";}
	    this.min=min; this.max=max;
	    this.start=start; this.end=end;}
	
	fdjtSelecting.prototype.getString=function(){
	    var words=this.words; var sel=[];
	    var i=this.start_off, lim=this.end_off;
	    if (i<0) return false;
	    else while (i<=lim) 
		sel.push(words[i++].firstChild.nodeValue);
	    return sel.join("");}

	fdjtSelecting.prototype.clear=function(){
	    var wrappers=this.wrappers;
	    var orig=this.orig, wrapped=this.wrapped;
	    var i=orig.length-1;
	    while (i>=0) {
		var o=orig[i], w=wrapped[i]; i--;
		w.parentNode.replaceChild(o,w);}
	    var i=0, lim=wrappers.length;
	    while (i<lim) {
		var wrapper=wrappers[i++];
		delete selectors[wrapper.id];}
	    delete this.wrapped; delete this.orig;
	    delete this.wrappers; delete this.nodes;
	    delete this.words; delete this.wrappers;
	    delete this.start; delete this.end;};
	
	function updateRange(evt){
	    evt=evt||event;
	    if (evt.button) return;
	    var target=fdjtUI.T(evt);
	    while ((target)&&(target.nodeType!==1))
		target=target.parentNode;
	    if (!(target)) return;
	    if (target.tagName!=="SPAN") return;
	    var select_elt=getParent(target,".fdjtselecting");
	    if (!(select_elt)) return;
	    else fdjtUI.cancel(evt);
	    var sel=selectors[select_elt.id];
	    if (!(sel.start))
		sel.selectRange(target,target);
	    else if (sel.start===sel.end)
		sel.selectRange(sel.start,target);
	    else {
		var off=parseInt(target.id.slice(8));
		var start=sel.start, end=sel.end;
		if (off<=sel.min) start=target;
		else if (off>=sel.max) end=target;
		else if ((off-sel.min)<((sel.max-sel.min)/2))
		    end=target;
		else start=target;
		sel.selectRange(start,end);}}

	return fdjtSelecting;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
