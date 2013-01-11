/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/codex.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   It implements a method for breaking narrative HTML content
   across multiple pages, attempting to honor page break constraints,
   etc.

   Check out the 'mini manual' at the bottom of the file or read the
   code itself.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or any
   later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

   Use and redistribution (especially embedding in other CC licensed
   content) is also permitted under the terms of the Creative Commons
   "Attribution-NonCommercial" license:

   http://creativecommons.org/licenses/by-nc/3.0/ 

   Other uses may be allowed based on prior agreement with
   beingmeta, inc.  Inquiries can be addressed to:

   licensing@beingmeta.com

   Enjoy!

*/

if (window) {
    if (!(window.fdjt)) window.fdjt={};}
else if (typeof fdjt === "undefined") fdjt={};
else {}

fdjt.CodexLayout=
    (function(){

	var fdjtDOM=fdjt.DOM;
	var fdjtString=fdjt.String;
	var fdjtLog=fdjt.Log;
	var fdjtTime=fdjt.Time;
	var fdjtState=fdjt.State;
	var fdjtID=fdjt.ID;

	var hasContent=fdjtDOM.hasContent;
	var getGeometry=fdjtDOM.getGeometry;
	var getDisplay=fdjtDOM.getDisplay;
	var hasParent=fdjtDOM.hasParent;
	var getParent=fdjtDOM.getParent;
	var getStyle=fdjtDOM.getStyle;
	var parsePX=fdjtDOM.parsePX;
	var geomString=fdjtDOM.geomString;
	var insertBefore=fdjtDOM.insertBefore;
	var hasClass=fdjtDOM.hasClass;
	var addClass=fdjtDOM.addClass;
	var dropClass=fdjtDOM.dropClass;
	var swapClass=fdjtDOM.swapClass;
	var nextElt=fdjtDOM.nextElt;
	var forward=fdjtDOM.forward;
	var TOA=fdjtDOM.toArray;
	var getElementValue=fdjtDOM.getElementValue;
	
	var floor=Math.floor;

	function appendChildren(node,children,start){
	    var lim=children.length; var i=(start)||0;
	    var frag=document.createDocumentFragment();
	    while (i<lim) {
		if (children[i])
		    frag.appendChild(children[i++]);
		else i++;}
	    node.appendChild(frag);}

	function getGeom(elt,root,extra){
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var width=elt.offsetWidth;
	    var height=elt.offsetHeight;
	    var rootp=((root)&&(root.offsetParent));
	    var style=((extra)&&(getStyle(elt)));

	    if (elt===root) 
		return {left: 0,top: 0,width:width,height: height};
	    elt=elt.offsetParent;
	    while (elt) {
		if ((root)&&((elt===root)||(elt===rootp))) break;
		top += elt.offsetTop;
		left += elt.offsetLeft;
		elt=elt.offsetParent;}
	    
	    if (extra) {
		var t_margin=parsePX(style.marginTop);
		var r_margin=parsePX(style.marginRight);
		var b_margin=parsePX(style.marginBottom);
		var l_margin=parsePX(style.marginLeft);
		var t_padding=parsePX(style.paddingTop);
		var r_padding=parsePX(style.paddingRight);
		var b_padding=parsePX(style.paddingBottom);
		var l_padding=parsePX(style.paddingLeft);
		var t_border=parsePX(style.borderTopWidth);
		var r_border=parsePX(style.borderRightWidth);
		var b_border=parsePX(style.borderBottomWidth);
		var l_border=parsePX(style.borderLeftWidth);
		var outer_width=width+l_margin+r_margin;
		var outer_height=height+t_margin+b_margin;
		var inner_width=width-(l_border+l_padding+r_border+r_padding);
		var inner_height=height-(t_border+t_padding+b_border+b_padding);
		var lh=style.lineHeight, fs=style.fontSize, lhpx=false;
		if (lh==="normal") lhpx=parsePX(fs);
		else if (lh.search(/px$/)>0) lhpx=parsePX(lh);
		else if (lh.search(/%$/)>0) 
		    lhpx=(parseFloat(lh.slice(0,-1))/100)*(parsePX(fs));
		else lhpx=parsePX(fs);
		return {left: left, top: top, width: width,height: height,
			right:left+width,bottom:top+height,
			top_margin: t_margin, bottom_margin: b_margin,
			left_margin: l_margin, right_margin: r_margin,
			outer_height: outer_height,outer_width: outer_width,
			inner_height: inner_height,outer_width: inner_width,
			line_height: lhpx};}
	    else return {left: left, top: top, width: width,height: height,
			 right:left+width,bottom:top+height};}

	/* Node testing */

	var spacechars=" \n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";
	
	function isEmpty(string){
	    if (typeof string === "string")  {
		var i=0; var lim=string.length;
		if (lim===0) return true;
		while (i<lim) {
		    if (spacechars.indexOf(string[i])>=0) i++;
		    else return false;}
		return true;}
	    else return false;}
	
	    function optimizeLayoutRule(rule,dflt){
		if (!(rule)) return rule;
		else if (typeof rule === "string") {
		    if ((rule[0]===".")&&
			(rule.slice(1).search(/\.|#|\[/)<0)) 
			return new RegExp("\\b"+rule.slice(1)+"\\b");
		    else return new Selector(rule);}
		else if (rule instanceof RegExp) return rule;
		else if (rule.match) return rule;
		else if (rule.length) {
		    var newrules=[]; var firstrules=[];
		    var classes=[]; var selectors=[];
		    var i=0, lim=rule.length;
		    while (i<lim) {
			var r=rule[i++];
			if (typeof r !== "string") newrules.push(rule);
			else if (r[0]===".") {
			    if (r.slice(1).search(/\.|#|\[/)>=0)
				// complex selector (not just a classname)
				selectors.push(r);
			    else classes.push(r.slice(1));}
			else if ((r[0]==="#")||(r[0]==="["))
			    selectors.push(r);
			else classes.push(r);}
		    if (classes.length)
			firstrules.push(new RegExp("\\b("+classes.join("|")+")\\b"));
		    if (selectors.length)
			firstrules.push(new fdjtDOM.Selector(selectors.join(", ")));
		    return firstrules.concat(newrules);}
		else return rule;}

	function testNode(node,test) {
	    var tests;
	    if (!(test)) return true;
	    if (typeof test === 'string') tests=[test];
	    else if (test instanceof Array) tests=test;
	    else tests=[test];
	    var i=0; var lim=tests.length;
	    while (i<lim) {
		var atest=tests[i++];
		if (node===test) return true;
		else if (atest instanceof RegExp) {
		    if (!(node.className)) continue;
		    // Handle inadvertant use of selector syntax
		    if (node.className.search(atest)>=0) return true;}
		else if (typeof atest === 'string') {
		    if (!(node.className)) continue;
		    // Handle inadvertant use of selector syntax
		    if (atest[0]==='.') atest=atest.slice(1);
		    var classrx=new RegExp("\\b"+atest+"\\b");
		    if (node.className.search(classrx)>=0) return true;}
		else if ((atest.match)&&(atest.match(node)))
		    // This should get most versions of CSS selectors
		    return true;
		else {}}
	    return false;}

	function insideBounds(box){
	    var top=false, right=false, bottom=false, left=false;
	    function gatherBounds(node){
		if ((!(node))||(node.nodeType!==1)) return;
		var style=getStyle(node); var children;
		if ((style.position==='static')&&
		    ((node.tagName==='img')||(style.display!=='inline'))) {
		    var geom=getGeom(node,box);
		    if ((left===false)||(geom.left<left)) left=geom.left;
		    if ((top===false)||(geom.top<top)) top=geom.top;
		    if ((right===false)||(geom.right>right)) right=geom.right;
		    if ((bottom===false)||(geom.bottom>bottom))
			bottom=geom.bottom;}
		if ((children=node.childNodes)&&(children.length)) {
		    var i=0; var len=children.length;
		    while (i<len) gatherBounds(children[i++]);}}
	    var nodes=box.childNodes;
	    var j=0; var jlim=nodes.length;
	    while (j<jlim) gatherBounds(nodes[j++]);
	    return { left: left, top: top, right: right, bottom: bottom,
		     width: right-left, height: bottom-top};}
	
	var alerted=false;
	function default_logfn() {
	    if (alerted) return;
	    alert("Layout needs to log but cannot");
	    alerted=true;}
	
	/* Duplicating nodes */

	var tmpid_count=1;

	// This recreates a node and it's DOM context (containers) on
	//  a new page, calling itself recursively as needed
	function dupContext(node,page,dups,crumbs){
	    if ((node===document.body)||(node.id==="CODEXCONTENT")||
		(node.id==="CODEXROOT")||(hasClass(node,"codexroot"))||
		(hasClass(node,"codexpage")))
		return false;
	    else if (hasParent(node,page)) return node;
	    else if ((node.className)&&
		     (node.className.search(/\bcodexwraptext\b/)>=0))
		// We don't bother duplicating text wrapping convenience
		//  classes
		return dupContext(node.parentNode,page,dups,crumbs);
	    // Now we actually duplicate it.  
	    var id=node.id;
	    if (!(id)) id=node.getAttribute("data-baseid");
	    // If it doesn't have an ID, we give it one, because we'll want
	    //  to refer to it later while wanting to avoid DOM cycles
	    if (!(id)) id=node.id="CODEXTMPID"+(tmpid_count++);
	    else {
		// See if it's already been duplicated
		var dup=dups[id];
		if ((dup)&&(hasParent(dup,page))) return dup;}
	    // Duplicate it's parent
	    var copy=node.cloneNode(false);
	    var parent=dupContext(node.parentNode,page,dups,crumbs);
	    var nodeclass=node.className||"";
	    var duplicated=(nodeclass.search(/\bcodexdup.*\b/)>=0);
	    // Jigger the class name
	    copy.className=
		((nodeclass.replace(/\b(codexrelocated|codexdup.*)\b/,""))+
		 " codexdup").replace(/\s+/," ").trim();
	    if (!(duplicated)) {
		if (nodeclass.search(/\bcodexdupstart\b/)<0)
		    node.className=nodeclass+" codexdupstart";}
	    // If the original had an ID, save it in various ways
	    if (id) {
		copy.codexbaseid=id;
		copy.setAttribute("data-baseid",id);
		copy.id=null;}
	    // Record the copy you've made (to avoid recreation)
	    dups[id]=copy;
	    // If it's got a copied context, append it to the context;
	    //   otherwise, just append it to the page
	    if (parent) parent.appendChild(copy);
	    else page.appendChild(copy);
	    return copy;}

	/* Moving nodes */

	var codex_reloc_serial=1;
	
	function getFirstContent(node){
	    var child=node.firstChild;
	    while (child) {
		if (child.nodeType===3) {
		    if (!(isEmpty(child.nodeValue))) return child;}
		else if (child.nodeType!==1) {}
		else return child;
		child=child.nextSibling;}
	    return false;}
		    
	// This moves a node into another container, leaving
	// a back pointer for restoration
	function moveNode(arg,into,blockp,crumbs){
	    var baseclass; var node=arg;
	    if (hasParent(node,into)) return node;
	    if (node.nodeType===1) baseclass=node.className;
	    else if (node.nodeType===3) {
		// Wrap text nodes in elements before moving
		var wrapnode=fdjtDOM(
		    ((blockp)?"div.codexwraptext":"span.codexwraptext"));
		if (node.parentNode)
		    node.parentNode.replaceChild(wrapnode,node);
		wrapnode.appendChild(node);
		baseclass="codexwraptext";
		node=wrapnode;}
	    if ((node.parentNode)&&((!(node.id))||(!(crumbs[node.id])))) {
		// If the node has a parent and hasn't been moved before,
		//  we leave a "crumb" (a placeholder) in the original
		//  location.
		if (!(node.id)) node.id="CODEXTMPID"+(tmpid_count++);
		// Record origin information; we'll use this to revert
		//  the layout if we need to (for example, before
		//  laying out again under different constraints)
		var crumb=document.createTextNode("");
		crumbs[node.id]=crumb;
		if (baseclass) node.className=baseclass+" codexrelocated";
		else node.className="codexrelocated";
		node.parentNode.replaceChild(crumb,node);}
	    into.appendChild(node);
	    return node;}
	
	// This moves a node onto a page, recreating (as far as
	// possible) its original DOM context on the new page.
	function moveNodeToPage(node,page,dups,crumbs){
	    if (hasParent(node,page)) return node;
	    var scan=node, parent=scan.parentNode;
	    // If we're moving a first child, we might as well move the parent
	    while ((parent)&&
		   (parent!==document.body)&&
		   (parent!==Codex.content)&&
		   (!(hasClass(parent,"codexpage")))&&
		   (scan===getFirstContent(parent))) {
		scan=parent; parent=scan.parentNode;}
	    var istop=(!hasContent(page));
	    if ((!(parent))||(parent===document.body)||
		(parent.id==="CODEXCONTENT")||(parent.id==="CODEXROOT")||
		(hasClass(parent,"codexroot"))||(hasClass(parent,"codexpage"))) {
		// You don't need to dup the parent on the new page
		moveNode(scan,page,false,crumbs);}
	    else {
		var dup_parent=dupContext(parent,page,dups,crumbs);
		moveNode(scan,dup_parent||page,false,crumbs);}
	    if (istop) {scan=node; while ((scan)&&(scan!==page)) {
		addClass(scan,"codexpagetop");
		scan=scan.parentNode;}}
	    return node;}

	// Reverting layout

	function restoreNode(node,info,crumbs,texts){
	    var id=node.id;
	    if (!(id)) return;
	    var origin=crumbs[id];
	    if (origin) {
		var parent=origin.parentNode;
		if (hasClass(node,/\bcodexwraptext\b/g)) {
		    if (hasClass(node,/\bcodexwraptextsplit\b/g))
			parent.replaceChild(texts[id],origin);
		    else parent.replaceChild(node.childNodes[0],origin);}
		else origin.parentNode.replaceChild(node,origin);}
	    dropClass(node,"codexrelocated");}
	
	function revertLayout(layout) {
	    var crumbs=layout.crumbs;
	    var textsplits=layout.textsplits;
	    var tweaked=TOA(
		layout.container.getElementsByClassName("codextweaked"));
	    if ((tweaked)&&(tweaked.length)) {
		layout.logfn("Dropping tweaks of %d relocated nodes",
			     tweaked.length);
		var i=0; var lim=tweaked.length;
		while (i<lim) {
		    var node=tweaked[i++]; node.style='';
		    dropClass(node,"codextweaked");
		    if ((node.tagName==='img')||(node.tagName==='IMG')) {
			node.width=''; node.height='';}}}
	    var pagescaled=TOA(
		layout.container.getElementsByClassName("codexpagescaled"))
	    var i=0, lim=pagescaled.length; while (i<lim) {
		var elt=pagescaled[i++];
		swapClass(elt,"codexpagescaled","codexpagescale");}
	    var cantsplit=TOA(
		layout.container.getElementsByClassName("codextweaked"));
	    dropClass(cantsplit,"codexcantsplit");
	    var split=TOA(
		layout.container.getElementsByClassName("codexsplitstart"));
	    var i=0, lim=split.length;
	    while (i<lim) {
		var node=split[i++];
		var nodeid=node.id;
		var text=textsplits[nodeid];
		node.parentNode.replaceChild(text,node);}
	    var shards=TOA(
		layout.container.getElementsByClassName("codextextsplit"));
	    var i=0, lim=shards.length;
	    while (i<lim) {
		var node=shards[i++];
		node.parentNode.removeChild(node);}
	    var moved=TOA(
		layout.container.getElementsByClassName("codexrelocated"));
	    if ((moved)&&(moved.length)) {
		layout.logfn(
		    "Restoring original layout of %d nodes and %d texts",
		    moved.length);
		var i=0; var lim=moved.length;
		while (i<lim)
		    restoreNode(moved[i++],layout,crumbs,textsplits);}
	    layout.textsplits={}; layout.crumbs={};}
	
	/* Codex trace levels */
	/* 0=notrace
	   1=trace tracked nodes
	   2=trace addition of top level chunks
	   3=trace insertion of page breaks
	   4=trace every node consideration
	*/

	function CodexLayout(init){
	    if (!(init)) init={};

	    var layout=this;

	    // Layout rules
	    var forcebreakbefore=this.forcebreakbefore=
		optimizeLayoutRule(init.forcebreakbefore||false);
	    var forcebreakafter=this.forcebreakafter=
		optimizeLayoutRule(init.forcebreakafter||false);
	    var avoidbreakinside=this.avoidbreakinside=
		optimizeLayoutRule(init.avoidbreakinside||false);
	    var avoidbreakafter=this.avoidbreakafter=
		optimizeLayoutRule(init.avoidbreakafter||false);
	    var avoidbreakbefore=this.avoidbreakbefore=
		optimizeLayoutRule(init.avoidbreakbefore||false);
	    var scaletopage=this.scaletopage=
		optimizeLayoutRule(init.scaletopage||false);
	    var fullpages=this.fullpages=
		optimizeLayoutRule(init.fullpages||false);
	    var singlepages=this.singlepages=
		optimizeLayoutRule(init.singlepages||false);
	    var floatpages=this.floatpages=
		optimizeLayoutRule(init.floatpages||false);

	    var pageprefix=this.pageprefix=init.pageprefix||"CODEXPAGE";

	    // Layout Dimensions
	    var page_height=this.height=init.page_height||fdjtDOM.viewHeight();
	    var page_width=this.width=init.page_width||fdjtDOM.viewWidth();
	    
	    // Break 'paragraphs' (anything with just text and inline nodes)
	    var break_blocks=this.break_blocks=
		((typeof init.break_blocks === 'undefined')?(true):
		 (init.break_blocks));

	    // Atomic nodes can't be broken.  Specifying this can
	    // speed up page layout in some cases.
	    var atomic=init.atomic||false;
	    if (typeof atomic === "string") atomic=fdjtDOM.selector(atomic);
	    else if ((atomic.length)&&(atomic.join))
		// Arrays of selector strings
		atomic=fdjtDOM.selector(atomic.join(","));
	    else {}
	    this.atomic=atomic;

	    var use_scaling=
		((typeof init.use_scaling === 'undefined')?(true):
		 (init.use_scaling))

	    // Scale pages (use CSS to shrink pages to fit)
	    var scale_pages=this.scale_pages=
		((use_scaling)&&
		 ((typeof init.scale_pages === 'undefined')?(true):
		  (init.scale_pages)));
	    this.scaledpages=[];

	    // This keeps track of item scaling
	    var scaled=this.scaled=[];

	    // This is the node DOM container where we place new pages
	    var container=this.container=
		init.container||fdjtDOM("div.codexpages");
	    
	    var logfn=this.logfn=
		init.logfn||CodexLayout.logfn||
		((typeof fdjtLog !== 'undefined')?(fdjtLog):(noop));

	    // STATE variables

	    var pagenum=this.pagenum=0; // Tracks current page number
	    var pages=this.pages=[]; // Array of all pages generated, in order
	    var dups=this.dups={}; // Tracks nodes/contexts already duplicated
	    // Maps IDs to text nodes left behind as placeholders when
	    //  the original nodes were moved.
	    var crumbs=this.crumbs={}; 
	    var cur_root=this.root=false; // The root currently being added

	    // Tracks text nodes which have been split, keyed by the
	    // temporary IDs assigned to them
	    var textsplits=this.textsplits={};

	    var page=this.page=init.page; // Contains the currently open page

	    var prev=this.prev=false; // The last terminal block we processed
	    var prevstyle=this.prevstyle=false;

	    // this.drag[] contains nodes which will go on the next
	    // page when we get there.  The nodes in this.drag[] have
	    // already been placed on pages, but we keep track of them
	    // in case we need to move them to a new page to honor
	    // nobreak constraints.
	    var drag=this.drag=[];

	    // this.float_pages contains fully-assembled page nodes to
	    // placed in pages after this one; it is intended for
	    // out-of-flow or 'too bit to fit' content
	    var float_pages=this.float_pages=[];

	    // this.float_blocks is an array of blocks to place into
	    // the flow there is a chance.  This is intended for use
	    // by figures/tables/etc which we don't want to embed
	    var float_blocks=this.float_blocks=[];

	    // Startup

	    this.started=false; // When we started
	    var trace=this.tracelevel=  // How much to trace
		init.tracelevel||CodexLayout.tracelevel||
		(fdjtState.getLocal("codexlayout.trace",true))||0;
	    var track=init.track||CodexLayout.track||
		(fdjtState.getLocal("codexlayout.track"))||false;
	    if (track) {
		this.track=track=fdjtDOM.Selector(track);
		if (!(trace)) trace=this.tracelevel=1;}
	    else this.track=false;
	    this.roots=init.roots||false; // Where all roots can be bracked
	    this.root_count=0; // Number of root nodes added
	    this.block_count=0;
	    this.lastid=false;
	    
	    var pagerule=this.pagerule=init.pagerule||false;
	    
	    function move2page(node,page){
		if (trace) {
		    if ((trace>3)||((track)&&(track.match(node))))
			logfn("Moving node %o to page %o",node,page);}
		return moveNodeToPage(node,page,dups,crumbs);}
	    function moveNode(node){
		if (trace) {
		    if ((trace>3)||((track)&&(track.match(node))))
			logfn("Moving node %o to page %o",node,page);}
		return moveNodeToPage(node,page,dups,crumbs);}

	    function parseScale(s){
		if (s.search(/%$/g)>0) {
		    var pct=parseFloat(s.slice(0,s.length-1));
		    return pct/100;}
		else return parseFloat(s);}

	    function scaleToPage(elt){
		if (typeof elt === "string") elt=fdjtID(elt);
		if ((!(elt))||(elt.length===0)) return;
		else if (elt.nodeType) {
		    if (elt.nodeType!==1) return;
		    if (hasClass(elt,"codexpagescaled")) return;
		    var ps=elt.getAttribute("data-pagescale")||
			elt.getAttribute("data-pagescale")||
			getElementValue(elt,"xdatapagescale");
		    var style=getStyle(elt);
		    if (!(ps)) return;
		    if (elt.style[fdjtDOM.transform]) return;
		    var psv=ps.split(/ |,|x/g);
		    var psw=1, psh=1;
		    if (psv.length===2) {
			psw=parseScale(psv[0]);
			psh=parseScale(psv[1]);}
		    else psw=parseScale(psv[0]);
		    var pw=page_width*psw, ph=page_height*psh;
		    var w=elt.offsetWidth, h=elt.offsetHeight;
		    var sw=pw/w, sh=ph/h;
		    var scale=((sw<sh)?(sw):(sh));
		    if (elt.tagName==="IMG") {
			var nw=w*scale, nh=h*scale;
			elt.style.width=nw+"px";
			elt.style.height=nh+"px";}
		    else {
			var scalestring="scale("+scale+","+scale+")";
			var current=(style.transform)||style[fdjtDOM.transform];
			if ((!current)||(current==="none")||(current.length===0)) {
			    elt.style.transformOrigin="center top";
			    elt.style[fdjtDOM.transformOrigin]="center top";
			    elt.style.transform=scalestring;
			    elt.style[fdjtDOM.transform]=scalestring;}}
		    addClass(elt,"codexpagescaled");}
		else if (elt.length) {
		    var i=0, lim=elt.length;
		    while (i<lim) scaleToPage(elt[i++]);}
		else {}}


	    //  addContent calls loop() exactly once to set up the
	    //   actual loop to be timesliced with repeated calls
	    //   setTimeout and a final call to doneFn.  The real
	    //   inner function is step(), which relies on state
	    //   stored in its closure.
	    
	    function addContent(root,timeslice,timeskip,
				trace,progressfn,donefn) {

		var newpage=false;
		var start=fdjtTime();
		if (!(page)) {newPage(); newpage=true;}

		if (typeof trace === 'undefined') trace=layout.tracelevel;
		if (typeof progressfn === 'undefined')
		    progressfn=layout.progressfn||false;
		if (!(layout.started)) layout.started=start;
		// If it's already been added to a page, don't do it again.
		if (getParent(root,".codexpage")) {
		    if (donefn) donefn(layout);
		    return false;}
		layout.root_count++;

		// If we can use layout properties of the root, we do
		// so immediately, and synchronously
		if ((hasClass(root,/\b(codexfullpage|codexsinglepage)\b/))||
		    ((fullpages)&&(testNode(root,fullpages)))||
		    ((singlepages)&&(testNode(root,singlepages)))) {
		    if (newpage) moveNode(root); else newPage(root);
		    // Scale any embedded items
		    if ((hasClass(root,/\bcodexpagescale\b/))||
			(testNode(root,scaletopage)))
			scaleToPage(root);
		    scaleToPage(fdjtDOM.getChildren(root,scaletopage));
		    scaleToPage(fdjtDOM.getChildren(root,/\bcodexpagescale\b/));
		    newPage();
		    prev=this.prev=root;
		    prevstyle=this.prevstyle=getStyle(root);
		    if (donefn) donefn(layout);
		    return;}
		else {
		    if ((forcedBreakBefore(root))||
			((prev)&&(forcedBreakAfter(prev)))) {
			root=newPage(root); newpage=true;}
		    else root=moveNode(root);
		    // Scale any embedded items
		    if (testNode(root,scaletopage)) scaleToPage(root);
		    scaleToPage(fdjtDOM.getChildren(root,scaletopage));
		    scaleToPage(fdjtDOM.getChildren(root,/\bcodexpagescale\b/));
		    var geom=getGeom(root,page);
		    if (geom.bottom<=page_height) {
			prev=this.prev=root;
			prevstyle=this.prevstyle=getStyle(root);
			if (donefn) donefn(layout);
			return;}
		    else if (((atomic)&&(atomic.match(root)))||
			     (avoidBreakInside(root))) {
			if (!(newpage)) newPage(root);
			prev=this.prev=root;
			prevstyle=this.prevstyle=getStyle(root);
			if (donefn) donefn(layout);
			return;}}

		var blocks=[], terminals=[], styles=[];
		// gather all of the block-level elements
		// (recursively) in the node, noting which ones are
		// terminals.  This should be pretty fast, so we do it
		// synchronously
		gatherBlocks(root,blocks,terminals,styles);
		layout.block_count=layout.block_count+blocks.length;
		if (trace>1)
		    logfn("Laying out %d blocks from %o; page=%o",
			  blocks.length,root,page);

		// If there aren't any blocks, we try adding the
		//  content to the current page and, if it goes over,
		//  create a new page for it and call the donefn.  At
		//  the top level, we only split blocks.
		if (blocks.length===0) {
		    if (!(newpage)) newPage(root);
		    layout.root=cur_root=false;
		    if (donefn) donefn(layout);
		    return;}
		
		layout.root=cur_root=root;

		var ni=0, nblocks=blocks.length; 
		    
		function step(){
		    var block=blocks[ni]; var style=styles[ni];
		    var terminal=terminals[ni]||false;
		    var tracing=false;
		    if (block.id) layout.lastid=block.id;

		    if ((trace)&&(block)&&
			((trace>3)||((track)&&(track.match(block))))) {
			logfn("Considering block %o (#%d from %o); page=%o",
			      block,ni,root,page);
			tracing=true;}
		    
		    // FIRST, HANDLE DRAGGING

		    // If this block is terminal and we don't want to
		    // break before this block or after the preceding
		    // block, drag along the previous block to the new
		    // page.

		    // NOTE that dragged blocks have already been
		    // placed, so the previous page will end up short.
		    // Them's the breaks.
		    if ((block)&&(terminal)&&(prev)&&
			((avoidBreakBefore(block,style))||
			 (avoidBreakAfter(prev,prevstyle)))) {
			if (tracing) logfn("Possibly dragging %o",prev);
			drag.push(prev);}
		    else if ((block)&&(terminal)&&(drag)&&(drag.length)) {
			// Otherwise, we don't have to worry about
			// what we've been dragging along so far,
			// so we clear it.
			if (tracing) logfn("Dropping %d drags",layout.drag.length);
			layout.drag=drag=[];}
		    else {}
		    
		    // If a block is false, continue
		    if (!(block)) {ni++; return;}
		    else if ((hasClass(block,/\bcodexfloatpage\b/))||
			     ((floatpages)&&(testNode(block,floatpages)))) {
			// Float pages just get pushed (until newPage below)
			if (tracing) logfn("Pushing float page %o",block);
			float_pages.push[block]; ni++; return;}
		    else if ((hasClass(block,/\b(codexfullpage|codexsinglepage)\b/))||
			     ((fullpages)&&(testNode(block,fullpages)))||
			     ((singlepages)&&(testNode(block,singlepages)))) {
			// Full pages automatically get their own page
			if (tracing) logfn("Full single page for %o",block);
			block=newPage(block); newPage();
			ni++; return;}
		    else if ((page.childNodes.length)&&
			     ((forcedBreakBefore(block,style))||
			      ((prev)&&(forcedBreakAfter(prev,prevstyle)))||
			      ((prev)&&
			       ((hasClass(prev,/\b(codexfullpage|codexsinglepage)\b/))||
				((fullpages)&&(testNode(prev,fullpages)))||
				((singlepages)&&(testNode(prev,singlepages))))))) {
			// This is the easy case.  Note that we don't
			// force a page break if the current page is
			// empty.
			if (tracing) logfn("Forced new page for %o",block);
			layout.drag=drag=[];
		    	block=newPage(block);}
		    else block=moveNode(block);

		    // Finally, we check if everything fits.  We're
		    // walking through the blocks[] but only advance
		    // when an element fits or can't be split or
		    // tweaked Note that we may process an element [i]
		    // more than once if we split the node and part of
		    // the split landed back in [i].
		    var geom=getGeom(block,page);
		    if ((trace)&&((trace>3)||((track)&&(track.match(block)))))
			logfn("Layout/geom %o %j",block,geom);
		    if ((terminal)&&(geom.bottom>page_height)) {
			// We're a terminal node and we extend
			// below the bottom of the page
			if (geom.top>page_height)
			    // If our top is also over the bottom of the page,
			    //  we just start a new page
			    block=newPage(block);
			else if (((!(break_blocks))||
				  ((atomic)&&(atomic.match(block)))||
				  (avoidBreakInside(block,style))||
				  (hasClass(block,"codexcantsplit")))) {
			    var curpage=page;
			    block=newPage(block);
			    if (page===curpage) {
				if (geom.bottom>page_height)
				    addClass(page,"codexoversize");
				ni++;}}
			else {
			    // Now we try to split the block, we store
			    // the 'split block' back in the blocks
			    // variable because we might need to split
			    // it again.
			    if (tracing) logfn("Splitting block %o",block);
			    blocks[ni]=splitBlock(block);}}
		    // We fit on the page, so we'll look at the next block.
		    else {
			if (tracing) logfn("Fits on page: %o",block);
			ni++;}
		    // Update the prev pointer for terminals
		    if (terminal) {
			layout.prev=prev=block;
			layout.prevstyle=prevstyle=style;}}

		// Gather all the block-level elements inside a node,
		// recording which ones are terminals (don't have any
		// blocks within them)
		function gatherBlocks(node,blocks,terminals,styles){
		    if (node.nodeType!==1) return;
		    if (node.codexui) return;
		    var style=getStyle(node); 
		    if ((atomic)&&(atomic.match(node))) {
			blocks.push(node); styles.push(node);
			terminals.push(node);
			return;}
		    var disp=style.display;
		    if ((style.position==='static')&&(disp!=='inline')) {
			var loc=blocks.length;
			blocks.push(node);
			styles.push(style);
			if (avoidBreakInside(node,style))
			    terminals[loc]=true;
			else if ((disp==='block')||(disp==='table')) {
			    var children=node.childNodes;
			    var total_blocks=blocks.length;
			    var i=0; var len=children.length;
			    while (i<len) {
				gatherBlocks(children[i++],
					     blocks,terminals,styles);}
			    if (blocks.length==total_blocks)
				terminals[loc]=true;}
			else terminals[loc]=true;}}

		// Whether we need to create a new page to have 'node'
		//  at the page top We don't need a new page if the
		//  current page has no content or no content up until
		//  the node in question
		function needNewPage(node){
		    if (!(page)) return true;
		    else if (!(node))
			return hasContent(page,true,true);
		    else if (!(hasParent(node,page)))
			return hasContent(page,true,true);
		    else if (page.firstChild===node)
			return false;
		    else if (hasContent(page,node,true))
			return true;
		    else return false;}

		// Create a new page
		// If node is passed, it is the first element on the new page
		function newPage(node,forcepage){
		    if ((float_pages)&&(float_pages.length)) {
			// First add any floating pages that may have
			// accumulated
			var i=0; var lim=float_pages.length;
			while (i<lim) newPage(float_pages[i++]);
			float_pages=[];
			forcepage=true;}
		    var newpage="pagetop";
		    if ((node)&&(node.nodeType===3)) {
			var parent=node.parentNode;
			if ((parent)&&(parent.childNodes.length===1)&&
			    (parent!==document.body)&&
			    (parent!==Codex.content)&&
			    (!(hasClass(parent,"codexpage"))))
			    node=parent;}
		    if ((!(node))||(forcepage)||(needNewPage(node))) {
			// If we really need to create a new page, do so,
			//  starting by dropping the curpage class from the
			//  current page
			if (page) dropClass(page,"curpage");
			layout.page=page=fdjtDOM("div.codexpage.curpage");
			if (!(pagerule)) {
			    page.style.height=page_height+'px';
			    page.style.width=page_width+'px';}
			pagenum++; layout.pagenum=pagenum;
			page.id=pageprefix+(pagenum);
			page.setAttribute("data-pagenum",pagenum);
			fdjtDOM(container,page);
			layout.prev=prev=false;
			pages.push(page);
			newpage="newpage";}
		    
		    if (trace) {
			if ((trace>2)||
			    ((track)&&(node)&&(track.match(node)))) {
			    if (node) logfn("Layout/%s %o at %o",
					    newpage,page,node);
			    else logfn("Layout/%s %o",newpage,page);}}
			
		    // If there are things we are dragging along, move
		    // them to the new page
		    if ((drag)&&(drag.length)) {
			var i=0; var lim=drag.length;
			while (i<lim) moveNode(drag[i++],crumbs);
			layout.prev=prev=drag[drag.length-1];
			layout.drag=drag=[];}
		    // Finally, move the node to the page
		    if (node) return moveNode(node);
		    else return false;}

		var getLineHeight=fdjtDOM.getLineHeight;

		// This gets a little complicated
		function splitBlock(node){
		    if ((!(break_blocks))||(avoidBreakInside(node))||
			(!(node.childNodes))||(node.childNodes.length===0)) {
			// Simplest case, if we can't split, we just
			// make a new page starting with the node.
			addClass(node,"codexcantsplit");
			newPage(node);
			return node;}
		    // Otherwise, we remove all of the node's children
		    // and then add back just enough to reach the
		    // edge, potentially splitting some children to
		    // make this work.
		    var init_geom=getGeom(node,page,true);
		    var line_height=init_geom.line_height||12;
		    if ((init_geom.top+init_geom.top_margin+(line_height*2))>page_height) {
			// If the top is too close to the bottom of the page, just push it over.
			return newPage(node);}
		    var children=TOA(node.childNodes);
		    var i=children.length-1;
		    while (i>=0) node.removeChild(children[i--]);
		    var geom=getGeom(node,page);
		    if (geom.bottom>page_height) {
			// If the version without any children is
			// already over the edge, just start a new
			// page on the node (after restoring all the
			// children to the node).
			i=0; var n=children.length;
			appendChildren(node,children);
			addClass(node,"codexcantsplit");
			newPage(node);
			return node;}
		    var push=splitChildren(node,children,init_geom,line_height);
		    if (!(push)) {
			/* Doesn't need to be split after all.
			   Not sure when this will happen, if ever. */
			fdjtLog("Tried to break %o which didn't need breaking",
				node);
			appendChildren(node,children);
			return node;}
		    else if (push===node) {
			appendChildren(node,children);
			addClass(node,"codexcantsplit");
			newPage(node);
			return node;}
		    else { 
			var page_break=push[0]; i=1; n=push.length;
			// Finally, we create a new page
			newPage(page_break);
			var dup=page_break.parentNode;
			// This (dup) is the copied parent of the page
			// break.  We append all the remaining children
			// to this duplicated parent on the new page.
			appendChildren(dup,push,1);
			if (trace>1)
			    logfn("Layout/splitBlock %o @ %o into %o on %o",
				  node,page_break,dup,page);
			return dup;}}

		function isTextyNode(node){
		    return ((node.childNodes)&&
			    (node.childNodes.length===1)&&
			    (node.childNodes[0].nodeType===3));}

		var removeChildren=fdjtDOM.removeChildren;

		function splitChildren(node,children,init_geom,line_height){
		    /* node is a node and children are its children,
		       which have been removed from it.  We return an
		       array of children which should go onto the next
		       page, possibly synthesizing a new child by
		       splitting some text.  */
		    var page_break=node; var use_page_height=page_height;
		    var geom=init_geom||getGeom(node,page);
		    if (!(line_height))
			line_height=getLineHeight(node)||12;
		    if ((geom.bottom-(line_height*2))<page_height)
			/* If the node is just a little bit over the
			   bottom, we tweak the page height to avoid
			   leaving single lines on the other side. */
			use_page_height=page_height-line_height;
		    // We add children back until we go over the edge
		    // and then figure out if there's a way to split
		    // the child that broke the page.
		    var i=0, n=children.length, childtype=false;
		    while (i<n) {
			var child=children[i++];
			childtype=child.nodeType;
			// Add the child back and get the geometry
			node.appendChild(child); geom=getGeom(node,page);
			if (geom.bottom>use_page_height) {
			    page_break=child; break;}
			else continue;}
		    if (page_break===node) // Never went over the edge
			return false;
		    // This child pushed the node over the edge
		    else if ((childtype!==3)&&(childtype!==1)) {
			// This is probably an error
			if (i===1) return node;
			else return children.slice(i-1);}
		    else if ((childtype===1)&&
			     (!((hasContent(node,child,true)))))
			// This indicates that the whole node should
			// be pushed
			return node;
		    else if ((childtype===1)&&
			     ((!(child.childNodes))||
			      ((child.childNodes.length===0))||
			      (!(isTextyNode(child))))) {
                        // We don't try to break nodes that don't have
                        // children or (for now) nodes that have non
                        // textual children.
			if (i===1) return node;
			else return children.slice(i-1);}
		    // If it's text, split it into words, then try to
		    // find the length at which one more word pushes
		    // it over the edge.
		    var probenode=page_break, text=false;
		    var original=page_break, outer=node;
		    if (childtype===1) {
			// This is the case where it's an inline
			//  element rather than a text object.  In
			//  this case, we do our probing on the
			//  element rather than the top level node
			//  that we're considering.
			probenode=original=page_break.firstChild;
			outer=page_break;
			text=probenode.nodeValue;}
		    else text=page_break.nodeValue;
		    // Now, break the text up at possible page breaks
		    var breaks=text.split(/\b/g), words=[], word=false;
		    var bi=0, blen=breaks.length;
		    while (bi<blen) {
			var s=breaks[bi++]; var ws;
			if ((ws=s.search(/\s/))>=0) { /* Includes whitespace */
			    if (ws===0) { /* Starts with whitespace */
				if (word) words.push(word);
				if (bi<blen) word=s+breaks[bi++];
				else word=s;}
			    else {
				if (word) words.push(word+s);
				else words.push(s);
				word=false;}}
			else if (word) word=word+s;
			else word=s;}
		    if (word) words.push(word);
		    // If there aren't many words, don't bother
		    //  splitting and just push the whole node onto
		    //  the next page
		    if (words.length<2) {
			if (i===1) return node;
			else return children.slice(i-1);}
		    // Now we do a binary search to find the word
		    //  which pushes the node below the page height.
		    //  That's where we'll break.
		    var w=0; var wlen=words.length;
		    var wbreak=floor(wlen/2);
		    var foundbreak=false;
		    var wtop=wlen; var wbot=0;
		    while ((wbreak>=wbot)&&(wbreak<wtop)) {
			var newprobe=document.createTextNode(
			    words.slice(0,wbreak).join(""));
			outer.replaceChild(newprobe,probenode);
			probenode=newprobe;
			geom=getGeom(node,page);
			if (geom.bottom>use_page_height) {
			    /* Already over, wrap back */
			    wtop=wbreak;
			    wbreak=wbot+floor((wbreak-wbot)/2);}
			else {
			    /* Add one more work to see if we break the page. */
			    var nextw=document.createTextNode(words[wbreak]);
			    outer.appendChild(nextw);
			    var ngeom=getGeom(node,page);
			    outer.removeChild(nextw);
			    if (ngeom.bottom>use_page_height) {
				foundbreak=true; break;}
			    else {
				wbot=wbreak+1;
				wbreak=wbreak+floor((wtop-wbreak)/2);}}}
		    if (wbreak+1===wtop) foundbreak=true;
		    // We're done searching for the word break
		    if ((wbreak===0)||(wbreak===wlen-1)) {
			// If the break is at the beginning or end
			// use the page_break as a whole
			if (childtype===1)
			    outer.replaceChild(original,probenode);
			else node.replaceChild(page_break,probenode);
			if (i===1) return node;
			else return children.slice(i-1);}
		    else { // Do the split
			var keeptext=words.slice(0,wbreak).join("");
			var pushtext=words.slice(wbreak).join("");
			var keepnode, pushnode, id=false;
			if ((page_break.nodeType===1)&&
			    (hasClass(page_break,"codextextsplit"))) {
			    keepnode=page_break;
			    pushnode=page_break.cloneNode(true);}
			else if (page_break.nodeType===1) {
			    if (!(id=page_break.id))
				page_break.id=id="CODEXTMPID"+(tmpid_count++);
			    keepnode=page_break;
			    pushnode=page_break.cloneNode(true);}
			else {
			    keepnode=fdjtDOM("span.codexsplitstart");
			    keepnode.id=id="CODEXTMPID"+(tmpid_count++);
			    pushnode=fdjtDOM("span.codextextsplit");}
			removeChildren(keepnode);
			removeChildren(pushnode);
			keepnode.appendChild(
			    document.createTextNode(keeptext));
			pushnode.appendChild(
			    document.createTextNode(pushtext));
			if (childtype===3)
			    node.replaceChild(keepnode,probenode);
			else node.replaceChild(keepnode,page_break);
			// Put the page break back in context for copying
			node.appendChild(pushnode);
			var move_children=children.slice(i-1);
			// Put the children back into context for copying
			appendChildren(node,children,i);
			move_children[0]=pushnode;
			if (id) textsplits[id]=original;
			return move_children;}}
	
		function loop(){
		    var loop_start=fdjtTime();
		    while ((ni<nblocks)&&
			   ((fdjtTime()-loop_start)<timeslice))
			step();
		    if (progressfn) progressfn(layout);
		    if (ni<nblocks) layout.timer=
			setTimeout(loop,timeskip||timeslice);
		    else {
			var last_block=blocks[nblocks-1];
			if ((forcedBreakAfter(last_block))||
			    (hasClass(last_block,/\bcodexfullpage\b/))||
			    ((fullpages)&&(testNode(last_block,fullpages))))
			    newPage();
			if (layout.timer) clearTimeout(layout.timer);
			layout.timer=false;
			layout.root=cur_root=false;
			if (donefn) setTimeout(function(){donefn(layout);},10);}}

		// This is the inner loop
		if (!(timeslice)) {
		    while (ni<nblocks) step();
		    if (donefn) donefn(layout);}
		else loop();
		
		return this;}
	    this.addContent=addContent;

	    /* Finishing the page */

	    function finishPage(completed) {
		var bounds=insideBounds(completed);
		var fullpage=hasClass(completed,"codexfullpage");
		if (!((page_width)&&(page_height))) {
		    var geom=getGeom(completed);
		    if (!(page_width)) page_width=geom.width;
		    if (!(page_height)) page_height=geom.height;}
		var oversize=((bounds.right>page_width)||(bounds.bottom>page_height));
		var undersize=((fullpage)&&((bounds.right<(page_width*0.95))&&
					    (bounds.bottom<(page_height*0.95))));
			       
		if (((oversize)||(undersize))&&(scale_pages)) {
		    var boxed=fdjtDOM("div.codexscalebox",completed.childNodes);
		    completed.appendChild(boxed);
		    var scalex=page_width/bounds.right;
		    var scaley=page_height/bounds.bottom;
		    var scale=((scalex<scaley)?(scalex):(scaley));
		    if ((scale<1)||(fullpage)) {
			var transform='scale('+scale+','+scale+')';
			this.scaledpages.push(boxed);
			boxed.style.transform=transform
			boxed.style[fdjtDOM.transform]=transform;
			boxed.style.transformOrigin='center top';
			boxed.style[fdjtDOM.transformOrigin]='center top';
			addClass(completed,"codexscaledpage");}
		    else if (oversize)
			addClass(completed,"codexoversizepage");
		    else {}}
		else if (oversize)
		    addClass(completed,"codexoversizepage");
		else {}
		if (this.pagedone) this.pagedone(completed);
		dropClass(completed,"curpage");}
	    this.finishPage=finishPage;

	    /* Finishing the overall layout */

	    function Finish(){
		for (var dupid in dups) {
		    var dup=dups[dupid];
		    dup.className=dup.className.replace(
			    /\bcodexdup\b/,"codexdupend");}
		dropClass(page,"curpage");
		var i=0; var lim= pages.length;
		while (i<lim) this.finishPage(pages[i++]);
		layout.done=fdjtTime();}
	    this.Finish=Finish;

	    /* page break predicates */
	    
	    function forcedBreakBefore(elt,style){
		if (!(elt)) return false;
		if (!(style)) style=getStyle(elt);
		return (style.pageBreakBefore==='always')||
		    ((elt.className)&&
		     (elt.className.search(
			     /\b(forcebreakbefore|alwaysbreakbefore)\b/)>=0))||
		    ((forcebreakbefore)&&(testNode(elt,forcebreakbefore)));}
	    this.forcedBreakBefore=forcedBreakBefore;
	    
	    var getLastElement=fdjtDOM.getLastElement;

	    function forcedBreakAfter(elt,style){ 
		if (!(elt)) return false;
		if (!(style)) style=getStyle(elt);
		var force=(style.pageBreakAfter==='always')||
		    ((elt.className)&&
		     (elt.className.search(
			     /\b(forcebreakafter|alwaysbreakafter)\b/)>=0))||
		    ((forcebreakafter)&&(testNode(elt,forcebreakafter)));
		if (force) return force;
		if (elt===cur_root) return false;
		if (!(cur_root)) return false;
		var parent=elt.parentNode;
		if ((!(parent))||(parent===document))
		    return false;
		var last=(parent.lastElementChild)||
		    ((parent.children[parent.children.length-1]));
		if (elt===last)
		    return forcedBreakAfter(parent);
		else return false;}
	    this.forcedBreakAfter=forcedBreakAfter;

	    // We explicitly check for these classes because some browsers
	    //  which should know better (we're looking at you, Firefox) don't
	    //  represent (or handle) page-break 'avoid' values.  Sigh.
	    var page_block_classes=/\b(avoidbreakinside)|(sbookpage)\b/;
	    function avoidBreakInside(elt,style){
		if (!(elt)) return false;
		if (elt.tagName==='IMG') return true;
		if (!(style)) style=getStyle(elt);
		return (style.pageBreakInside==='avoid')||
		    ((elt.className)&&
		     (elt.className.search(page_block_classes)>=0))||
		    ((avoidbreakinside)&&(testNode(elt,avoidbreakinside)));}
	    this.avoidBreakInside=avoidBreakInside;
	    
	    function avoidBreakBefore(elt,style){
		if (!(elt)) return false;
		if (!(style)) style=getStyle(elt);
		return ((style.pageBreakBefore==='avoid')||
			((elt.className)&&(elt.className.search(/\bavoidbreakbefore\b/)>=0))||
			((avoidbreakbefore)&&(testNode(elt,avoidbreakbefore))));}
	    this.avoidBreakBefore=avoidBreakBefore;

	    function avoidBreakAfter(elt,style){
		var avoid=false;
		if (!(elt)) return false;
		// Avoid breaks after headings
		if (/H\d/.exec(elt.tagName)) return true;
		if (!(style)) style=getStyle(elt);
		// Use the style information
		if (style.pageBreakAfter==='avoid') return true;
		else if ((style.pageBreakAfter)&&
			 (style.pageBreakAfter!=="auto"))
		    return false;
		else avoid=((avoidbreakafter)&&(testNode(elt,avoidbreakafter)));
		if (avoid) return avoid;
		if (elt===cur_root) return false;
		if (!(cur_root)) return false;
		var parent=elt.parentNode;
		if ((!(parent))||(parent===document))
		    return false;
		var last=(parent.lastElementChild)||
		    ((parent.children[parent.children.length-1]));
		if (elt===last)
		    return avoidBreakAfter(parent);
		else return false;}
	    this.avoidBreakAfter=avoidBreakAfter;
	    
	    function getPage(spec) {
		if (!(spec)) return false;
		else if (typeof spec === 'number')
		    return fdjtID(pageprefix+spec);
		else if (spec.nodeType) {
		    if (hasClass(spec,"codexpage")) return spec;
		    else return getParent(spec,".codexpage");}
		else if (typeof spec === "string")
		    return getPage(fdjtID(spec));
		else {
		    logfn("Can't determine page from %o",spec);
		    return false;}}
	    this.getPage=getPage;

	    function getDup(node,page){
		if (typeof node === 'string')
		    node=document.getElementById(node);
		if (!(node)) return false;
		if (hasParent(node,page)) return node;
		var nodeid=node.id;
		var duptable=Codex.paginated.dups;
		var dups=duptable[nodeid];
		var i=0; var lim=dups.length;
		while (i<lim) {
		    if (hasParent(dups[i]),page) return dups[i];
		    else i++;}
		return false;}
	    this.getDup=getDup;

	    function gotoPage(spec) {
		var newpage=false;
		if (!(spec)) return false;
		else if (typeof spec === 'number')
		    newpage=document.getElementById(pageprefix+spec);
		else if (spec.nodeType) {
		    if (hasClass(spec,"codexpage")) newpage=spec;
		    else newpage=getParent(spec,".codexpage");}
		else if (typeof spec === "string")
		    newpage=getPage(document.getElementById(spec));
		else {
		    logfn("Can't determine page from %o",spec);
		    return false;}
		if (!(newpage)) return;
		var oldpage=container.getChildrenByClassName('curpage');
		dropClass(oldpage,"curpage");
		addClass(newpage,"curpage");}
	    this.gotoPage=gotoPage;

	    this.Revert=function(){
		// Remove any scaleboxes (save the children)
		if (this.scaledpages) {
		    var scaled=this.scaledpages;
		    var i=0, lim=scaled.length;
		    while (i<lim) {
			var scalebox=scaled[i++];
			var children=fdjtDOM.toArray(scalebox.childNodes);
			var parent=scalebox.parentNode;
			fdjtDOM.remove(scalebox);
			fdjtDOM(parent,children);}}
		this.scaledpages=[];
		var pagetops=fdjtDOM.$(".codexpagetop");
		var i=0, lim=pagetops.length;
		while (i<lim) dropClass(pagetops[i++],"codexpagetop");
		revertLayout(this);}

	    /* Finally return the layout */
	    return this;};
	
	CodexLayout.tracelevel=0;
	CodexLayout.prototype.getDups=function getDups4ID(id){
	    if (!(id)) return [];
	    else if (id.nodeType) id=id.id;
	    var base=fdjtID(id);
	    var dups=this.dups[id];
	    if (dups) return [base].concat(dups);
	    else return base;}
	
	return CodexLayout;})();


/* Mini Manual */
/*
  var layout=new CodexLayout();
  layout.addContent(node);
  layout.Finish();
  layout.Revert();

  var layout=new CodexLayout({
  page_width: 500, page_height: 500, // Dimensions
  // Where to add new pages; by default this creates a
  //  new div#CODEXPAGES.codexpages at the bottom of the BODY
  container: document.getElementByID("MYPAGES"),
  // Prefix for page element IDs, e.g. page 42 would have id MYCODEXPAGE42
  pageprefix: "MYCODEXPAGE",
  logfn: console.log, // how to log notable events
  // Layout rules:
  // Always put H1 elements on a new page
  forcebreakbefore: "H1",
  // Always follow div.signature with a page break
  forcebreakafter: "div.signature",
  // Avoid breaking inside
  avoidbreakinside: "div.code",
  // Avoid breaking before these elements
  avoidbreakbefore: "div.signature,div.attribution",
  // Avoid breaking after these elements
  avoidbreakafter: "h1,h2,h3,h4,h5,h6,h7",
  // Put this element on a page by itself
  codexfullpage: "div.titlepage",
  // Put this element on a page by itself, but don't interrupt the
  // narrative flow
  codexfloatpage: "div.illustration"});
*/

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  End: ***
*/
