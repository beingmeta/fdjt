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

var fdjtUI=
    {CoHi: {classname: "cohi"},AutoPrompt: {}, InputHelp: {},
     Expansion: {},Collapsible: {},
     Tabs: {}, MultiText: {}};

/* Co-highlighting */
/* When the mouse moves over a named element, the 'cohi' class is added to
   all elements with the same name. */
(function(){
    var highlights={};
    function highlight(namearg,classname_arg){
	var classname=((classname_arg) || (fdjtUI.CoHi.classname));
	var newname=(namearg.name)||(namearg);
	var cur=highlights[classname];
	if (cur===newname) return;
	if (cur) {
	    var drop=document.getElementsByName(cur);
	    var i=0, n=drop.length;
	    while (i<n) fdjtDOM.dropClass(drop[i++],classname);}
	highlights[classname]=newname||false;
	if (newname) {
	    var elts=document.getElementsByName(newname);
	    var n=elts.length, i=0;
	    while (i<n) fdjtDOM.addClass(elts[i++],classname);}}
    
    fdjtUI.CoHi.onmouseover=function(evt,classname_arg){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
		((target.tagName==='A') && (target.href)))
		return;
	else if (target.name) break;  
	else target=target.parentNode;
	if (!(target)) return;
	highlight(target.name,classname_arg);};
    fdjtUI.CoHi.onmouseout=function(evt,classname_arg){
	var target=fdjtDOM.T(evt);
	highlight(false,((classname_arg) || (fdjtUI.CoHi.classname)));};
})();

/* CheckSpans:
   Text regions which include a checkbox where clicking toggles the checkbox. */
(function(){
    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var toggleClass=fdjtDOM.toggleClass;
    var getParent=fdjtDOM.getParent;
    var getChildren=fdjtDOM.getChildren;
    var getChild=fdjtDOM.getChild;

    function CheckSpan(spec,varname,val,checked){
	var input=fdjtDOM.Input('input[type=checkbox]',varname,val);
	var span=fdjtDOM(spec||"span.checkspan",input);
	if (checked) {
	    input.checked=true;
	    fdjtDOM.addClass(span,"ischecked");}
	else input.checked=false;
	if (arguments.length>4)
	    fdjtDOM.appendArray(span,arguments,4);
	return span;}
    fdjtUI.CheckSpan=CheckSpan;

    function checkable(elt){
	return (elt.nodeType===1)&&
	    (elt.tagName==='INPUT')&&
	    ((elt.type=='checkbox')||(elt.type=='radio'));}

    function checkspan_set(target,checked) {
	var checkspan=((hasClass(target,"checkspan"))?(target):
		       (getParent(target,".checkspan")));
	var input=getParent(target,"input");
	if (!(checkspan)) return false;
	var inputs=(getChildren(checkspan,checkable));
	if (inputs.length===0) return false;
	if (!(input)) input=inputs[0];
	if (typeof checked === 'undefined') checked=input.checked;
	else input.checked=checked;
	if (checked) addClass(checkspan,"ischecked");
	else dropClass(checkspan,"ischecked");
	var i=0; var lim=inputs.length;
	while (i<lim) {
	    var cb=inputs[i++];
	    if (cb===input) continue;
	    if ((cb.checked)&&(!(checked))) cb.checked=false;
	    else if ((!(cb.checked))&&(checked)) cb.checked=true;
	    else continue;
	    var evt=document.createEvent("HTMLEvents");
	    evt.initEvent("change",false,true);
	    cb.dispatchEvent(evt);}
	return true;}
    fdjtUI.CheckSpan.set=checkspan_set;

    function checkspan_onclick(evt) {
	evt=evt||event;
	var target=evt.target||evt.srcTarget;
	checkspan_set(target);
	fdjtUI.cancel(evt);
	return false;}
    fdjtUI.CheckSpan.onclick=checkspan_onclick;    
    })();

