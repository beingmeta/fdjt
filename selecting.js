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

	function position(elt,arr){
	    if (arr.indexOf) return arr.indexOf(elt);
	    else {
		var i=0, lim=arr.length;
		while (i<lim) {
		    if (arr[i]===elt) return i;
		    else i++;}
		return -1;}}

	var selectors={}; // Maps DOM ids to instances
	var serialnum=0;  // Tracks instances

	function fdjtSelecting(nodes,opts){
	    if (!(this instanceof fdjtSelecting))
		return new fdjtSelecting(nodes);
	    else this.serial=++serialnum;
	    if (typeof nodes==='string') {
		var elt=document.getElementById(nodes);
		if (!(elt)) return false;
		else this.nodes=nodes=[elt];}
	    else if (nodes.nodeType) this.nodes=nodes=[nodes];
	    else if (!(nodes.length)) return false;
	    else this.nodes=nodes;
	    var sel=this;
	    var orig=this.orig=[], wrapped=this.wrapped=[];
	    var words=this.words=[], wrappers=this.wrappers=[];
	    var prefix=this.prefix="fdjtSel"+this.serial;
	    var lengths=this.lengths={};
	    var stripid=prefix.length+1;
	    var k=0, n=nodes.length;
	    while (k<n) {
		var node=nodes[k++];
		var style=getStyle(node);
		var wrapper=
		    ((style.display==='inline')?
		     (fdjtDOM("span.fdjtselecting")):
		     (fdjtDOM("div.fdjtselecting")));
		// Initialize the wrapper
		wrapper.id=prefix+"_W"+k;
		selectors[wrapper.id]=sel;
		wrappers.push(wrapper);
		addHandlers(wrapper,sel,opts);
		// Replace the node with the wrapper and then update
		// the node (replacing words with spans) while it's
		// outside of the DOM for performance.
		node.parentNode.replaceChild(wrapper,node);
		orig.push(node); wrapped.push(wrapper);
		// Actually wrap the words in spans
		wrapText(node,orig,wrapped,words,prefix);
		// And put the node back into the DOM
		wrapper.appendChild(node);}
	    // These track the state of the current selection
	    //  for this instance
	    this.start=false; this.end=false;
	    this.min=-1; this.max=-1;
	    var over=false;
	    // This can be called when over a target and expands or
	    // contracts the selection based on the target.
	    function over(target){
		while ((target)&&(target.nodeType!==1))
		    target=target.parentNode;
		if ((target)&&(target.id)&&
		    (target.tagName==="SPAN")&&
		    (target.id.search(prefix)===0)) {
		    if (over===target) return false;
		    else over=target;
		    return this.overWord(over);}}
	    this.over=over;
	    // This gets the word offset for a particular target
	    this.wordnum=function wordnum(target){
		while ((target)&&(target.nodeType!==1))
		    target=target.parentNode;
		if ((target)&&(target.id)&&
		    (target.tagName==="SPAN")&&
		    (target.id.search(prefix)===0))
		    return parseInt(target.id.slice(stripid));
		else return false;};
	    return this;}
	
	function wrapText(node,orig,wrapped,words,prefix){
	    if (node.nodeType===3) {
		var text=node.nodeValue;
		var sliced=text.split(/\b/), wordspans=[];
		var i=0, lim=sliced.length, count=0;
		while (i<lim) {
		    var word=sliced[i++];
		    if (word.length>0) {
			var span=fdjtDOM("span",word);
			span.id=prefix+"_"+(words.length);
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
			var wrap=wrapText(child,orig,wrapped,words,prefix);
			if (child!==wrap) {
			    orig.push(child);
			    wrapped.push(wrap);
			    node.replaceChild(wrap,child);}}
		    return node;}}}

	/* Selecting ranges */

	function selectWords(words,start,end){
	    var i=start; while (i<=end)
		words[i++].className="fdjtselected";}
	function deselectWords(words,start,end){
	    var i=start; while (i<=end)
		words[i++].className="";}

	fdjtSelecting.prototype.selectRange=function(start,end){
	    var words=this.words;
	    var min=this.wordnum(start), max=this.wordnum(end);
	    if (max<min) {
		var tmp=start; start=end; end=tmp;
		tmp=min; min=max; max=tmp;}
	    if (!(this.start)) {
		// First selection
		selectWords(words,min,max);
		words[max].className='fdjtselectend';
		words[min].className='fdjtselectstart';}
	    else if ((this.start===start)&&(this.end===end)) return;
	    else {
		// Minimize the effort for a change in selection
		var cur_min=this.wordnum(this.start);
		var cur_max=this.wordnum(this.end);
		if (min<cur_min) selectWords(words,min,cur_min);
		else if (min>cur_min) deselectWords(words,cur_min,min);
		else {}
		if (max>cur_max) selectWords(words,cur_max,max);
		else if (max<cur_max) deselectWords(words,max,cur_max);
		else {}
		words[max].className="fdjtselectstart";
	    	words[min].className="fdjtselectstart";}
	    this.min=min; this.max=max;
	    this.start=start; this.end=end;}

	/* Handler support */
	
	function overWord(word){
	    var container=word; while (container) {
		if ((container.className)&&(container.id)&&
		    (container.className.search(/\bfdjtselecting\b/)>=0))
		    break;
		else container=container.parentNode;}
	    if (!(container)) return;
	    var sel=selectors[container.id];
	    if (!(sel.start))
		sel.selectRange(word,word);
	    else if (sel.start===sel.end)
		// selectRange sorts out the correct start/end order
		sel.selectRange(word,target);
	    else {
		var off=sel.wordnum(word);
		var start=sel.start, end=sel.end;
		// Figure out which one you're changing
		if (off<=sel.min) start=target;
		else if (off>=sel.max) end=target;
		else if ((off-sel.min)<((sel.max-sel.min)/2)) end=target;
		else start=target;
		sel.selectRange(start,end);}}

	// Getting the selection

	// This should be consistent with textify/textlen functions in fdjtDOM.
	fdjtSelecting.prototype.getString=function(){
	    var words=this.words; var wrappers=this.wrappers; 
	    var combine=[]; var prefix=this.prefix; var wpos=-1;
	    var scan=this.start; var end=this.end;
	    while (scan) {
		if (scan.nodeType===1) {
		    var style=getStyle(scan);
		    if (style.display!=='inline') combine.push(" // ");}
		if ((scan.nodeType===1)&&(scan.tagName==='SPAN')&&
		    (scan.id)&&(scan.id.search(prefix)===0)) {
		    combine.push(scan.firstChild.nodeValue);
		    if (scan===end) break;}
		if (scan.nextSibling) scan=scan.nextSibling;
		else {
		    while (scan) {
			if ((wpos=position(scan,wrappers))>=0) break;
			else if (scan.nextSibling) {
			    scan=scan.nextSibling; break;}
			else scan=scan.parentNode;}
		    if (wpos>=0) {
			if ((wpos+1)<wrappers.length)
			    scan=wrappers[wpos+1];}}
		if (!(scan)) break;}
	    return combine.join("");};

	// Life span functions

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
	
	// Handlers

	function updateSelection(evt){
	    evt=evt||event;
	    var target=fdjtUI.T(evt);
	    var container=getParent(target,".fdjtselecting");
	    if (!(container)) return;
	    else fdjtUI.cancel(evt);
	    var sel=selectors[container.id];
	    if (!(sel.start))
		sel.selectRange(target,target);
	    else if (sel.start===sel.end)
		sel.selectRange(sel.start,target);
	    else {
		var off=sel.wordnum(target);
		var start=sel.start, end=sel.end;
		if (off<=sel.min) start=target;
		else if (off>=sel.max) end=target;
		else if ((off-sel.min)<((sel.max-sel.min)/2))
		    start=target;
		else end=target;
		sel.selectRange(start,end);}}

	function addHandlers(container){
	    container.onmousedown=updateSelection;
	    container.onmouseup=updateSelection;}

	// Return the constructor
	return fdjtSelecting;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
