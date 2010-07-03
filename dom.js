/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2010 beingmeta, inc.
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

var fdjtDOM=
    (function(){
	var usenative=true;

	function fdjtDOM(spec){
	    var node;
	    if (spec.nodeType) node=spec;
	    else if (typeof spec==='string')
		if (spec[0]==='<') {
		    var container=document.createElement("DIV");
		    container.innerHTML=spec;
		    var children=container.childNodes;
		    var i=0; var len=children.length;
		    while (i<len)
			if (children[i].nodeType===1) return children[i];
		    else i++;
		    return false;}
	    else {
		var elts=spec.match(css_selector_regex);
		var classname=false;
		node=document.createElement(elts[0]);
		var i=1; var len=elts.length;
		while (i<len) {
		    var sel=elts[i++];
		    if (sel[0]==='#') node.id=sel.slice(1);
		    else if (sel[0]==='.')
			if (classname) classname=classname+" "+sel.slice(1);
		    else classname=sel.slice(1);
		    else if (sel[0]==='[') {
			var eqpos=sel.indexOf('=');
			if (eqpos<0)
			    node.setAttribute
			(sel.slice(1,sel.length-1),
			 sel.slice(1,sel.length-1));
			else node.setAttribute
			(sel.slice(1,eqpos),
			 sel.slice(eqpos+1,sel.length-1));}
		    else {}}
		if (classname) node.className=classname;}
	    else {
		node=document.createElement(spec.tagName||"span");
		for (attrib in spec) {
		    if (attrib==="tagName") continue;
		    else node.setAttribute(attrib,spec[attrib]);}}
	    domappend(node,arguments,1);
	    return node;}

	fdjtDOM.revid="$Id$";
	fdjtDOM.version=parseInt("$Revision$".slice(10,-1));
	fdjtDOM.useNative=function(flag) {
	    if (typeof flag === 'undefined') return usenative;
	    else usenative=flag;};
	
	function domappend(node,content,i) {
	    if (content.nodeType)
		node.appendChild(content);
	    else if (typeof content === 'string')
		node.appendChild(document.createTextNode(content));
	    else if (content.toDOM)
		domappend(node,content.toDOM());
	    else if (content.toHTML)
		domappend(node,content.toHTML());
	    else if (content.length) {
		if (typeof i === 'undefined') i=0;
		var len=content.length;
		while (i<len) {
		    var elt=content[i++];
		    if (!(elt)) {}
		    else if (typeof elt === 'string')
			node.appendChild(document.createTextNode(elt));
		    else if (elt.nodeType)
			node.appendChild(elt);
		    else if (elt.length)
			domappend(node,elt,0);
		    else if (elt.toDOM)
			domappend(node,elt.toDOM());
		    else if (elt.toHTML)
			domappend(node,elt.toHTML());
		    else if (elt.toString)
			node.appendChild(document.createTextNode(elt.toString()));
		    else node.appendChild(document.createTextNode(""+elt));}}
	    else node.appendChild(document.createTextNode(""+content));}
	function dominsert(before,content,i) {
	    var node=before.parentNode;
	    if (content.nodeType)
		node.insertBefore(content,before);
	    else if (typeof content === 'string')
		node.insertBefore(content,before);
	    else if (content.toDOM)
		dominsert(before,content.toDOM());
	    else if (content.toHTML)
		dominsert(before,content.toHTML());
	    else if (content.length) {
		if (typeof i === 'undefined') i=0;
		var j=content.length-1;
		while (j>=i) {
		    var elt=content[j--];
		    if (!(elt)) {}
		    else if (typeof elt === 'string')
			node.insertBefore(document.createTextNode(elt),before);
		    else if (elt.nodeType)
			node.insertBefore(elt,before);
		    else if (elt.length)
			dominsert(before,elt,0);
		    else if (elt.toDOM)
			dominsert(before,elt.toDOM());
		    else if (elt.toHTML)
			dominsert(before,elt.toHTML());
		    else if (elt.toString)
			node.insertBefore(document.createTextNode(elt.toString()),before);
		    else node.insertBefore(document.createTextNode(""+elt),before);}}
	    else node.insertBefore(document.createTextNode(""+elt),before);}

	function toArray(arg) {
	    var result=new Array(arg.length);
	    var i=0; var lim=arg.length;
	    while (i<lim) {result[i]=arg[i]; i++;}
	    return result;}
	fdjtDOM.toArray=toArray;
	function extendArray(result,arg) {
	    var i=0; var lim=arg.length;
	    while (i<lim) {result.push(arg[i]); i++;}
	    return result;}
	function TOA(arg,start) {
	    if (arg instanceof Array) {
		if (start) return arg.slice(start);
		else return arg;}
	    start=start||0;
	    var i=0; var lim=arg.length-start;
	    var result=new Array(lim);
	    while (i<lim) {result[i]=arg[i+start]; i++;}
	    return result;}
	fdjtDOM.Array=TOA;

	/* Utility patterns and functions */

	function parsePX(arg){
	    if (arg===0) return 0;
	    else if (!(arg)) return false;
	    else if (typeof arg === 'number') return arg;
	    else if (typeof arg === 'string') {
		var len=arg.length;
		if ((len>2)&&(arg[len-1]==='x')&&(arg[len-2]==='p'))
		    return parseInt(arg.slice(0,-2));
		else return parseInt(arg);}
	    else return false;}

	var css_selector_regex=/((^|[.#])\w+)|(\[\w+=\w+\])/g;

	var whitespace_pat=/(\s)+/;
	var trimspace_pat=/^(\s)+|(\s)+$/;
	var classpats={};
	function classPat(name){
	    var rx=new RegExp("\\b"+name+"\\b","g");
	    classpats[name]=rx;
	    return rx;};

	function string_trim(string){
	    var start=string.search(/\S/); var end=string.search(/\s+$/g);
	    if ((start===0) && (end<0)) return string;
	    else return string.slice(start,end);}

	/* Simple class/attrib manipulation functions */

	function hasClass(elt,classname,attrib){
	    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") : (elt.className));
	    if (!(classinfo)) return false;
	    else if (classname===true) return true;
	    else if (classinfo===classname) return true;
	    else if (typeof classname === 'string')
		if (classinfo.indexOf(' ')<0) return false;
	    else classname=classpats[classname]||classPat(classname);
	    else {}
	    if (classinfo.search(classname)>=0) return true;
	    else return false;}
	fdjtDOM.hasClass=hasClass;

	function addClass(elt,classname,attrib){
	    if (typeof elt === 'string') elt=document.getElementById(elt);
	    else if (elt instanceof Array) { // (elt instanceof NodeList)
		var elts=((elt instanceof Array)?(elt):(toArray(elt)));
		var i=0; var lim=elts.length;
		while (i<lim) addClass(elts[i++],classname,attrib||false);
		return;}
	    else if ((NodeList)&&(elt instanceof NodeList))
		return addClass(TOA(elt),classname,attrib);
	    var classinfo=
		(((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
	    if (!(classinfo)) {
		elt.className=classname; return true;}
	    var class_regex=classpats[classname]||classPat(classname);
	    var newinfo=classinfo;
	    if (classinfo===classname) return false;
	    else if (classinfo.search(class_regex)>=0) return false;
	    else newinfo=classname+" "+classinfo;
	    if (attrib) {
		elt.setAttribute(attrib,newinfo);
		// This sometimes trigger a CSS update that doesn't happen otherwise
		elt.className=elt.className;}
	    else elt.className=newinfo;
	    return true;}
	fdjtDOM.addClass=addClass;

	fdjtDOM.classAdder=function(elt,classname){
	    return function() {
		if (elt) addClass(elt,classname);}};

	function dropClass(elt,classname,attrib){
	    if (typeof elt === 'string') elt=document.getElementById(elt);
 	    else if (elt instanceof Array) {
		var elts=((elt instanceof Array)?(elt):(toArray(elt)));
		var i=0; var lim=elts.length;
		while (i<lim) dropClass(elts[i++],classname,attrib||false);
		return;}
	    else if ((NodeList)&&(elt instanceof NodeList))
		return dropClass(TOA(elt),classname,attrib);
	    var classinfo=
		(((attrib) ? (elt.getAttribute(attrib)||"") :(elt.className))||null);
	    if (!(classinfo)) return false;
	    var class_regex=
		((typeof classname === 'string')?
		 (classpats[classname]||classPat(classname)):
		 classname);
	    var newinfo=classinfo;
	    if (classinfo===classname) 
		newinfo=null;
	    else if (classinfo.search(class_regex)>=0) 
		newinfo=classinfo.replace(class_regex,"");
	    else return false;
	    if (newinfo)
		newinfo=newinfo.
		replace(whitespace_pat," ").
		replace(trimspace_pat,"");
	    if (attrib)
		if (newinfo) {
		    elt.setAttribute(attrib,newinfo);
		    elt.className=elt.className;}
	    else if (!(keep)) {
		elt.removeAttribute(attrib);
		elt.className=elt.className;}
	    else {}
	    else elt.className=newinfo;
	    return true;}
	fdjtDOM.dropClass=dropClass;

	fdjtDOM.classDropper=function(elt,classname){
	    return function() {
		if (elt) dropClass(elt,classname);}};

	function swapClass(elt,drop,add,attrib) {
	    dropClass(elt,drop,attrib); addClass(elt,add,attrib);}
	fdjtDOM.swapClass=swapClass;

	function toggleClass(elt,classname,attrib){
	    if (typeof elt === 'string') elt=document.getElementById(elt);
 	    else if (elt instanceof Array) { // (elt instanceof NodeList)
		var elts=((elt instanceof Array)?(elt):(toArray(elt)));
		var i=0; var lim=elts.length;
		while (i<lim) toggleClass(elts[i++],classname,attrib||false);
		return;}
	    else if ((NodeList)&&(elt instanceof NodeList))
		return toggleClass(TOA(elt),classname,attrib);
	    var classinfo=
		(((attrib) ? (elt.getAttribute(attrib)||"") :
		  (elt.className))||null);
	    if (!(classinfo)) {
		if (attrib) elt.setAttribute(attrib,classname);
		else elt.className=classname;
		return true;}
	    var class_regex=
		((typeof classname === 'string')?
		 (classpats[classname]||classPat(classname)):
		 classname);
	    var newinfo=classinfo;
	    if (classinfo===classname) 
		newinfo=null;
	    else if (classinfo.search(class_regex)>=0) 
		newinfo=classinfo.replace(class_regex,"");
	    else {
		if (attrib)
		    elt.setAttribute(attrib,classinfo+' '+classname);
		else elt.className=classinfo+' '+classname;
		return true;}
	    if (newinfo)
		newinfo=newinfo.
		replace(whitespace_pat," ").
		replace(trimspace_pat,"");
	    if (attrib)
		if (newinfo) {
		    elt.setAttribute(attrib,newinfo);
		    elt.className=elt.className;}
	    else if (!(keep)) {
		elt.removeAttribute(attrib);
		elt.className=elt.className;}
	    else {}
	    else elt.className=newinfo;
	    return false;}
	fdjtDOM.toggleClass=toggleClass;
	
	fdjtDOM.isClickable=function(target){
	    while (target) {
		if (((target.tagName==='A')&&(target.href))||
		    (target.tagName==="INPUT") ||
		    (target.tagName==="TEXTAREA") ||
		    (target.tagName==="SELECT") ||
		    (target.tagName==="OPTION") ||
		    (hasClass(target,"fdjtclickable")))
		    return true;
		else if (target.onclick) return true;
		else target=target.parentNode;}
	    return false;};

	fdjtDOM.isTextInput=function(target){
	    return ((target.tagName==='INPUT')||(target.tagName==='TEXTAREA'));};

	/* Simple CSS selectors */

	var selectors={};

	function Selector(spec,tagcs) {
	    if (!(spec)) return this; // just cons with type
	    else if (selectors[spec]) return selectors[spec]; // check cache
	    else if (!(this instanceof Selector))
		// handle case of the forgotten 'new'
		return Selector.call(new Selector(),spec);
	    if (spec.indexOf(',')>0) { // compound selectors
		var specs=spec.split(','); var compound=[];
		var i=0; var lim=specs.length;
		while (i<lim) {
		    var sub=string_trim(specs[i++]);
		    compound.push(new Selector(sub));}
		this.compound=compound;
		selectors[spec]=this;
		return this;}
	    // Otherwise, parse and set up this
	    var elts=spec.match(css_selector_regex);
	    var i=0; var lim=elts.length;
	    var classes=[]; var classnames=[]; var attribs=false;
	    if (!((elts[0][0]==='.')||(elts[0][0]==='#')||(elts[0][0]==='['))) {
		this.tag=((tagcs)?(elts[0]):(elts[0].toUpperCase()));
		i=1;}
	    while (i<lim)
		if (elts[i][0]==='#') this.id=elts[i++].slice(1);
	    else if (elts[i][0]==='.') {
		classnames.push(elts[i].slice(1));
		classes.push(classPat(elts[i++].slice(1)));}
	    else if (elts[i][0]==='[') {
		var aelts=elts[i++]; var eltsend=aelts.length-1;
		if (!(attribs)) attribs={};
		var eqpos=aelts.indexOf('=');
		if (eqpos<0)
		    attribs[aelts.slice(1,eltsend)]=true;
		else if (aelts[eqpos+1]==='~') 
		    attribs[aelts.slice(1,eqpos)]=
		    classPat(aelts.slice(eqpos+2,eltsend));
		else attribs[aelts.slice(1,eqpos)]=aelts.slice(eqpos+1,eltsend);}
	    else fdjtLog.uhoh("weird elts %o",elts[i++]);
	    if (classes.length) {
		this.classes=classes; this.classnames=classnames;}
	    if (attribs) this.attribs=attribs;
	    selectors[spec]=this;
	    return this;}
	Selector.prototype.match=function(elt){
	    if (this.compound) {
		var compound=this.compound; var i=0; var lim=compound.length;
		while (i<lim) if (compound[i++].match(elt)) return true;
		return false;} 
	    if ((this.tag)&&(this.tag!==elt.tagName)) return false;
	    else if ((this.id)&&(this.id!==elt.id)) return false;
	    if (this.classes)
		if (elt.className) {
		    var classname=elt.className; var classes=this.classes;
		    var i=0; var lim=classes.length;
		    while (i<lim) if (classname.search(classes[i++])<0) return false;}
	    else return false;
	    if (this.attribs) {
		var attribs=this.attribs;
		for (var name in attribs) {
		    var val=elt.getAttribute(name);
		    if (!(val)) return false;
		    var need=this[name];
		    if (need===true) {}
		    else if (typeof need === 'string') {
			if (need!==val) return false;}
		    else if (val.search(need)<0) return false;}}
	    return true;};
	Selector.prototype.find=function(elt,results){
	    var pickfirst=false;
	    if (!(results)) results=[];
	    if (this.compound) {
		var compound=this.compound; var i=0; var lim=compound.length;
		while (i<lim) compound[i++].find(elt,results);
		return results;}
	    if (this.id) {
		var elt=document.getElementById(this.id);
		if (!(elt)) return results;
		else if (this.match(elt)) {
		    results.push(elt); return results;}
		else return results;}
	    var candidates=[];
	    var classnames=this.classnames; var attribs=this.attribs;
	    if (this.classes) 
		if (elt.getElementsByClassName)
		    candidates=elt.getElementsByClassName(classnames[0]);
	    else gatherByClass(elt,this.classes[0],candidates);
	    else if ((this.tag)&&(elt.getElementsByTagName))
		candidates=elt.getElementsByTagName(this.tag);
	    else if (this.attribs) {
		var attribs=this.attribs;
		for (var name in attribs) {
		    gatherByAttrib(elt,name,attribs[name],candidates);
		    break;}}
	    else if (this.tag) {
		gatherByTag(elt,this.tag,candidates);}
	    else {}
	    if (candidates.length===0) return candidates;
	    if (((this.tag)&&(!(this.classes))&&(!(this.attribs)))||
		((!(this.tag))&&(this.classes)&&(this.classes.length===1)&&
		 (!(this.attribs))))
		// When there's only one test, don't bother filtering
		if (results.length) return extendArray(results,candidates);
	    else if (candidates instanceof Array)
		return candidates;
	    else return toArray(candidates);
	    var i=0; var lim=candidates.length;
	    while (i<lim) {
		var candidate=candidates[i++];
		if (this.match(candidate)) results.push(candidate);}
	    return results;};
	fdjtDOM.Selector=Selector;

	function gatherByClass(node,pat,results){
	    if (node.nodeType===1) {
		if ((node.className)&&(node.className.search(pat)>=0))
		    results.push(node);
		var children=node.childNodes;
		if (children) {
		    var i=0; var lim=children.length; var result;
		    while (i<lim) gatherByClass(children[i++],pat,results);}}}
	function gatherByTag(node,tag,results){
	    if (node.nodeType===1) {
		if (node.tagName===tag) results.push(node);
		var children=node.childNodes;
		if (children) {
		    var i=0; var lim=children.length; var result;
		    while (i<lim) gatherByTag(children[i++],tag,results);}}}
	function gatherByAttrib(node,attrib,val,results){
	    if (node.nodeType===1) {
		if ((node.getAttribute(attrib))&&
		    ((typeof val === 'string')?
		     (node.getAttribute(attrib)===val):
		     (node.getAttribute(attrib).search(val)>=0)))
		    results.push(node);
		var children=node.childNodes;
		if (children) {
		    var i=0; var lim=children.length; var result;
		    while (i<lim) gatherByTag(children[i++],tag,results);}}}
	
	function gather_children(node,pat,attrib,results){
	    if (!(attrib)) gatherByClass(node,pat,results);
	    else if (attrib==='class') gatherByClass(node,pat,results);
	    else if (attrib==='tagName') gatherByTag(node,pat,results);
	    else gatherByAttrib(node,attrib,pat,results);}

	/* Real simple DOM search */

	function getParent(elt,parent,attrib){
	    if (!(parent)) return false;
	    else if (parent.nodeType) {
		while (elt) {
		    if (elt===parent) return parent;
		    else elt=elt.parentNode;}
		return false;}
	    else if (typeof parent === 'function') {
		while (elt) {
		    if (parent(elt)) return elt;
		    else elt=elt.parentNode;}
		return false;}
	    else if (parent instanceof Selector) {
		while (elt) {
		    if (parent.match(elt)) return elt;
		    else elt=elt.parentNode;}
		return false;}
	    else if (typeof parent === 'string')
		return getParent(elt,new Selector(parent));
	    else throw { error: 'invalid parent spec'};}
	fdjtDOM.getParent=getParent;
	fdjtDOM.hasParent=getParent;
	fdjtDOM.inherits=function(node,spec) {
	    var sel=new Selector(spec);
	    return ((sel.match(node))?(node):(getParent(node,sel)));};

	function getChildren(node,classname,attrib,results){
	    if (!(results)) results=[]; 
	    if ((!(attrib))&&(typeof classname === 'function'))
		filter_children(node,classname,results);
	    else if (!(attrib))
		if (classname instanceof Selector)
		    return classname.find(node,results);
	    else if (typeof classname === 'string')
		if ((usenative) && (node.querySelectorAll))
		    return node.querySelectorAll(classname);
	    else return getChildren(node,new Selector(classname),false,results);
	    else throw { error: 'bad selector arg', selector: classname};
	    else {
		var pat=(classpats[parent]||classPat(parent));
		gather_children(node,classname,attrib||false,results);}
	    return results;}
	fdjtDOM.getChildren=getChildren;
	fdjtDOM.$=function(spec,root){return getChildren(root||document,spec);};
	fdjtDOM.getFirstChild=function(elt,spec){
	    var children=getChildren(elt,spec);
	    if (children.length) return children[0]; else return false;};
	fdjtDOM.getChild=fdjtDOM.getFirstChild;

	function filter_children(node,filter,results){
	    if (node.nodeType===1) {
		if (filter(node)) results.push(node);
		var children=node.childNodes;
		if (children) {
		    var i=0; var lim=children.length; var result;
		    while (i<lim) filter_children(children[i++],filter,results);}}}

	/* Manipulating the DOM */

	fdjtDOM.replace=function(existing,replacement){
	    var cur=existing;
	    if (typeof existing === 'string')
		if (existing[0]==='#')
		    cur=document.getElementById(existing.slice(1));
	    else cur=document.getElementById(existing);
	    if (cur) {
		cur.parentNode.replaceChild(replacement,cur);
		if ((cur.id)&&(!(replacement.id))) replacement.id=cur.id;}
	    else fdjtLog.uhoh("Can't find %o to replace it with %o",
			      existing,replacement);};
	function remove_node(node){
	    if (node instanceof Array) {
		var i=0; var lim=node.length;
		while (i<lim) remove_node(node[i++]);
		return;}
	    var cur=node;
	    if (typeof node === 'string')
		if (node[0]==='#') cur=document.getElementById(node.slice(1));
	    else cur=document.getElementById(node);
	    if (cur) cur.parentNode.removeChild(cur);
	    else fdjtLog.uhoh("Can't find %o to remove it",node);}
	fdjtDOM.remove=remove_node;
	
	fdjtDOM.append=function (node) {
	    if (typeof node === 'string') node=document.getElementById(node);
	    domappend(node,arguments,1);};
	fdjtDOM.prepend=function (node) {
	    if (typeof node === 'string') node=document.getElementById(node);
	    if (node.firstChild)
		dominsert(node.firstChild,arguments,1);
	    else domappend(node,arguments,1);};

	fdjtDOM.insertBefore=function (before) {
	    if (typeof before === 'string') before=document.getElementById(before);
	    dominsert(before,arguments,1);};
	fdjtDOM.insertAfter=function (before) {
	    if (typeof before === 'string') before=document.getElementById(before);
	    if (before.nextSibling)
		dominsert(before.nextSibling,arguments,1);
	    else domappend(before.parentNode,arguments,1);};
	
	/* DOM construction shortcuts */

	function tag_spec(spec,tag){
	    if (!(spec)) return tag;
	    else if (typeof spec === 'string') {
		var wordstart=spec.search(/\w/g);
		var puncstart=spec.search(/\W/g);
		if (puncstart<0) return tag+"."+spec;
		else if (wordstart!==0) return tag+spec;
		return spec;}
	    else if (spec.tagName) return spec;
	    else {
		spec.tagName=tag;
		return spec;}}

	fdjtDOM.Input=function(spec,name,value,title){
	    if (spec.search(/\w/)!==0) spec='INPUT'+spec;
	    var node=fdjtDOM(spec);
	    node.name=name;
	    if (value) node.value=value;
	    if (title) node.title=title;
	    return node;};
	fdjtDOM.Anchor=function(href,spec){
	    spec=tag_spec(spec,"A");
	    var node=fdjtDOM(spec); node.href=href;
	    domappend(node,arguments,2);
	    return node;};
	fdjtDOM.Image=function(src,spec,alt,title){
	    spec=tag_spec(spec,"IMG");
	    var node=fdjtDOM(spec); node.src=src;
	    if (alt) node.alt=alt;
	    if (title) node.title=title;
	    domappend(node,arguments,4);
	    return node;};

	/* Getting style information generally */

	function getStyle(elt,prop){
	    var style=
		((window.getComputedStyle)&&(window.getComputedStyle(elt,null)))||
		(elt.currentStyle);
	    if (!(style)) return false;
	    else if (prop) return style[prop];
	    else return style;}
	fdjtDOM.getStyle=getStyle;

	/* Getting display style */

	var display_styles={
	    "DIV": "block","P": "block","BLOCKQUOTE":"block",
	    "H1": "block","H2": "block","H3": "block","H4": "block",
	    "H5": "block","H6": "block","H7": "block","H8": "block",
	    "UL": "block","LI": "list-item",
	    "DL": "block","DT": "list-item","DD": "list-item",
	    "SPAN": "inline","EM": "inline","STRONG": "inline",
	    "TT": "inline","DEFN": "inline","A": "inline",
	    "TD": "table-cell","TR": "table-row",
	    "TABLE": "table", "PRE": "preformatted"};

	function getDisplayStyle(elt){
	    return (((window.getComputedStyle)&&(window.getComputedStyle(elt,null))&&
		     (window.getComputedStyle(elt,null).display))||
		    (display_styles[elt.tagName])||
		    "inline");}
	fdjtDOM.getDisplay=getDisplayStyle;

	/* Generating text from the DOM */

	function flatten(string){return string.replace(/\s+/," ");};

	function textify(arg,flat,inside){
	    if (arg.text) return flatten(arg.text);
	    else if (arg.nodeType)
		if (arg.nodeType===3) return arg.nodeValue;
	    else if (arg.nodeType===1) {
		var children=arg.childNodes;
		var display_type=getDisplayStyle(arg);
		var string=""; var suffix="";
		// Figure out what suffix and prefix to use for this element
		// If inside is false, don't use anything.
		if (!(inside)) {}
		else if (!(display_type)) {}
		else if (display_type==="inline") {}
		else if (flat) suffix=" ";
		else if ((display_type==="block") ||
			 (display_type==="table") ||
			 (display_type==="preformatted")) {
		    string="\n"; suffix="\n";}
		else if (display_type==="table-row") suffix="\n";
		else if (display_type==="table-cell") string="\t";
		else {}
		var i=0; while (i<children.length) {
		    var child=children[i++];
		    if (!(child.nodeType)) continue;
		    if (child.nodeType===3)
			if (flat)
			    string=string+flatten(child.nodeValue);
		    else string=string+child.nodeValue;
		    else if (child.nodeType===1) {
			var stringval=textify(child,flat,true);
			if (stringval) string=string+stringval;}
		    else continue;}
		return string+suffix;}
	    else {}
	    else if (arg.toString)
		return arg.toString();
	    else return arg.toString();}
	fdjtDOM.textify=textify;

	/* Geometry functions */

	function getGeometry(elt,withstack,root){
	    if (typeof elt === 'string')
		elt=document.getElementById(elt);
	    var result={};
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var stack = ((withstack) ? (new Array(elt)) : false);
	    var width=elt.offsetWidth;
	    var height=elt.offsetHeight;

	    elt=elt.offsetParent;
	    while (elt) {
		if ((root)&&(elt===root)) break;
		if (withstack) withstack.push(elt);
		top += elt.offsetTop;
		left += elt.offsetLeft;
		elt=elt.offsetParent;}
	    
	    result.left=left; result.top=top;
	    result.width=width;
	    result.height=height;
	    
	    result.right=left+width; result.bottom=top+height;

	    if (withstack) result.stack=withstack;

	    return result;}
	fdjtDOM.getGeometry=getGeometry;

	function isVisible(elt,partial){
	    if (!(partial)) partial=false;
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var width = elt.offsetWidth;
	    var height = elt.offsetHeight;
	    var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
	    var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
	    var winxedge=winx+(document.documentElement.clientWidth);
	    var winyedge=winy+(document.documentElement.clientHeight);
	    
	    while(elt.offsetParent) {
		if (elt===window) break;
		elt = elt.offsetParent;
		top += elt.offsetTop;
		left += elt.offsetLeft;}

	    /*
	      fdjtTrace("fdjtIsVisible%s top=%o left=%o height=%o width=%o",
	      ((partial)?("(partial)"):""),
	      top,left,height,width);
	      fdjtTrace("fdjtIsVisible winx=%o winy=%o winxedge=%o winyedge=%o",
	      winx,winy,winxedge,winyedge);
	    */

	    if (partial)
		// There are three cases we check for:
		return (
		    // top of element in window
		    ((top > winy) && (top < winyedge) &&
		     (left > winx) && (left < winxedge)) ||
			// bottom of element in window
			((top+height > winy) && (top+height < winyedge) &&
			 (left+width > winx) && (left+width < winxedge)) ||
			// top above/left of window, bottom below/right of window
			(((top < winy) || (left < winx)) &&
			 ((top+height > winyedge) && (left+width > winxedge))));
	    else return ((top > winy) && (left > winx) &&
			 (top + height) <= (winyedge) &&
			 (left + width) <= (winxedge));}
	fdjtDOM.isVisible=isVisible;

	function isAtTop(elt,delta){
	    if (!(delta)) delta=50;
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var width = elt.offsetWidth;
	    var height = elt.offsetHeight;
	    var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
	    var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
	    var winxedge=winx+(document.documentElement.clientWidth);
	    var winyedge=winy+(document.documentElement.clientHeight);
	    
	    while(elt.offsetParent) {
		elt = elt.offsetParent;
		top += elt.offsetTop;
		left += elt.offsetLeft;}

	    return ((top>winx) && (top<winyedge) && (top<winx+delta));}
	fdjtDOM.isAtTop=isAtTop;

	function textwidth(node){
	    if (node.nodeType===3) return node.nodeValue.length;
	    else if ((node.nodeType===1)&&(node.childNodes)) {
		var children=node.childNodes;
		var i=0; var lim=children.length; var width=0;
		while (i<lim) {
		    var child=children[i++];
		    if (child.nodeType===3) width=width+child.nodeValue.length;
		    else if (child.nodeType===1)
			width=width+textwidth(child);
		    else {}}
		return width;}
	    else return 0;}
	fdjtDOM.textWidth=textwidth;

	function hasContent(node,recur){
	    if (node.childNodes) {
		var children=node.childNodes;
		var i=0; while (i<children.length) {
		    var child=children[i++];
		    if (child.nodeType===3)
			if (child.nodeValue.search(/\w/g)>=0) return true;
		    else {}
		    else if ((recur) && (child.nodeType===1))
			if (hasContent(child)) return true;
		    else {}}
		return false;}
	    else return false;}
	fdjtDOM.hasContent=hasContent;

	function hasText(node){
	    if (node.childNodes) {
		var children=node.childNodes;
		var i=0; while (i<children.length) {
		    var child=children[i++];
		    if (child.nodeType===3)
			if (child.nodeValue.search(/\w/g)>=0) return true;
		    else {}}
		return false;}
	    else return false;}
	fdjtDOM.hasText=hasText;

	/* Sizing to fit */

	function getFit(elt){
	    var style=getStyle(elt);
	    var geom=getGeometry(elt);
	    var maxheight=parsePX(style.maxHeight);
	    if (maxheight)
		return geom.height/maxheight;
	    else return 1.0;}
	fdjtDOM.getFit=getFit;
	/* Use Newton's method to get this right */
	function sizeToFit(elt){
	    var style=getStyle(elt);
	    var geom=getGeometry(elt);
	    var maxheight=parsePX(style.maxHeight);
	    var fontsize=((maxheight)&&(100*(maxheight/geom.height)));
	    //fdjtLog("sizeToFit maxh=%o maxheight=%o gh=%o fs=%o",
	    // style.maxHeight,maxheight,geom.height,fontsize);
	    if (fontsize) elt.style.fontSize=fontsize+"%";
	    else elt.style.fontSize="";}
	fdjtDOM.sizeToFit=sizeToFit;
	
	

	/* Getting various kinds of metadata */

	function getHTML(){
	    var children=document.childNodes;
	    var i=0; var lim=children.length;
	    while (i<lim)
		if (children[i].tagName==='HTML') return children[i];
	    else i++;
	    return false;}
	fdjtDOM.getHTML=getHTML;

	function getHEAD(){
	    var children=document.childNodes;
	    var i=0; var lim=children.length;
	    while (i<lim)
		if (children[i].tagName==='HTML') {
		    var grandchildren=children[i].childNodes;
		    i=0; lim=grandchildren.length;
		    while (i<lim)
			if (grandchildren[i].tagName==='HEAD')
			    return grandchildren[i];
		    else i++;
		    return false;}
	    else i++;
	    return false;}
	fdjtDOM.getHEAD=getHEAD;

	fdjtDOM.getMeta=function(name,multiple,matchcase){
	    var results=[];
	    var matchname=((matchcase)&&(name.toUpperCase()));
	    var elts=((document.getElementsByTagName)?
		      (document.getElementsByTagName("META")):
		      (getChildren(document,"META")));
	    var i=0; while (i<elts.length)
		if (elts[i])
		    if (elts[i].name===name)
			if (multiple) results.push(elts[i++].content);
	    else return elts[i].content;
	    else if ((matchname)&&
		     (elts[i].name.toUpperCase()===matchname))
		if (multiple) results.push(elts[i++].content);
	    else return elts[i].content;
	    else i++;
	    if (multiple) return results;
	    else return false;};

	// This gets a LINK href field
	fdjtDOM.getLink=function(name,multiple,matchcase){
	    var results=[];
	    var matchname=((matchcase)&&(name.toUpperCase()));
	    var elts=((document.getElementsByTagName)?
		      (document.getElementsByTagName("LINK")):
		      (getChildren(document,"LINK")));
	    var i=0; while (i<elts.length)
		if (elts[i])
		    if (elts[i].rel===name)
			if (multiple) results.push(elts[i++].href);
	    else return elts[i].href;
	    else if ((matchname)&&
		     (elts[i].rel.toUpperCase()===matchname))
		if (multiple) results.push(elts[i++].href);
	    else return elts[i].href;
	    else i++;
	    if (multiple) return results;
	    else return false;};

	/* Going forward */

	var havechildren=((document)&&
			  (document.body)&&
			  (document.body.childNodes)&&
			  (document.body.children));

	// NEXT goes to the next sibling or the parent's next sibling
	function next_node(node){
	    while (node) {
		if (node.nextSibling)
		    return node.nextSibling;
		else node=node.parentNode;}
	    return false;}
	function next_element(node){
	    if (node.nextElementSibling)
		return node.nextElementSibling;
	    else {
		var scan=node;
		while (scan=scan.nextSibling) {
		    if (!(scan)) return null;
		    else if (scan.nodeType===1) break;
		    else {}}
		return scan;}}
	function scan_next(node,test,justelts){
	    if (!(test))
		if (justelts) {
		    if (havechildren) return node.nextElementSibling;
		    else return next_element(node);}
	    else return next_node(node);
	    var scan=((justelts)?
		      ((havechildren)?
		       (node.nextElementSibling):(next_element(node))):
		      ((node.nextSibling)||(next_node(node))));
	    while (scan)
		if (test(scan)) return scan;
	    else if (justelts)
		scan=((scan.nextElementSibling)||(next_element(scan)));
	    else scan=((scan.nextSibling)||(next_node(scan)));
	    return false;}

	// FORWARD goes to the first deepest child
	function forward_node(node){
	    if ((node.childNodes)&&((node.childNodes.length)>0))
		return node.childNodes[0];
	    else while (node) {
		if (node.nextSibling)
		    return node.nextSibling;
		else node=node.parentNode;}
	    return false;}
	function forward_element(node,n){
	    var scan;
	    if (n) {
		var i=0; scan=node;
		while (i<n) {scan=forward_element(scan); i++;}
		return scan;}
	    if (havechildren) {
		if ((node.children)&&(node.children.length>0)) {
		    return node.children[0];}
		if (scan=node.nextElementSibling) return scan;
		while (node=node.parentNode)
		    if (scan=node.nextElementSibling) return scan;
		return false;}
	    else {
		if (node.childNodes) {
		    var children=node.childNodes; var i=0; var lim=children.length;
		    while (i<lim)
			if ((scan=children[i++])&&(scan.nodeType===1)) return scan;}
		while (scan=node.nextSibling) if (scan.nodeType===1) return scan;
		while (node=node.parentNode)
		    if (scan=next_element(node)) return scan;
		return false;}}
	function scan_forward(node,test,justelts){
	    if (!(test)) {
		if (justelts) return forward_element(node);
		else return forward_node(node);}
	    var scan=((justelts)?(forward_element(node)):(forward_node(node)));
	    while (scan) {
		if (test(scan)) return scan;
		else if (justelts) scan=next_element(scan);
		else scan=next_node(scan);}
	    return false;}

	fdjtDOM.nextElt=next_element;
	fdjtDOM.forwardElt=forward_element;
	fdjtDOM.forward=scan_forward;
	fdjtDOM.next=scan_next;

	/* Scanning backwards */

	// PREV goes the parent if there's no previous sibling
	function prev_node(node){
	    while (node) {
		if (node.previousSibling)
		    return node.previousSibling;
		else node=node.parentNode;}
	    return false;}
	function previous_element(node){
	    if (havechildren)
		return node.previousElementSibling;
	    else {
		var scan=node;
		while (scan=scan.previousSibling) 
		    if (!(scan)) return null;
		else if (scan.nodeType===1) break;
		else {}
		if (scan) return scan;
		else return scan.parentNode;}}
	function scan_previous(node,test,justelts){
	    if (!(test))
		if (justelts) {
		    if (havechildren) return node.previousElementSibling;
		    else return previous_element(node);}
	    else return previous_node(node);
	    var scan=((justelts)?
		      ((havechildren)?(node.previousElementSibling):
		       (previous_element(node))):
		      (previous_node(node)));
	    while (scan)
		if (test(scan)) return scan;
	    else if (justelts)
		scan=((havechildren)?(scan.previousElementSibling):(previous_element(scan)));
	    else scan=prev_node(scan);
	    return false;}

	// BACKWARD goes to the final (deepest last) child
	//  of the previous sibling
	function backward_node(node){
	    if (node.previousSibling) {
		var scan=node.previousSibling;
		// If it's not an element, just return it
		if (scan.nodeType!==1) return scan;
		// Otherwise, return the last and deepest child
		while (scan) {
		    var children=scan.childNodes;
		    if (!(children)) return scan;
		    else if (children.length===0) return scan;
		    else scan=children[children.length-1];}
		return scan;}
	    else return node.parentNode;}

	function backward_element(node){
	    if (havechildren)
		return ((node.previousElementSibling)?
			(get_final_child((node.previousElementSibling))):
			(node.parentNode));
	    else if ((node.previousElementSibling)||(node.previousSibling)) {
		var start=(node.previousElementSibling)||(node.previousSibling);
		if (start.nodeType===1) 
		    return get_final_child(start);
		else return start;}
	    else return node.parentNode;}
	// We use a helper function because 
	function get_final_child(node){
	    if (node.nodeType===1) {
		if (node.childNodes) {
		    var children=node.childNodes;
		    if (!(children.length)) return node;
		    var scan=children.length-1;
		    while (scan>=0) {
			var child=get_final_child(children[scan--]);
			if (child) return child;}
		    return node;}
		else return node;}
	    else return false;}
	
	function scan_backward(node,test,justelts){
	    if (!(test)) {
		if (justelts) return backward_element(node);
		else return backward_node(node);}
	    var scan=((justelts)?
		      (backward_element(node)):
		      (backward_node(node)));
	    while (scan) {
		if (test(scan)) return scan;
		else if (justelts) scan=next_element(scan);
		else scan=next_node(scan);}
	    return false;}
	
	fdjtDOM.prevElt=previous_element;
	fdjtDOM.backwardElt=backward_element;
	fdjtDOM.backward=scan_backward;
	fdjtDOM.prev=scan_previous;

	/* Viewport/window functions */

	fdjtDOM.viewTop=function(win){
	    win=win||window;
	    return (win.pageYOffset||win.scrollY||win.document.documentElement.scrollTop||0);};
	fdjtDOM.viewLeft=function(win){
	    win=win||window;
	    return (win.pageXOffset||win.scrollX||win.document.documentElement.scrollLeft||0);};
	fdjtDOM.viewHeight=function(win){
	    win=win||window;
	    return win.innerHeight||
		win.document.documentElement.clientHeight;};
	fdjtDOM.viewWidth=function(win){
	    win=win||window;
	    return win.innerWidth||
		win.document.documentElement.clientWidth;};

	/* Listeners (should be in UI?) */

	function addListener(node,evtype,handler){
	    if (!(node)) node=document;
	    if (typeof node === 'string') node=fdjtID(node);
	    else if (node instanceof Array) {
		var i=0; var lim=node.length;
		while (i<lim) addListener(node[i++],evtype,handler);
		return;}
	    else if (node.length)
		return addListener(TOA(node),evtype,handler);
	    // OK, actually do it
	    if (evtype==='title') { 
		// Not really a listener, but helpful
		if (typeof handler === 'string') 
		    if (node.title)
			node.title='('+handler+') '+node.title;
		else node.title=handler;}
	    else if (evtype[0]==='=')
		node[evtype.slice(1)]=handler;
	    else if (node.addEventListener)  {
		// fdjtLog("Adding listener %o for %o to %o",handler,evtype,node);
		return node.addEventListener(evtype,handler,false);}
	    else if (node.attachEvent)
		return node.attachEvent('on'+evtype,handler);
	    else fdjtLog.warn('This node never listens: %o',node);}
	fdjtDOM.addListener=addListener;

	function addListeners(node,handlers){
	    if (handlers) 
		for (evtype in handlers) {
		    addListener(node,evtype,handlers[evtype]);}}
	fdjtDOM.addListeners=addListeners;

	fdjtDOM.T=function(evt) {
	    evt=evt||event; return (evt.target)||(evt.srcElement);};

	fdjtDOM.cancel=function(evt){
	    evt=evt||event;
	    if (evt.preventDefault) evt.preventDefault();
	    else evt.returnValue=false;
	    evt.cancelBubble=true;};

	fdjtDOM.init=function(){
	    havechildren=((document)&&
			  (document.body)&&
			  (document.body.childNodes)&&
			  (document.body.children));};

	return fdjtDOM;
    })();

function fdjtID(id) { return document.getElementById(id);}
function _(string) { return string;}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