(function(){

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;

    function show_help_onfocus(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') ||
		 (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('helptext'))) {
		var helptext=fdjtID(target.getAttribute('helptext'));
		if (helptext) fdjtDOM.addClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onfocus(evt){
	evt=evt||event||null;
	var elt=fdjtDOM.T(evt);
	if ((elt) && (hasClass(elt,'isempty'))) {
	    elt.value=''; dropClass(elt,'isempty');}
	show_help_onfocus(evt);}

    function hide_help_onblur(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('HELPTEXT'))) {
		var helptext=fdjtID(target.getAttribute('HELPTEXT'));
		if (helptext) dropClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onblur(evt){
	var elt=fdjtDOM.T(evt);
	if (elt.value==='') {
	    addClass(elt,'isempty');
	    var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
	    if (prompt) elt.value=prompt;}
	else dropClass(elt,'isempty');
	hide_help_onblur(evt);}
    
    // Removes autoprompt text from empty fields
    function autoprompt_cleanup(form) {
	var elements=fdjtDOM.getChildren(form,".isempty");
	if (elements) {
	    var i=0; var lim=elements.length;
	    while (i<elements.length) elements[i++].value="";}}
    function autoprompt_onsubmit(evt) {
	var form=fdjtDOM.T(evt);
	autoprompt_cleanup(form);}

    var isEmpty=fdjtString.isEmpty;
    // Adds autoprompt handlers to autoprompt classes
    function autoprompt_setup(arg,nohandlers) {
	var forms=
	    ((arg.tagName==="FORM")?[arg]:
	     (fdjtDOM.getChildren(arg||document.body,"FORM")));
	var i=0; var lim=forms.length;
	while (i<lim) {
	    var form=forms[i++];
	    var inputs=fdjtDOM.getChildren
	    (form,"INPUT.autoprompt,TEXTAREA.autoprompt");
	    if (inputs.length) {
		var j=0; var jlim=inputs.length;
		while (j<jlim) {
		    var input=inputs[j++];
		    input.blur();
		    if (isEmpty(input.value)) {
			addClass(input,"isempty");
			var prompt=(input.prompt)||
			    (input.getAttribute('prompt'))||(input.title);
			if (prompt) input.value=prompt;}
		    if (!(nohandlers)) {
			fdjtDOM.addListener(input,"focus",autoprompt_onfocus);
			fdjtDOM.addListener(input,"blur",autoprompt_onblur);}}
		if (!(nohandlers))
		    fdjtDOM.addListener(form,"submit",autoprompt_onsubmit);}}}
    
    fdjtUI.AutoPrompt.setup=autoprompt_setup;
    fdjtUI.AutoPrompt.onfocus=autoprompt_onfocus;
    fdjtUI.AutoPrompt.onblur=autoprompt_onblur;
    fdjtUI.AutoPrompt.onsubmit=autoprompt_onsubmit;
    fdjtUI.AutoPrompt.cleanup=autoprompt_cleanup;
    fdjtUI.InputHelp.onfocus=show_help_onfocus;
    fdjtUI.InputHelp.onblur=hide_help_onblur;})();


(function(){
  function multitext_keypress(evt,sepch){
	evt=(evt)||(event);
	var ch=evt.charCode;
	var target=fdjtUI.T(evt);
	if (typeof sepch === 'string') sepch=sepch.charCodeAt(0);
	if ((ch!==13)&&(sepch)&&(sepch!=ch)) return;
	fdjtUI.cancel(evt);
	var checkbox=
	    fdjtDOM.Input("[type=checkbox]",target.name,target.value);
	var div=fdjtDOM("div.checkspan",checkbox,target.value);
	checkbox.checked=true;
	fdjtDOM(target.parentNode,div);
	target.value='';}
    fdjtUI.MultiText.keypress=multitext_keypress;})();

(function(){
    var serial=0;

    /* Constants */
    // Always set to distinguish no options from false
    var FDJT_COMPLETE_OPTIONS=1;
    // Whether the completion element is a cloud (made of spans)
    var FDJT_COMPLETE_CLOUD=2;
    // Whether to require that completion match an initial segment
    var FDJT_COMPLETE_ANYWORD=4;
    // Whether to match case in keys to completions
    var FDJT_COMPLETE_MATCHCASE=8;
    // Whether to an enter character always picks a completion
    var FDJT_COMPLETE_EAGER=16;
    // Whether the key fields may contain disjoins (e.g. (dog|friend))
    // to be accomodated in matching
    var FDJT_COMPLETE_DISJOINS=32;
    // Default options
    var default_options=FDJT_COMPLETE_OPTIONS;
    // Max number of completions to show
    var maxcomplete=50;
    // Milliseconds to wait for auto complete
    var complete_delay=100;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getChildren=fdjtDOM.getChildren;
    var getParent=fdjtDOM.getParent;
    var position=fdjtKB.position;

    var isEmpty=fdjtString.isEmpty;
    var hasPrefix=fdjtString.hasPrefix;
    var prefixAdd=fdjtString.prefixAdd;
    var prefixFind=fdjtString.prefixFind;
    var commonPrefix=fdjtString.commonPrefix;

    fdjtUI.FDJT_COMPLETE_OPTIONS=FDJT_COMPLETE_OPTIONS;
    fdjtUI.FDJT_COMPLETE_CLOUD=FDJT_COMPLETE_CLOUD;
    fdjtUI.FDJT_COMPLETE_ANYWORD=FDJT_COMPLETE_ANYWORD;
    fdjtUI.FDJT_COMPLETE_MATCHCASE=FDJT_COMPLETE_MATCHCASE;
    fdjtUI.FDJT_COMPLETE_EAGER=FDJT_COMPLETE_EAGER;

    function Completions(dom,input,options) {
	this.dom=dom||false; this.input=input||false;
	this.options=options||default_options;
	this.nodes=[]; this.values=[]; this.serial=++serial;
	this.cues=[]; this.displayed=[];
	this.prefixtree={strings: []};
	this.bykey={}; this.byvalue=new fdjtKB.Map();
	if (!(options&FDJT_COMPLETE_MATCHCASE)) this.stringmap={};
	this.initialized=false;
	return this;}
    Completions.probe=function(arg){
	if (arg.tagName==='INPUT') {
	    var cid=arg.getAttribute('COMPLETIONS');
	    arg=fdjtID(cid);
	    if (arg) completions.get(arg);
	    else return false;}
	else return completions.get(arg);};

    function getKey(node){
	return node.key||(node.getAttribute("key"))||(node.value)||
	    (node.getAttribute("value"))||
	    ((hasClass(node,"variation"))&&(fdjtDOM.textify(node)))||
	    ((hasClass(node,"completion"))&&(completionText(node,"")));}
    Completions.getKey=getKey;
    function completionText(node,sofar){
	if (hasClass(node,"variation")) return sofar;
	else if (node.nodeType===3) return sofar+node.nodeValue;
	else if ((node.nodeType===1)&&(node.childNodes)) {
	    var children=node.childNodes;
	    var i=0; var lim=children.length;
	    while (i<lim) {
		var child=children[i++];
		if (child.nodeType===3) sofar=sofar+child.nodeValue;
		else if (child.nodeType===1)
		    sofar=completionText(child,sofar);
		else {}}
	    return sofar;}
	else return sofar;}

    function getValue(node){
	if (!(hasClass(node,"completions")))
	    node=getParent(node,".completions");
	var completions=((node)&&(Completions.probe(node)));
	if (completions)
	    return completions.getValue(node);
	else return false;}
    Completions.getValue=getValue;

    function addNodeKey(node,keystring,ptree,bykey,anywhere){
	var keys=((anywhere)?(keystring.split(/\W/g)):[]).concat(keystring);
	var i=0; var lim=keys.length;
	while (i<lim) {
	    var key=keys[i++];
	    prefixAdd(ptree,key,0);
	    if ((bykey[key])&&(bykey.hasOwnProperty(key)))
		bykey[key].push(node);
	    else bykey[key]=new Array(node);
	    bykey._count++;}}

    function getNodes(string,ptree,bykey,matchcase){
	var result=[]; var direct=[]; var variations=[];
	var keystring=stdspace(string);
	if (isEmpty(keystring)) return [];
	if (!(matchcase)) keystring=string.toLowerCase();
	var strings=prefixFind(ptree,keystring,0);
	var prefix=false;
	var exact=[]; var exactheads=[]; var keys=[];
	var i=0; var lim=strings.length;
	while (i<lim) {
	    var string=strings[i++];
	    var isexact=(string===keystring);
	    if (prefix) prefix=commonPrefix(prefix,string);
	    else prefix=string;
	    var completions=bykey[string];
	    if (completions) {
		var j=0; var jlim=completions.length;
		while (j<jlim) {
		    var c=completions[j++];
		    if (hasClass(c,"completion")) {
			if (isexact) {exactheads.push(c); exact.push(c);}
			result.push(c); keys.push(string); direct.push(c);}
		    else {
			var head=getParent(c,".completion");
			if (head) {
			    if (isexact) exact.push(head);
			    result.push(head); keys.push(string);
			    variations.push(c);}}}}}
	if (exact.length) result.exact=exact;
	if (exactheads.length) result.exactheads=exactheads;
	result.prefix=prefix;
	result.strings=strings;
	result.matches=direct.concat(variations);
	return result;}

    function addCompletion(c,completion,key,value) {
	if (!(key)) key=completion.key||getKey(completion);
	if (!(value))
	    value=(completion.value)||(completion.getAttribute('value'))||key;
	var pos=position(c.nodes,completion);
	if (pos<0) {
	    c.nodes.push(completion); c.values.push(value);
	    c.byvalue.add(value,completion);}
	else return;
	var opts=c.options;
	var container=c.dom;
	var ptree=c.prefixtree;
	var bykey=c.bykey;
	var smap=c.stringmap;
	var stdkey=stdspace(key);
	var matchcase=(opts&FDJT_COMPLETE_MATCHCASE);
	var anyword=(opts&FDJT_COMPLETE_ANYWORD);
	if (!(matchcase)) {
	    var lower=stdkey.toLowerCase();
	    smap[lower]=stdkey;
	    stdkey=lower;}
	if (!(getParent(completion,container)))
	    fdjtDOM.append(container,completion," ");
	addNodeKey(completion,stdkey,ptree,bykey,anyword);
	if (hasClass(completion,"cue")) c.cues.push(completion);
	var variations=getChildren(completion,".variation");
	var i=0; var lim=variations.length;
	while (i<lim) {
	    var variation=variations[i++];
	    var vkey=stdspace(variation.key||getKey(variation));
	    addNodeKey(variation,vkey,ptree,bykey,anyword);}}

    function initCompletions(c){
	var completions=getChildren(c.dom,".completion");
	var i=0; var lim=completions.length;
	while (i<lim) addCompletion(c,completions[i++]);
	c.initialized=true;}

    Completions.prototype.addCompletion=function(completion) {
	if (!(this.initialized)) initCompletions(this);
	addCompletion(this,completion);};

    function updateDisplay(c,todisplay){
	var displayed=c.displayed;
	if (displayed) {
	    var i=0; var lim=displayed.length;
	    while (i<lim) dropClass(displayed[i++],"displayed");
	    c.displayed=displayed=[];}
	else c.displayed=displayed=[];
	if (todisplay) {
	    var i=0; var lim=todisplay.length;
	    while (i<lim) {
		var node=todisplay[i++];
		if (hasClass(node,"completion")) {
		    addClass(node,"displayed");
		    displayed.push(node);}
		else {
		    var head=getParent(node,".completion");
		    if ((head)&&(!(hasClass(head,"displayed")))) {
			displayed.push(node); displayed.push(head);
			addClass(head,"displayed");
			addClass(node,"displayed");}}}}}


    Completions.prototype.getCompletions=function(string) {
	if ((string===this.curstring)||(string===this.maxstring)||
	    ((this.curstring)&&(this.maxstring)&&
	     (hasPrefix(string,this.curstring))&&
	     (hasPrefix(this.maxstring,string))))
	    return this.result;
	else {
	    var result;
	    if (!(this.initialized)) initCompletions(this);
	    if (isEmpty(string)) {
		result=[]; result.prefix=""; result.matches=[];
		if (this.dom) addClass(this.dom,"noinput");}
	    else {
		result=getNodes(string,this.prefixtree,this.bykey);
		if (this.dom) dropClass(this.dom,"noinput");
		updateDisplay(this,result.matches);}
	    if ((this.stringmap)&&(this.strings)) {
		var stringmap=this.stringmap;
		var strings=this.strings;
		var i=0; var lim=strings.length;
		while (i<lim) {
		    var s=strings[i]; var m=stringmap[s];
		    if (m) strings[i++]=m;
		    else i++;}}
	    this.curstring=string;
	    this.maxstring=result.prefix||string;
	    this.result=result;
	    return result;}};

    Completions.prototype.getValue=function(completion) {
	if (completion.value) return completion.value;
	else if (completion.getAttribute("value"))
	    return completion.getAttribute("value");
	var pos=position(this.nodes,completion);
	if (pos<0) return false;
	else return this.values[pos];};
    Completions.prototype.getKey=function(completion) {
	if (completion.key) return completion.value;
	else if (completion.getAttribute("key"))
	    return completion.getAttribute("key");
	var pos=position(this.nodes,completion);
	if (pos<0) return false;
	else return this.values[pos];};

    Completions.prototype.complete=function(string){
	if (!(this.initialized)) initCompletions(this);
	// fdjtLog("Completing on %o",string);
	if ((!(string))&&(string!==""))
	    string=((this.getText)?(this.getText(this.input)):
		    (hasClass(this.input,"isempty"))?(""):
		    (this.input.value));
	if (isEmpty(string)) {
	    if (this.displayed) updateDisplay(this,false);
	    addClass(this.dom,"noinput");
	    dropClass(this.dom,"noresults");
	    return [];}
	var result=this.getCompletions(string);
	if ((!(result))||(result.length===0)) {
	    updateDisplay(this,false);
	    dropClass(this.dom,"noinput");
	    addClass(this.dom,"noresults");
	    return [];}
	else {
	    updateDisplay(this,result.matches);
	    dropClass(this.dom,"noinput");
	    dropClass(this.dom,"noresults");}
	return result;};

    Completions.prototype.getByValue=function(values,spec){
	if (!(this.initialized)) initCompletions(this);
	var result=[];
	var byvalue=this.byvalue;
	if (spec) spec=new fdjtDOM.Selector(spec);
	if (!(values instanceof Array)) values=[values];
	var i=0; var lim=values.length;
	while (i<lim) {
	    var value=values[i++];
	    var completions=byvalue.get(value);
	    if (completions) {
		if (spec) {
		    var j=0; var jlim=completions.length;
		    while (j<jlim) {
			if (spec.match(completions[j]))
			    result.push(completions[j++]);
			else j++;}}
		else result=result.concat(completions);}}
	return result;};
    Completions.prototype.getByKey=function(keys,spec){
	if (!(this.initialized)) initCompletions(this);
	var result=[];
	var byvalue=this.bykey;
	if (spec) spec=new fdjtDOM.Selector(spec);
	if (!(keys instanceof Array)) keys=[keys];
	var i=0; var lim=keys.length;
	while (i<lim) {
	    var key=keys[i++];
	    var completions=bykey.get(key);
	    if (completions) {
		if (spec) {
		    var j=0; var jlim=completions.length;
		    while (j<jlim) {
			if (spec.match(completions[j]))
			    result.push(completions[j++]);
			else j++;}}
		else result=result.concat(completions);}}
	return result;};

    Completions.prototype.setCues=function(values){
	if (!(this.initialized)) initCompletions(this);
	var cues=[];
	var byvalue=this.byvalue;
	var i=0; var lim=values.length;
	while (i<lim) {
	    var value=values[i++];
	    var completions=byvalue.get(value);
	    if (completions) {
		var j=0; var jlim=completions.length;
		while (j<jlim) {
		    var c=completions[j++];
		    if (hasClass(c,"cue")) continue;
		    addClass(c,"cue");
		    cues.push(c);}}}
	return cues;};
    
    Completions.prototype.docomplete=function(input,callback){
	if (!(this.initialized)) initCompletions(this);
	if (!(input)) input=this.input;
	var delay=this.complete_delay||complete_delay;
	var that=this;
	if (this.timer) {
	    clearTimeout(that.timer);
	    that.timer=false;}
	this.timer=setTimeout(
	    function(){
		if (!(input)) input=that.input;
		var completions=that.complete(input.value);
		if (callback) callback(completions);},
	    delay);}

    function stdspace(string){
	return string.replace(/\s+/," ").replace(/(^\s)|(\s$)/,"");}

    fdjtUI.Completions=Completions;

    var cached_completions={};

    var default_options=
	FDJT_COMPLETE_OPTIONS|
	FDJT_COMPLETE_CLOUD|
	FDJT_COMPLETE_ANYWORD;

    function onkey(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	var name=target.name;
	var completions=cached_completions[name];
	var compid=fdjtDOM.getAttrib(target,"completions");
	var dom=((compid)&&(fdjtID(compid)));
	if (!(dom)) return;
	if (!((completions)&&(completions.dom===dom))) {
	    completions=new Completions(dom,target,default_options);
	    cached_completions[name]=completions;}
	if (!(completions)) return;
	completions.docomplete();}
    fdjtUI.Completions.onkey=onkey;}());

/* Tabs */

(function(){
    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    
    function tab_onclick(evt,shownclass){
	var elt=fdjtUI.T(evt);
	if (!(shownclass)) {
	    shownclass=
		fdjtDOM.findAttrib(elt,"shownclass","http://fdjt.org/")||
		"fdjtshown";}
	if (elt) {
	    var content_id=false;
	    while (elt.parentNode) {
		if (content_id=fdjtDOM.getAttrib(elt,"contentid")) break;
		else elt=elt.parentNode;}
	    if (!(content_id)) return;
	    var content=document.getElementById(content_id);
	    var parent=fdjtDOM.getParent(elt,".tabs")||elt.parentNode;
	    var sibs=fdjtDOM.getChildren(parent,".tab")||parent.childNodes;
	    if (content===null) {
		fdjtLog("No content for "+content_id);
		return;}
	    var i=0; while (i<sibs.length) {
		var node=sibs[i++]; var cid;
		if ((node.nodeType===1) &&
		    (cid=fdjtDOM.getAttrib(node,"contentid"))) {
		    if (!(cid)) continue;
		    var cdoc=document.getElementById(cid);
		    if (node===elt) {}
		    else if (hasClass(node,shownclass)) {
			dropClass(node,shownclass);
			if (cdoc) dropClass(cdoc,shownclass);}}}
	    if (hasClass(elt,shownclass)) {
		dropClass(elt,shownclass);
		dropClass(content,shownclass);}
	    else {
		addClass(elt,shownclass);
		addClass(content,shownclass);}
	    var tabstate=fdjtDOM.findAttrib(elt,'tabstate');
	    if (!(tabstate)) {}
	    else if (tabstate==='#') {
		var scrollstate={};
		fdjtUI.scrollSave(scrollstate);
		document.location.hash=tabstate+content_id;
		fdjtUI.scrollRestore(scrollstate);}
	    else fdjtState.setCookie(tabstate,content_id);
	    // This lets forms pass tab information along
	    return false;}}
    fdjtUI.Tabs.click=tab_onclick;
    
    function select_tab(tabbar,contentid,shownclass){
	if (!(shownclass)) {
	    shownclass=
		fdjtDOM.findAttrib(tabbar,"shownclass","http://fdjt.org/")||
		"fdjtshown";}
	var tabseen=false;
	var tabs=fdjtDOM.getChildren(tabbar,".tab");
	var i=0; while (i<tabs.length) {
	    var tab=tabs[i++];
	    if ((tab.getAttribute("contentid"))===contentid) {
		addClass(tab,shownclass); tabseen=true;}
	    else if (hasClass(tab,shownclass)) {
		dropClass(tab,shownclass);
		var cid=fdjtDOM.getAttrib(tab,"contentid");
		var content=(cid)&&fdjtID(cid);
		if (!(content))
		    fdjtWarn("No reference for tab content %o",cid);
		else dropClass(content,shownclass);}
	    else dropClass(tab,shownclass);}
	if (fdjtID(contentid)) {
	    if (tabseen) addClass(contentid,shownclass);
	    else fdjtLog.warn("a tab for %s was not found in %o",
			      contentid,tabbar);}
	else fdjtLog.warn("No reference for tab content %o",contentid);}
    fdjtUI.Tabs.selectTab=select_tab;
    
    function setupTabs(elt){
	if (!(elt)) elt=fdjtDOM.$(".tabs[tabstate]");
	else if (typeof elt === 'string') elt=fdjtID(elt);
	if ((!(elt))||(!(elt.getAttribute("tabstate")))) return;
	var tabstate=elt.getAttribute("tabstate");
	var content_id=false;
	if (tabstate==='#') {
	    content_id=document.location.hash;
	    if (content_id[0]==='#') content_id=content_id.slice(1);
	    var content=((content_id)&&(fdjtID(content_id)));
	    if (!(content)) return;
	    var ss={}; fdjtUI.scrollSave(ss);
	    window.scrollTo(0,0);
	    if (!(fdjtDOM.isVisible(content)))
		fdjtUI.scrollRestore(ss);}
	else content_id=fdjtState.getQuery(tabstate)||
	    fdjtState.getCookie(tabstate);
	if (!(content_id)) return;
	if (content_id[0]==='#') content_id=content_id.slice(1);
	if (content_id) select_tab(elt,content_id);}
    fdjtUI.Tabs.setup=setupTabs;
    
    function selected_tab(tabbar){
	var tabs=fdjtDOM.getChildren(tabbar,".tab");
	var i=0; while (i<tabs.length) {
	    var tab=tabs[i++];
	    if (hasClass(tag,"shown"))
		return tag.getAttribute("contentid");}
	return false;}
    fdjtUI.Tabs.getSelected=selected_tab;}());


/* Delays */

(function(){
    var timeouts={};
    
    fdjtUI.Delay=function(interval,name,fcn){
	window.setTimeout(fcn,interval);};}());

/* Expansion */

fdjtUI.Expansion.toggle=function(evt,spec,exspec){
  evt=evt||event;
    var target=fdjtUI.T(evt);
    var wrapper=fdjtDOM.getParent(target,spec||".fdjtexpands");
    if (wrapper) fdjtDOM.toggleClass(wrapper,exspec||"fdjtexpanded");};
fdjtUI.Expansion.onclick=fdjtUI.Expansion.toggle;

fdjtUI.Collapsible.click=function(evt){
  evt=evt||event;
  var target=fdjtUI.T(evt);
  if (fdjtUI.isDefaultClickable(target)) return;
  var wrapper=fdjtDOM.getParent(target,".collapsible");
  if (wrapper) {
    fdjtUI.cancel(evt);
    fdjtDOM.toggleClass(wrapper,"expanded");};};

fdjtUI.Collapsible.focus=function(evt){
  evt=evt||event;
  var target=fdjtUI.T(evt);
  var wrapper=fdjtDOM.getParent(target,".collapsible");
  if (wrapper) {
    fdjtDOM.toggleClass(wrapper,"expanded");};};

/* Temporary Scrolling */

(function(){
    var saved_scroll=false;
    var use_native_scroll=false;
    var preview_elt=false;

    function scroll_discard(ss){
	if (ss) {
	    ss.scrollX=false; ss.scrollY=false;}
	else saved_scroll=false;}

    function scroll_save(ss){
	if (ss) {
	    ss.scrollX=window.scrollX; ss.scrollY=window.scrollY;}
	else {
	    if (!(saved_scroll)) saved_scroll={};
	    saved_scroll.scrollX=window.scrollX;
	    saved_scroll.scrollY=window.scrollY;}}
    
    function scroll_offset(wleft,eleft,eright,wright){
	var result;
	if ((eleft>wleft) && (eright<wright)) return wleft;
	else if ((eright-eleft)<(wright-wleft)) 
	    return eleft-Math.floor(((wright-wleft)-(eright-eleft))/2);
	else return eleft;}

    function scroll_into_view(elt,topedge){
	if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt)))
	    return;
	else if ((use_native_scroll) && (elt.scrollIntoView)) {
	    elt.scrollIntoView(top);
	    if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt,true)))
		return;}
	else {
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
	    
	    var targetx=scroll_offset(winx,left,left+width,winxedge);
	    var targety=
		(((topedge)||(topedge===0)) ?
		 ((typeof topedge === "number") ? (top+topedge) : (top)) :
		 (scroll_offset(winy,top,top+height,winyedge)));
	    
	    var vh=fdjtDOM.viewHeight();
	    var x=0; var y;
	    var y_target=top+(height/3);
	    if ((2*(height/3))<((vh/2)-50))
		y=y_target-vh/2;
	    else if ((height)<(vh-100))
		y=top-(50+(height/2));
	    else y=top-50;

	    window.scrollTo(x,y);}}

    fdjtUI.scrollTo=function(target,id,context,discard,topedge){
	scroll_discard(discard);
	if (id) document.location.hash=id;
	if (context) {
	    setTimeout(function() {
		scroll_into_view(context,topedge);
		if (!(fdjtDOM.isVisible(target))) {
		    scroll_into_view(target,topedge);}},
		       100);}
	else setTimeout(function() {scroll_into_view(target,topedge);},100);};

    function scroll_preview(target,context,delta){
	/* Stop the current preview */
	if (!(target)) {
	    stop_preview(); return;}
	/* Already previewing */
	if (target===preview_elt) return;
	if (!(saved_scroll)) scroll_save();
	if (typeof target === 'number')
	    window.scrollTo(((typeof context === 'number')&&(context))||0,target);
	else scroll_into_view(target,delta);
	preview_elt=target;}

    function scroll_restore(ss){
	if (preview_elt) {
	    preview_elt=false;}
	if ((ss) && (typeof ss.scrollX === "number")) {
	    // fdjtLog("Restoring scroll to %d,%d",ss.scrollX,ss.scrollY);    
	    window.scrollTo(ss.scrollX,ss.scrollY);
	    return true;}
	else if ((saved_scroll) &&
		 ((typeof saved_scroll.scrollY === "number") ||
		  (typeof saved_scroll.scrollX === "number"))) {
	    // fdjtLog("Restoring scroll to %o",_fdjt_saved_scroll);
	    window.scrollTo(saved_scroll.scrollX,saved_scroll.scrollY);
	    saved_scroll=false;
	    return true;}
	else return false;}

    function stop_preview(){
	fdjtDOM.dropClass(document.body,"preview");
	if ((preview_elt) && (preview_elt.className))
	    fdjtDOM.dropClass(preview_elt,"previewing");
	preview_elt=false;}

    fdjtUI.scrollSave=scroll_save;
    fdjtUI.scrollRestore=scroll_restore;
    fdjtUI.scrollIntoView=scroll_into_view;
    fdjtUI.scrollPreview=scroll_preview;
    fdjtUI.scrollRestore=scroll_restore;}());

