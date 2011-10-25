/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2011 beingmeta, inc.
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

var fdjt$=false;

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
			if (eqpos<0) {
			    node.setAttribute(
				sel.slice(1,sel.length-1),
				sel.slice(1,sel.length-1));}
			else {
			    node.setAttribute(
				sel.slice(1,eqpos),
				sel.slice(eqpos+1,sel.length-1));}}
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
	
	fdjtDOM.clone=function(node){
	    return node.cloneNode(true);}

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
		if ((NodeList)&&(content instanceof NodeList)) content=TOA(content);
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
		if ((NodeList)&&(content instanceof NodeList)) content=TOA(content);
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

	fdjtDOM.appendArray=domappend;
	
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

	function parsePX(arg,dflt){
	    if (typeof dflt === 'undefined') dflt=0;
	    if (arg===0) return 0;
	    else if (!(arg)) return dflt;
	    else if (arg==="none") return dflt;
	    else if (arg==="auto") return dflt;
	    else if (typeof arg === 'number') return arg;
	    else if (typeof arg === 'string') {
		var len=arg.length; var num=false;
		if ((len>2)&&(arg[len-1]==='x')&&(arg[len-2]==='p'))
		    num=parseInt(arg.slice(0,-2));
		else num=parseInt(arg);
		if (num===0) return 0;
		else if (isNaN(num)) return dflt;
		else if (typeof num === 'number') return num;
		else return dflt;}
	    else return false;}
	fdjtDOM.parsePX=parsePX;

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

	function nodeString(node){
	    if (node.nodeType===3) 
		return "<'"+node.value+"'>";
	    else if (node.nodeType===1) {
		var output="<"+node.tagName;
		if (node.id) output=output+"#"+node.id;
		if (node.tagName==='input') {
		    output+"[type="+node.type+"]";
		    output+"[name="+node.name+"]";}
		else if (node.tagName==='textarea')
		    output+"[name="+node.name+"]";
		else if (node.tagName==='img') {
		    if (node.alt) output=output+"[alt="+node.alt+"]";
		    else if (node.src) output=output+"[src="+node.src+"]";}
		else {}
		if (node.className)
		    output=output+"."+node.className.replace(/\s+/g,'.');
		return output+">";}
	    else return node.toString();}
	fdjtDOM.nodeString=nodeString;
	
	/* Simple class/attrib manipulation functions */

	function hasClass(elt,classname,attrib){
	    var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :
			   (elt.className));
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
	fdjtDOM.aC=addClass;

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
	fdjtDOM.dC=dropClass;

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
	fdjtDOM.tC=toggleClass;
	
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
	fdjtDOM.sel=function(spec){
	    if (!(spec)) return false;
	    else if (spec instanceof Selector) return spec;
	    else if (spec instanceof Array) {
		if (spec.length)
		    return new Selector(spec.join(","));
		else return false;}
	    else if (typeof spec === 'string')
		return new Selector(spec);
	    else {
		fdjtLog.warn("Non selector spec: %o",spec);
		return false;}};

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
	fdjtDOM.$P=getParent;
	fdjtDOM.inherits=function(node,spec) {
	    var sel=new Selector(spec);
	    return ((sel.match(node))?(node):(getParent(node,sel)));};

	function getChildren(node,classname,attrib,results){
	    if (!(node)) return [];
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
	fdjt$=fdjtDOM.$=function(spec,root){
	    return toArray(getChildren(root||document,spec));};
	fdjt$1=fdjtDOM.getFirstChild=function(elt,spec){
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

	fdjtDOM.getAttrib=function(elt,attrib,ns){
	    var probe;
	    if ((ns)&&(elt.getAttributeByNS))
		probe=elt.getAttributeNS(attrib,ns);
	    if (probe) return probe;
	    else return elt.getAttribute(attrib)||
		elt.getAttribute("data-"+attrib);};

	fdjtDOM.findAttrib=function(scan,attrib,ns){
	    var dattrib="data-"+attrib;
	    while (scan) {
		if ((ns)&&(scan.getAttributeNS)&&
		    (scan.getAttributeNS(attrib,ns)))
		    return scan.getAttributeNS(attrib,ns);
		else if (scan.getAttribute) {
		    if (scan.getAttribute(attrib))
			return scan.getAttribute(attrib);
		    else if (scan.getAttribute(dattrib))
			return scan.getAttribute(dattrib);
		    else scan=scan.parentNode;}
		else scan=scan.parentNode;}
	    return false;};
	
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
	    if (typeof before === 'string')
		before=document.getElementById(before);
	    dominsert(before,arguments,1);};
	fdjtDOM.insertAfter=function (after) {
	    if (typeof after === 'string')
		after=document.getElementById(after);
	    if (after.nextSibling)
		dominsert(after.nextSibling,arguments,1);
	    else domappend(after.parentNode,arguments,1);};
	
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
	fdjtDOM.Checkbox=function(name,value,checked){
	    var node=fdjtDOM("INPUT");
	    node.type="checkbox"
	    node.name=name;
	    if (value) node.value=value;
	    if (checked) node.checked=true;
	    else node.checked=false;
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

	function getInputs(root,name,type){
	    var results=[];
	    var inputs=root.getElementsByTagName('input');
	    var i=0; var lim=inputs.length;
	    while (i<lim) {
		if (((!(name))||(inputs[i].name===name))&&
		    ((!(type))||(inputs[i].type===type)))
		    results.push(inputs[i++]); 
		else i++;}
	    if ((!type)||(type==='textarea')||(type==='text')) {
		var inputs=root.getElementsByTagName('textarea');
		var i=0; var lim=inputs.length;
		while (i<lim) {
		    if (((!(name))||(inputs[i].name===name))&&
			((!(type))||(inputs[i].type===type)))
			results.push(inputs[i++]); 
		    else i++;}}
	    if ((!type)||(type==='button')||(type==='submit')) {
		var inputs=root.getElementsByTagName('button');
		var i=0; var lim=inputs.length;
		while (i<lim) {
		    if (((!(name))||(inputs[i].name===name))&&
			((!(type))||(inputs[i].type===type)))
			results.push(inputs[i++]); 
		    else i++;}}
	    if ((!type)||(type==='select')) {
		var inputs=root.getElementsByTagName('select');
		var i=0; var lim=inputs.length;
		while (i<lim) {
		    if ((!(name))||(inputs[i].name===name))
			results.push(inputs[i++]); 
		    else i++;}}
	    return results;}

	fdjtDOM.getInputs=getInputs;
	fdjtDOM.getInput=function(root,name,type){
	    var results=getInputs(root,name||false,type||false);
	    if ((results)&&(results.length===1))
		return results[0];
	    else if ((results)&&(results.length)) {
		fdjtLog.warn(
		    "Ambiguous input reference name=%o type=%o under %o",
		    name,type,root);
		return results[0];}
	    else return false;};
	
	function getInputValues(root,name){
	    var results=[];
	    var inputs=root.getElementsByTagName('input');
	    var i=0; var lim=inputs.length;
	    while (i<lim) {
		var input=inputs[i++];
		if (input.name!==name) continue;
		if ((input.type==='checkbox')||(input.type==='radio')) {
		    if (!(input.checked)) continue;}
		results.push(input.value);}
	    return results;}
	fdjtDOM.getInputValues=getInputValues;

	/* Getting style information generally */

	function getStyle(elt,prop){
	    if (typeof elt === 'string') elt=document.getElementById(elt);
	    if (!(elt)) return elt;
	    if (elt.nodeType!==1) throw "Not an element";
	    try {
		var style=
		    ((window.getComputedStyle)&&
		     (window.getComputedStyle(elt,null)))||
		    (elt.currentStyle);
		if (!(style)) return false;
		else if (prop) return style[prop];
		else return style;}
	    catch (ex) {
		fdjtLog("Unexpected style error %o",ex);
		return false;}}
	fdjtDOM.getStyle=getStyle;

	function styleString(elt){
	    var style=elt.style; var result;
	    if (!(style)) return false;
	    var i=0; var lim=style.length;
	    if (lim===0) return false;
	    while (i<lim) {
		var p=style[i];
		var v=style[p];
		if (i===0) result=p+": "+v;
		else result=result+"; "+p+": "+v;
		i++;}
	    return result;}
	fdjtDOM.styleString=styleString;

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
	    if ((!(elt))||(!(elt.nodeType))||(elt.nodeType!==1))
		return false;
	    return (((window.getComputedStyle)&&
		     (window.getComputedStyle(elt,null))&&
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

	function getGeometry(elt,root,outer,withstack){
	    if (!(withstack)) withstack=false;
	    if (typeof elt === 'string')
		elt=document.getElementById(elt);
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var stack = ((withstack) ? (new Array(elt)) : false);
	    var width=elt.offsetWidth;
	    var height=elt.offsetHeight;
	    var rootp=((root)&&(root.offsetParent));

	    if (elt===root) 
		return {left: 0,top: 0,width:width,height: height};
	    elt=elt.offsetParent;
	    while (elt) {
		if ((root)&&((elt===root)||(elt===rootp))) break;
		if (withstack) withstack.push(elt);
		top += elt.offsetTop;
		left += elt.offsetLeft;
		elt=elt.offsetParent;}
	    
	    if (outer) {
		var outer_width, outer_height;
		var style=getStyle(elt);
		var t_margin=parsePX(style.marginTop);
		var r_margin=parsePX(style.marginRight);
		var b_margin=parsePX(style.marginBottom);
		var l_margin=parsePX(style.marginLeft);
		outer_width=width+l_margin+r_margin;
		outer_height=height+t_margin+b_margin;
		return {left: left, top: top, width: width,height: height,
			right:left+width,bottom:top+height,
			top_margin: t_margin, bottom_margin: b_margin,
			left_margin: l_margin, right_margin: r_margin,
			outer_height: outer_height,outer_width: outer_width,
			stack:withstack};}
	    else return {left: left, top: top, width: width,height: height,
			 right:left+width,bottom:top+height,
			 stack:withstack};}
	fdjtDOM.getGeometry=getGeometry;

	function geomString(geom){
	    return +((typeof geom.width == 'number')?(geom.width):"?")+
		"x"+((typeof geom.height == 'number')?(geom.height):"?")+
		"@l:"+((typeof geom.left == 'number')?(geom.left):"?")+
		",t:"+((typeof geom.top == 'number')?(geom.top):"?")+
		"/r:"+((typeof geom.right == 'number')?(geom.right):"?")+
		",b:"+((typeof geom.bottom == 'number')?(geom.bottom):"?");}
	fdjtDOM.geomString=geomString;

	function isVisible(elt,partial){
	    var start=elt;
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

	    if ((elt)&&(!((elt===window)||(elt===document.body)))) {
		// fdjtLog("%o l=%o t=%o",elt,elt.scrollLeft,elt.scrollTop);
		if ((elt.scrollTop)||(elt.scrollLeft)) {
		    fdjtLog("Adjusting for inner DIV");
		    winx=elt.scrollLeft; winy=elt.scrollTop;
		    winxedge=winx+elt.scrollWidth;
		    winyedge=winy+elt.scrollHeight;}}

	    /*
	      fdjtLog("fdjtIsVisible%s %o top=%o left=%o height=%o width=%o",
	      ((partial)?("(partial)"):""),start,
	      top,left,height,width);
	      fdjtLog("fdjtIsVisible %o winx=%o winy=%o winxedge=%o winyedge=%o",
	      elt,winx,winy,winxedge,winyedge);
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

	function countBreaks(arg){
	    if (typeof arg === 'string') {
		return arg.match(/\W*\s+\W*/g).length;}
	    else if (!(arg.nodeType)) return 0;
	    else if (arg.nodeType===1) {}
	    else if (arg.nodeType===3)
		return arg.nodeValue.match(/\W*\s+\W*/g).length;
	    else return 0;}
	fdjtDOM.countBreaks=countBreaks;

	function wordOffset(arg){
	    var scan=arg; var count=0;
	    while (scan=(scan.previousSibling||scan.parentNode)) {
		if (scan.nodeType===3)
		    count=count+(scan.nodeValue.match(/\W*\s+\W*/g).length);
		else if (scan.nodeType===1)
		    count=count+countBreaks(scan);
		else {}}
	    return count;}

	function hasContent(node,recur,test){
	    if (node===recur) return false;
	    else if (node.nodeType===3)
		return (child.nodeValue.search(/\w/g)>=0);
	    else if (node.nodeType!==1) return false;
	    else if ((test)&&(test.match)&&(test.match(node)))
		return true;
	    else if ((test===true)&&
		     ((node.tagName==='IMG')||
		      (node.tagName==='OBJECT')))
		return true;
	    else if (node.childNodes) {
		var children=node.childNodes;
		var i=0; while (i<children.length) {
		    var child=children[i++];
		    if (child===recur) return false;
		    else if (child.nodeType===3) {
			if (child.nodeValue.search(/\w/g)>=0) return true;
			else continue;}
		    else if (child.nodeType!==1) continue;
		    else if (recur) {
			if (hasContent(child,recur,test)) return true;
			else continue;}
		    else continue;}
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

	/* A 'refresh method' does a className eigenop to force IE redisplay */

	fdjtDOM.refresh=function(elt){
	    elt.className=elt.className;};
	fdjtDOM.setAttrib=function(elt,attrib,val){
	    if ((typeof elt === 'string')&&(fdjtID(elt)))
		elt=fdjtID(elt);
	    elt.setAttribute(attrib,val);
	    elt.className=elt.className;};
	fdjtDOM.dropAttrib=function(elt,attrib){
	    if ((typeof elt === 'string')&&(fdjtID(elt)))
		elt=fdjtID(elt);
	    elt.removeAttribute(attrib);
	    elt.className=elt.className;};

	/* Determining if something has overflowed */
	fdjtDOM.overflowing=function(node){
	    // I haven't really tried this cross-browser, but I read it worked and
	    //  have been in situations where it would be handy
	    return (node.clientHeight!==node.scrollHeight);}

	/* Sizing to fit */

	var default_trace_adjust=false;

	function getInsideBounds(container){
	    var left=false; var top=false;
	    var right=false; var bottom=false;
	    var children=container.childNodes;
	    var i=0; var lim=children.length;
	    while (i<lim) {
		var child=children[i++];
		if (typeof child.offsetLeft !== 'number') continue;
		var style=getStyle(child);
		if (style.position!=='static') continue;
		var child_left=child.offsetLeft-parsePX(style.marginLeft);
		var child_top=child.offsetTop-parsePX(style.marginTop);
		var child_right=child.offsetLeft+child.offsetWidth+parsePX(style.marginRight);
		var child_bottom=child.offsetTop+child.offsetHeight+parsePX(style.marginBottom);
		if (left===false) {
		    left=child_left; right=child_right;
		    top=child_top; bottom=child_bottom;}
		else {
		    if (child_left<left) left=child_left;
		    if (child_top<top) top=child_top;
		    if (child_right>right) right=child_right;
		    if (child_bottom>bottom) bottom=child_bottom;}}
	    return {left: left,right: right,top: top, bottom: bottom,
		    width: right-left,height:bottom-top};}
	fdjtDOM.getInsideBounds=getInsideBounds;
	function applyScale(container,scale,traced){
	    var images=fdjtDOM.getChildren(container,"IMG");
	    var ilim=images.length;
	    var oldscale=container.scale||100;
	    if (scale) {
		container.scale=scale;
		container.style.fontSize=scale+'%';
		var rounded=10*Math.round(scale/10);
		fdjtDOM.addClass(container,"fdjtscaled");
		fdjtDOM.swapClass(
		    container,/\bfdjtscale\d+\b/,"fdjtscale"+rounded);}
	    else if (!(container.scale)) return;
	    else {
		delete container.scale;
		container.style.fontSize="";
		fdjtDOM.dropClass(container,"fdjtscaled");
		fdjtDOM.dropClass(container,/\bfdjtscale\d+\b/);}
	    var iscan=0; while (iscan<ilim) {
		var image=images[iscan++];
		if ((fdjtDOM.hasClass(image,"nofdjtscale"))||
		    (fdjtDOM.hasClass(image,"noautoscale")))
		    continue;
		// Reset dimensions to get real info
		image.style.maxWidth=image.style.width=
		    image.style.maxHeight=image.style.height='';
		if (scale) {
		    var width=image.offsetWidth;
		    var height=image.offsetHeight;
		    image.style.maxWidth=image.style.width=
			Math.round(width*(scale/100))+'px';
		    image.style.maxHeight=image.style.height=
			Math.round(height*(scale/100))+'px';}}}
	
	function adjustInside(elt,container,step,min,pad){
	    var trace_adjust=(elt.traceadjust)||
		(container.traceadjust)||fdjtDOM.trace_adjust||
		((elt.className)&&(elt.className.search(/\btraceadjust\b/)>=0))||
		((container.className)&&
		 (container.className.search(/\btraceadjust\b/)>=0))||
		default_trace_adjust;
	    if (!(step)) step=5;
	    if (!(min)) min=50;
	    if (!(pad)) pad=1;
	    var scale=100;
	    function adjust(){
		var outside=getGeometry(container);
		var inside=getGeometry(elt,container);
		var style=getStyle(container);
		var maxwidth=
		    outside.width-
		    (parsePX(style.paddingLeft,0)+
		     parsePX(style.borderLeft,0)+
		     parsePX(style.paddingRight,0)+
		     parsePX(style.borderRight,0));
		var maxheight=
		    outside.height-
		    (parsePX(style.paddingTop,0)+
		     parsePX(style.borderTop,0)+
		     parsePX(style.paddingBottom,0)+
		     parsePX(style.borderBottom,0));
		if (trace_adjust)
		    fdjtLog("adjustInside scale=%o step=%o min=%o pad=%o [l%o,t%o,r%o,b%o] << %ox%o < %ox%o",
			    scale,step,min,pad,
			    inside.left,inside.top,inside.right,inside.bottom,
			    maxwidth*pad,maxheight*pad,
			    maxwidth,maxheight);
		if ((inside.top>=0)&&(inside.bottom<=(pad*maxheight))&&
		    (inside.left>=0)&&(inside.right<=(pad*maxwidth)))
		    return;
		else if (scale<=min) return;
		else {
		    scale=scale-step;
		    applyScale(elt,scale,trace_adjust);
		    setTimeout(adjust,10);}}
	    setTimeout(adjust,10);}
	function adjustToFit(container,threshold,padding){
	    var trace_adjust=(container.traceadjust)||
		fdjtDOM.trace_adjust||
		((container.className)&&(container.className.search(/\btraceadjust\b/)>=0))||
		default_trace_adjust;
	    var style=getStyle(container);
	    var geom=getGeometry(container);
	    var maxheight=((style.maxHeight)&&(parsePX(style.maxHeight)))||
		(geom.height);
	    var maxwidth=((style.maxWidth)&&(parsePX(style.maxWidth)))||
		(geom.width);
	    var goodenough=threshold||0.1;
	    var scale=(container.scale)||100.0;
	    var bounds=getInsideBounds(container);
	    var hpadding=
		(fdjtDOM.parsePX(style.paddingLeft)||0)+
		(fdjtDOM.parsePX(style.paddingRight)||0)+
		(fdjtDOM.parsePX(style.borderLeftWidth)||0)+
		(fdjtDOM.parsePX(style.borderRightWidth)||0)+
		padding;
	    var vpadding=
		(fdjtDOM.parsePX(style.paddingTop)||0)+
		(fdjtDOM.parsePX(style.paddingBottom)||0)+
		(fdjtDOM.parsePX(style.borderTopWidth)||0)+
		(fdjtDOM.parsePX(style.borderBottomWidth)||0)+
		padding;
	    maxwidth=maxwidth-hpadding; maxheight=maxheight-vpadding; 
	    var itfits=((bounds.height/maxheight)<=1)&&((bounds.width/maxwidth)<=1);
	    if (trace_adjust) 
		fdjtLog("Adjust (%o) %s cur=%o%s, best=%o~%o, limit=%ox%o=%o, box=%ox%o=%o, style=%s",
			goodenough,fdjtDOM.nodeString(container),
			scale,((itfits)?" (fits)":""),
			container.bestscale||-1,container.bestfit||-1,
			maxwidth,maxheight,maxwidth*maxheight,
			bounds.width,bounds.height,bounds.width*bounds.height,
			styleString(container));
	    if (itfits) {
		/* Figure out how well it fits */
		var fit=Math.max((1-(bounds.width/maxwidth)),
				 (1-(bounds.height/maxheight)));
		var bestfit=container.bestfit||1.5;
		if (!(trace_adjust)) {}
		else if (container.bestscale) 
		    fdjtLog("%s %o~%o vs. %o~%o",
			    ((fit<goodenough)?"Good enough!":
			     ((fit<bestfit)?"Better!":"Worse!")),
			    scale,fit,container.bestscale,container.bestfit);
		else fdjtLog("First fit %o~%o",scale,fit);
		if (fit<bestfit) {
		    container.bestscale=scale; container.bestfit=fit;}
		// If it's good enough, just return
		if (fit<goodenough) {
		    container.goodscale=scale; return;}}
	    // Figure out the next scale factor to try
	    var dh=bounds.height-maxheight; var dw=bounds.width-maxwidth;
	    var rh=maxheight/bounds.height; var rw=maxwidth/bounds.width;
	    var newscale=
		((itfits)?
		 (scale*Math.sqrt
		  ((maxwidth*maxheight)/(bounds.width*bounds.height))):
		 (rh<rw)?(scale*rh):(scale*rw));
	    if (trace_adjust)
		fdjtLog("[%fs] Trying newscale=%o, rw=%o rh=%o",
			fdjtET(),newscale,rw,rh);
	    applyScale(container,newscale,trace_adjust);}
	fdjtDOM.applyScale=applyScale;
	fdjtDOM.adjustToFit=adjustToFit;
	fdjtDOM.adjustInside=adjustInside;
	fdjtDOM.insideBounds=getInsideBounds;
	fdjtDOM.finishScale=function(container){
	    var traced=(container.traceadjust)||
		fdjtDOM.trace_adjust||default_trace_adjust;
	    if (!(container.bestscale)) {
		applyScale(container,false,traced);
		fdjtLog("No good scaling for %o style=%s",
			fdjtDOM.nodeString(container),
			fdjtDOM.styleString(container));
		return;}
	    else if (container.scale===container.bestscale) {}
	    else applyScale(container,container.bestscale,traced);
	    if (traced)
		fdjtLog("Final scale %o~%o for %o style=%s",
			container.bestscale,container.bestfit,
			fdjtDOM.nodeString(container),
			fdjtDOM.styleString(container));
	    delete container.bestscale;
	    delete container.bestfit;
	    delete container.goodscale;};
	
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

	function getMeta(name,multiple,matchcase,dom){
	    var results=[];
	    var matchname=((!(matchcase))&&(name.toUpperCase()));
	    var elts=((document.getElementsByTagName)?
		      (document.getElementsByTagName("META")):
		      (getChildren(document,"META")));
	    var i=0; while (i<elts.length) {
		if (elts[i])
		    if ((elts[i].name===name)||
			((matchname)&&(elts[i].name)&&
			 (elts[i].name.toUpperCase()===matchname))) {
			if (multiple) {
			    if (dom) results.push(elts[i++]);
			    else results.push(elts[i++].content);}
			else if (dom) return elts[i];
			else return elts[i].content;}
		else i++;}
	    if (multiple) return results;
	    else return false;}
	fdjtDOM.getMeta=getMeta;

	// This gets a LINK href field
	function getLink(name,multiple,matchcase,dom){
	    var results=[];
	    var matchname=((!((matchcase)))&&(name.toUpperCase()));
	    var elts=((document.getElementsByTagName)?
		      (document.getElementsByTagName("LINK")):
		      (getChildren(document,"LINK")));
	    var i=0; while (i<elts.length) {
		if (elts[i])
		    if ((elts[i].rel===name)||
			((matchname)&&(elts[i].rel)&&
			 (elts[i].rel.toUpperCase()===matchname))) {
			if (multiple) {
			    if (dom) results.push(elts[i++]);
			    else results.push(elts[i++].href);}
			else if (dom) return elts[i];
			else return elts[i].href;}
		else i++;}
	    if (multiple) return results;
	    else return false;}
	fdjtDOM.getLink=getLink;

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
	    return (win.pageYOffset||win.scrollY||
		    win.document.documentElement.scrollTop||0);};
	fdjtDOM.viewLeft=function(win){
	    win=win||window;
	    return (win.pageXOffset||win.scrollX||
		    win.document.documentElement.scrollLeft||0);};
	fdjtDOM.viewHeight=function(win){
	    win=win||window;
	    var docelt=((win.document)&&(win.document.documentElement));
	    return (win.innerHeight)||((docelt)&&(docelt.clientHeight));};
	fdjtDOM.viewWidth=function(win){
	    win=win||window;
	    var docelt=((win.document)&&(win.document.documentElement));
	    return ((win.innerWidth)||((docelt)&&(docelt.clientWidth)));};

	/* Stylesheet manipulation */

	// Adapted from 
	// http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript

        // Return requested style object
	function getCSSRule(ruleName, deleteFlag) {
	    ruleName=ruleName.toLowerCase();
            // If browser can play with stylesheets
	    if (document.styleSheets) {
		// For each stylesheet
		for (var i=0; i<document.styleSheets.length; i++) {
		    var styleSheet=document.styleSheets[i];
		    var cssRule=false;
		    var cssRules=styleSheet.cssRules||styleSheet.rules;
		    var n_rules=((cssRules)&&(cssRules.length));
		    var ii=0; while (ii<n_rules) {
			if (cssRules[ii])  {
			    var cssRule=cssRules[ii];
			    if (cssRule.selectorText.toLowerCase()==ruleName) {
				if (deleteFlag=='delete') {
				    if (styleSheet.cssRules) {
					styleSheet.deleteRule(ii);}
				    // Delete rule IE style.
				    return true;}
				// found and not deleting.
				else {return cssRule;}
                                // end found cssRule
			    }}   
			ii++;}
		    /* end for stylesheets */ }
		return false;}
	    return false;}
	fdjtDOM.getCSSRule=getCSSRule;

	function dropCSSRule(ruleName) {// Delete a CSS rule   
	    return getCSSRule(ruleName,'delete');}
	fdjtDOM.dropCSSRule=dropCSSRule;

	function addCSSRule(selector,text) {// Create a new css rule
	    var styles=fdjtID("FDJTSTYLES");
	    if (!(styles)) {
		var head=document.getElementsByTagName("HEAD");
		if (head.length===0) return; else head=head[0];
		styles=fdjtDOM("style#FDJTSTYLES");
		head.appendChild(styles);}
	    var sheet=styles.sheet;
	    if (sheet.insertRule) {
		var rules=sheet.cssRules||sheet.rules;
		var i=0; var lim=rules.length;
		while (i<lim) {
		    var rule=rules[i];
		    if (rule.selectorText===selector) break;
		    else i++;}
		if (i<lim) {
		    if (sheet.deleteRule) sheet.deleteRule(i);
		    else if (sheet.removeRule) sheet.removeRule(i);
		    else {}}
		var rules=sheet.cssRules||sheet.rules;
		var ruletext=selector+' {'+text+'}';
		if (sheet.insertRule)
		    sheet.insertRule(ruletext, rules.length);
		else if (sheet.addRule)
		    sheet.addRule(selector,text);
		else return false;
		return ruletext;}
	    else return false;}
	fdjtDOM.addCSSRule=addCSSRule;

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
		    if (handlers[evtype])
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

	if (navigator.userAgent.search("WebKit")>=0) {
	    fdjtDOM.transition='-webkit-transition';
	    fdjtDOM.transitionProperty='-webkit-transition-property';
	    fdjtDOM.transform='-webkit-transform';
	    fdjtDOM.columnWidth='-webkit-column-width';
	    fdjtDOM.columnGap='-webkit-column-gap';}
	else if (navigator.userAgent.search("Mozilla")>=0) {
	    fdjtDOM.transitionProperty='-moz-transition-property';
	    fdjtDOM.transition='-moz-transition';
	    fdjtDOM.transform='-moz-transform';
	    fdjtDOM.columnWidth='MozColumnWidth';
	    fdjtDOM.columnGap='MozColumnGap';}
	else {
	    fdjtDOM.transitionProperty='transition-property';
	    fdjtDOM.transition='transition';
	    fdjtDOM.transform='transform';}
	
	function node2text(node,accum){
	    if (!(accum)) accum="";
	    if (node.nodeType===3) {
		var stringval=node.nodeValue;
		if (stringval) accum=accum+stringval;
		return accum;}
	    else if (node.nodeType===1) {
		var children=node.childNodes;
		var i=0, lim=children.length;
		while (i<lim) {
		    accum=node2text(children[i++],accum);}
		return accum;}
	    else return accum;}
	fdjtDOM.node2text=node2text;
	
	function get_text_pos(node,pos,cur){
	    if (cur>pos) return false;
	    else if (node.nodeType===3) {
		var stringval=node.nodeValue;
		if (pos<(cur+stringval.length))
		    return { node: node, off: pos-cur};
		else return pos+stringval.length;}
	    else if (node.nodeType===1) {
		var children=node.childNodes;
		var i=0, lim=children.length;
		while (i<lim) {
		    cur=get_text_pos(children[i++],pos,cur);
		    if (!(typeof cur === 'number')) return cur;}
		return cur;}
	    else return cur;}
	fdjtDOM.textPos=function(node,pos){
	    return get_text_pos(node,pos,0);};

	function findExcerpt(node,string,count){
	    if (!(count)) count=1;
	    var fulltext=node2text(node); var loc=-1, cur=0;
	    while ((loc=fulltext.indexOf(string,cur))>=0) {
		if (count===1) {
		    var start=get_text_pos(node,loc,0);
		    var end=get_text_pos(node,loc+string.length,0);
		    return { start_node: start.node, start_off: start.off,
			     end_node: end.node, end_off: end.off};}
		else {count--; cur=loc+string.length;}}
	    return false;}
	fdjtDOM.findExcerpt=findExcerpt;

	var docuri=false; var docbase=false;
	function init_docuri(){
	    if (docuri) return;
	    docuri=getLink("refuri")||getLink("canonical")||
		document.location.href;
	    docbase=getMeta("baseid");}
	

	function getAssignedIDs(node){
	    var refuris=[];
	    var baseids=[];
	    var scan=node;
	    var refuri=false;
	    while (scan) {
		if ((scan)&&(scan.getAttribute)&&
		    ((refuri=scan.getAttribute("data-refuri"))||
		     (refuri=scan.getAttribute("refuri")))) {
		    var baseid=scan.getAttribute("data-baseid")||
			scan.getAttribute("baseid")||
			false;
		    refuris.push(refuri); baseids.push(baseid);
		    scan=scan.parentNode;}
		else scan=scan.parentNode;}
	    var link=getLink("refuri")||getLink("canonical");
	    var base=getLink("baseid");
	    if (docuri) init_docuri();
	    refuris.push(docuri);
	    baseids.push(docbase);
	    var ids=[];
	    if (node.id) ids.push(node.id);
	    if (node.childNodes) {
		var children=node.childNodes, child;
		var i=0; var lim=children.length;
		while (i<lim) {
		    if (((child=children[i++]).nodeType===1)&&
			(child.tagName==='A')) {
			if (child.name) ids.push(child.name);
			else if (child.id) ids.push(child.id);}}}
	    var refs=[];
	    var i=0; var lim=ids.length;
	    while (i<lim) {
		var id=ids[i++];
		var j=0; var jlim=refuris.length;
		while (j<jlim) {
		    if ((!(baseids[j]))||
			(id.search(baseids[j])===0))
			refs.push(refuris[j]+"#"+id);
		    j++;}}
	    return refs;}

	fdjtDOM.getParaHash=function(node){
	    return paraHash(textify(node));}

	return fdjtDOM;
    })();

function fdjtID(id) {
    return ((id)&&
	    ((document.getElementById(id))||
	     ((id[0]==='#')&&
	      (document.getElementById(id.slice(1))))));}
function _(string) { return string;}

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
