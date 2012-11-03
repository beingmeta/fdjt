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
		return new fdjtSelecting(nodes,opts);
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
	    var prefix=this.prefix="fdjtSel0"+this.serial;
	    selectors[prefix]=sel;
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
		wrapper.id=prefix+"w"+k;
		wrapper.title=((opts)&&(opts.title))||
		    "Tap or hold to select text range";
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
	    this.min=-1; this.max=-1; this.n_words=0;
	    this.onchange=((opts)&&(opts.onchange))||false;
	    var over=false;
	    // This gets the word offset for a particular target
	    this.wordnum=function wordnum(target){
		var id=false;
		while ((target)&&(target.nodeType!==1))
		    target=target.parentNode;
		if ((target)&&((id=target.id))&&
		    (target.tagName==="SPAN")&&
		    (id.search(prefix)===0))
		    return parseInt(id.slice(stripid));
		else return false;};
	    
	    return this;}
	
	function wrapText(node,orig,wrapped,words,prefix){
	    if (node.nodeType===3) {
		var text=node.nodeValue;
		var sliced=text.split(/\b/), wordspans=[];
		var i=0, lim=sliced.length, count=0;
		while (i<lim) {
		    var word=sliced[i++];
		    if (word.length===0) continue;
		    else if ((word.search(/\S/)>=0)&&
			     (word.search(/\s/)>=0)) {
			var scan=word;
			while (scan.length) {
			    var space=scan.search(/\s/);
			    var notspace=scan.search(/\S/);
			    var split=((space<=0)?(notspace):
				       (notspace<=0)?(space):
				       (space<notspace)?(space):
				       (notspace));
			    if (split<=0) split=scan.length;
			    var span=fdjtDOM(
				"span.fdjtword",scan.slice(0,split));
			    span.id=prefix+"_"+(words.length);
			    words.push(span);
			    wordspans.push(span);
			    scan=scan.slice(split);}}
		    else {
			var span=fdjtDOM("span.fdjtword",word);
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
		words[i++].className="fdjtword";}

	fdjtSelecting.prototype.setRange=function(start,end){
	    if (!(start)) {
		if ((this.start)&&(this.end)) {
		    deselectWords(this.words,this.min,this.max);}
		this.start=this.end=false;
		this.min=this.max=-1;
		this.n_words=0;
		if (this.onchange) this.onchange();
		return;}
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
		if ((min>cur_max)||(max<cur_min)) {
		    deselectWords(words,cur_min,cur_max);
		    selectWords(words,min,max);}
		else {
		    // Overlapping, just do the difference
		    if (min<cur_min) selectWords(words,min,cur_min);
		    else if (min>cur_min) deselectWords(words,cur_min,min);
		    else {}
		    if (max>cur_max) selectWords(words,cur_max,max);
		    else if (max<cur_max) deselectWords(words,max,cur_max);
		    else {}}
		words[max].className="fdjtselectend";
	    	words[min].className="fdjtselectstart";}
	    this.min=min; this.max=max;
	    this.start=start; this.end=end;
	    this.n_words=(max-min)+1;
	    if (this.onchange) this.onchange();}

	/* Handler support */
	
	function overWord(word){
	    var sel=false, id=false;
	    while ((word)&&(word.nodeType!==1)) word=word.parentNode;
	    if ((word)&&((id=word.id))&&
		(word.tagName==='SPAN')&&
		(id.search("fdjtSel")===0)) {
		var split=id.indexOf("_");
		if (split) sel=selectors[id.slice(0,split)];}
	    if (!(sel)) {
		var container=word; while (container) {
		    if ((container.className)&&(container.id)&&
			(container.className.search(/\bfdjtselecting\b/)>=0))
			break;
		    else container=container.parentNode;}
		if (!(container)) return false;
		else sel=selectors[container.id];}
	    if (!(sel)) return false;
	    if (!(sel.start))
		// We could have some impressive smarts here
		sel.setRange(word,word);
	    else if (sel.start===sel.end)
		// Just one word is selected, so use word as the 'end' and
		// let setRange sort out the correct order
		sel.setRange(sel.start,word);
	    else {
		var off=sel.wordnum(word);
		var start=sel.start, end=sel.end;
		// Figure out whether you're moving the beginning or end
		if (off<=sel.min) start=word;
		else if (off>=sel.max) end=word;
		// Tried this implementation and it just doesn't feel right
		// else if ((off-sel.min)<((sel.max-sel.min)/2)) start=word;
		else if ((off-sel.min)<3) start=word;
		else end=word;
		sel.setRange(start,end);}
	    return true;}

	function getSelector(word){
	    var id=false;
	    if ((word)&&((id=word.id))&&
		(word.tagName==='SPAN')&&
		(id.search("fdjtSel")===0)) {
		var split=id.indexOf("_");
		if (split)
		    return selectors[id.slice(0,split)]||false;
		else return false;}
	    else return false;}


	// Getting the selection text
	// This tries to be consistent with textify functions in fdjtDOM
	fdjtSelecting.prototype.setString=function(string){
	    var wrappers=this.wrappers;
	    var whole=((wrappers.length===1)&&(wrappers[0]));
	    if (!(whole)) {
		whole=fdjtDOM("div"); 
		var i=0, lim=wrappers.length;
		while (i<lim) {
		    var wrapper=wrappers[i++];
		    whole.appendChild(wrapper.cloneNode(true));}}
	    var found=fdjtDOM.findString(whole,string);
	    if (!(found)) return;
	    var start=found.startContainer, end=found.endContainer;
	    while ((start)&&(start.nodeType!==1)) start=start.parentNode;
	    while ((end)&&(end.nodeType!==1)) end=end.parentNode;
	    if ((start)&&(end)&&(start.id)&&(end.id)&&
		(start.id.search(this.prefix)===0)&&
		(end.id.search(this.prefix)===0)) {
		start=document.getElementById(start.id);
		end=document.getElementById(end.id);}
	    else return;
	    if ((start)&&(end)) this.setRange(start,end);}

	fdjtSelecting.prototype.getString=function(start,end){
	    if (!(start)) start=this.start; if (!(end)) end=this.end;
	    var words=this.words; var wrappers=this.wrappers; 
	    var combine=[]; var prefix=this.prefix; var wpos=-1;
	    var scan=start; while (scan) {
		if (scan.nodeType===1) {
		    var style=getStyle(scan);
		    if (style.display!=='inline') combine.push("\n");}
		if ((scan.nodeType===1)&&(scan.tagName==='SPAN')&&
		    (scan.id)&&(scan.id.search(prefix)===0)) {
		    combine.push(scan.firstChild.nodeValue);
		    if (scan===end) break;}
		if ((scan.firstChild)&&(scan.firstChild.nodeType!==3))
		    scan=scan.firstChild;
		else if (scan.nextSibling) scan=scan.nextSibling;
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
	    return combine.join("");}

	fdjtSelecting.prototype.getOffset=function(){
	    if (!(this.start)) return false;
	    var selected=this.getString();
	    var preselected=this.getString(this.words[0],this.end);
	    return preselected.length-selected.length;}
	
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
	    delete selectors[this.prefix];
	    delete this.wrapped; delete this.orig;
	    delete this.wrappers; delete this.nodes;
	    delete this.words; delete this.wrappers;
	    delete this.start; delete this.end;};
	
	// Handlers

	function hold_handler(evt){
	    evt=evt||event;
	    var target=fdjtUI.T(evt);
	    while ((target)&&(target.nodeType!==1)) target=target.parentNode;
	    if ((target)&&(target.id)&&(target.tagName==='SPAN')&&
		(target.id.search("fdjtSel")===0))
		if (overWord(target)) fdjtUI.cancel(evt);}
	fdjtSelecting.hold_handler=hold_handler;
	fdjtSelecting.handler=hold_handler;
	function tap_handler(evt){
	    evt=evt||event;
	    var target=fdjtUI.T(evt);
	    while ((target)&&(target.nodeType!==1)) target=target.parentNode;
	    if ((target)&&(target.id)&&(target.tagName==='SPAN')&&
		(target.id.search("fdjtSel")===0)) {
		if ((target.className==="fdjtselectstart")||
		    (target.className==="fdjtselectend")) {
		    var sel=getSelector(target);
		    if (sel.n_words===1) sel.setRange(false);
		    else {
			fdjtUI.cancel(evt);
			sel.setRange(target,target);}}
		else if (overWord(target)) fdjtUI.cancel(evt);}}
	fdjtSelecting.tap_handler=tap_handler;
	
	function addHandlers(container,sel,opts){
	    fdjtUI.TapHold(container);
	    fdjtDOM.addListener(container,"tap",
				((opts)&&(opts.ontap))||
				tap_handler);
	    fdjtDOM.addListener(container,"hold",
				((opts)&&(opts.onhold))||
				hold_handler);
	    if ((opts)&&(opts.onrelease))
		fdjtDOM.addListener(
		    container,"release",(opts.onrelease));}

	// Return the constructor
	return fdjtSelecting;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