(function(){
    function dosubmit(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	var form=fdjtDOM.getParent(target,"FORM");
	var submit_event = document.createEvent("HTMLEvents");
	submit_event.initEvent('submit',false,true);
	form.dispatchEvent(submit_event);
	form.submit();}
    fdjtUI.dosubmit=dosubmit;}());

(function(){
    var hasClass=fdjtDOM.hasClass;
    
    fdjtUI.T=function(evt) {
	evt=evt||event; return (evt.target)||(evt.srcElement);};

    fdjtUI.nodefault=function(evt){
	evt=evt||event;
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	return false;};

    fdjtUI.isClickable=function(target){
	if (target instanceof Event) target=fdjtUI.T(target);
	while (target) {
	    if (((target.tagName==='A')&&(target.href))||
		(target.tagName==="INPUT") ||
		(target.tagName==="TEXTAREA") ||
		(target.tagName==="SELECT") ||
		(target.tagName==="OPTION") ||
		(hasClass(target,"isclickable")))
		return true;
	    else if (target.onclick)
	      return true;
	    else target=target.parentNode;}
	return false;};

    fdjtUI.isDefaultClickable=function(target){
	if (target instanceof Event) target=fdjtUI.T(target);
	while (target) {
	    if (((target.tagName==='A')&&(target.href))||
		(target.tagName==="INPUT") ||
		(target.tagName==="TEXTAREA") ||
		(target.tagName==="SELECT") ||
		(target.tagName==="OPTION") ||
		(hasClass(target,"isclickable")))
		return true;
	    else target=target.parentNode;}
	return false;};

    fdjtUI.cancel=function(evt){
	evt=evt||event;
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;
	return false;};
    fdjtUI.nobubble=function(evt){
	evt=evt||event;
	evt.cancelBubble=true;};

}());

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
