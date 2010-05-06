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

var fdjtUI=
  {CoHi: {classname: "cohi"},CheckSpan: {},
   AutoPrompt: {}, InputHelp: {}};

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
  function checkspan_onclick(evt) {
    evt=evt||event;
    target=evt.target||evt.srcTarget;
    var checkspan=fdjtDOM.getParent(target,"checkspan");
    if ((target.tagName==='INPUT')&&(target.type=='checkbox')) {
      target.blur();
      if (target.checked) fdjtDOM.addClass(checkspan,"checked");
      else fdjtDOM.dropClass(checkspan,"checked");}
    else {
      var inputs=fdjtDOM.filterChildren
	(checkspan,function(evt){
	  return (evt.tagName==='INPUT')&&(evt.type==='checkbox');});
      var input=((inputs)&&(inputs.length)&&(inputs[0]));
      if (input) 
	if (input.checked) {
	  fdjtDOM.dropClass(checkspan,"checked");
	  input.checked=false; input.blur();}
	else {
	  fdjtDOM.addClass(checkspan,"checked");
	  input.checked=true; input.blur();}
      else fdjtDOM.toggleClass(checkspan,"checked");}}
  fdjtUI.CheckSpan.onclick=checkspan_onclick;

  function checkspan_set(checkspan,checked){
    var inputs=fdjtDOM.filterChildren
      (checkspan,function(evt){
	return (evt.tagName==='INPUT')&&(evt.type==='checkbox');});
    var input=((inputs)&&(inputs.length)&&(inputs[0]));
    if (checked) {
      input.checked=true; fdjtDOM.addClass(checkspan,"ischecked");}
    else {
      input.checked=false; fdjtDOM.dropClass(checkspan,"ischecked");}}
  fdjtUI.CheckSpan.set=checkspan_set;})();

(function(){

  function show_help_onfocus(evt){
    var target=fdjtDOM.T(evt);
    while (target)
      if ((target.nodeType==1) &&
	  ((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	  (target.getAttribute('HELPTEXT'))) {
	var helptext=fdjtID(target.getAttribute('HELPTEXT'));
	if (helptext) fdjtDOM.addClass(helptext,"showhelp");
	return;}
      else target=target.parentNode;}
  function autoprompt_onfocus(evt){
    evt=evt||event||null;
    var elt=fdjtDOM.T(evt);
    if ((elt) && (fdjtHasClass(elt,'isempty'))) {
      elt.value='';
      fdjtDOM.dropClass(elt,'isempty');}
    show_help_onfocus(evt);}

  function hide_help_onblur(evt){
    var target=fdjtDOM.T(evt);
    while (target)
      if ((target.nodeType==1) &&
	  ((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
	  (target.getAttribute('HELPTEXT'))) {
	var helptext=fdjtID(target.getAttribute('HELPTEXT'));
	if (helptext) fdjtDOM.dropClass(helptext,"showhelp");
	return;}
      else target=target.parentNode;}
  function autoprompt_onblur(evt){
    var elt=fdjtDOM.T(evt);
    if (elt.value==='') {
      fdjtDOM.addClass(elt,'isempty');
      var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
      if (prompt) elt.value=prompt;}
    else fdjtDOM.dropClass(elt,'isempty');
    hide_help_onblur(evt);}
  
  // Removes autoprompt text from empty fields
  function autoprompt_onsubmit(arg) {
    var form=((arg.tagName==='FORM')?(arg):(fdjtDOM.T(arg||event)));
    var elements=fdjtDOM.getChildren("isempty");
    if (elements) {
      var i=0; var lim=elements.length;
      while (i<elements.length) elements[i++].value="";}}

  // Adds autoprompt handlers to autoprompt classes
  function autoprompt_setup(arg) {
    var forms=fdjtDOM.$("FORM");
    var i=0; var lim=forms.length;
    while (i<lim) {
      var form=forms[i++];
      var inputs=fdjtDOM.getChildren(form,"INPUT.autoprompt");
      if (inputs.length) {
	var j=0; var jlim=inputs.length;
	while (j<jlim) {
	  var input=inputs[j++];
	  input.addEventListener("focus",autoprompt_onfocus);
	  input.addEventListener("blur",autoprompt_onblur);}
	form.addEventListener("submit",autoprompt_onsubmit);}}}
  
  fdjtUI.AutoPrompt.onfocus=autoprompt_onfocus;
  fdjtUI.AutoPrompt.onblur=autoprompt_onblur;
  fdjtUI.AutoPrompt.onsubmit=autoprompt_onblur;
  fdjtUI.InputHelp.onfocus=show_help_onfocus;
  fdjtUI.InputHelp.onblur=hide_help_onblur;})();


(function(){
  var completions=new fdjtKB.Map();

  var serial=0;

  function Completions(container,input,options) {
    if (completions.get(container))
      return (completions.get(container));
    else completions.set(container,this);
    this.container=container||false; this.input=input;
    this.options=options||default_options;
    this.nodes=[]; this.values=[]; this.serial=++serial;
    this.cues=[]; this.displayed=[];
    this.prefixtree={strings: []};
    this.bykey={}; this.byvalue=new fdjtKB.Map();
    if (!(options&FDJT_COMPLETE_MATCHCASE)) this.stringmap={};
    this.initialized=false;
    return this;}
  Completions.probe=function(container){return (completions.get(container));};

  function getKey(node){
    return node.key||(node.getAttribute("key"))||(node.value)||
      (node.getAttribute("value"))||
      ((fdjtDOM.hasClass(node,"variation"))&&(fdjtDOM.textify(node)))||
      ((fdjtDOM.hasClass(node,"completion"))&&(completionText(node,"")));}
  Completions.getKey=getKey;
  function completionText(node,sofar){
    if (fdjtDOM.hasClass(node,"variation")) return sofar;
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
    if (!(fdjtDOM.hasClass(node,"completions")))
      node=fdjtDOM.getParent(node,".completions");
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
      fdjtString.prefixAdd(ptree,key,0);
      if ((bykey[key])&&(bykey.hasOwnProperty(key)))
	bykey[key].push(node);
      else bykey[key]=new Array(node);
      bykey._count++;}}

  function getNodes(string,ptree,bykey,matchcase){
    var result=[]; var direct=[]; var variations=[];
    var keystring=stdspace(string);
    if (fdjtString.isEmpty(keystring)) return [];
    if (!(matchcase)) keystring=string.toLowerCase();
    var strings=fdjtString.prefixFind(ptree,keystring,0);
    var prefix=false;
    var i=0; var lim=strings.length;
    while (i<lim) {
      var string=strings[i++];
      if (prefix) prefix=fdjtString.commonPrefix(prefix,string);
      else prefix=string;
      var completions=bykey[string];
      if (completions) {
	var j=0; var jlim=completions.length;
	while (j<jlim) {
	  var c=completions[j++];
	  if (fdjtDOM.hasClass(c,"completion")) {
	    result.push(c); direct.push(c);}
	  else {
	    var head=fdjtDOM.getParent(variation,".completion");
	    result.push(head); variations.push(c);}}}}
    result.prefix=prefix;
    result.matches=direct.concat(variations);
    return result;}

  function addCompletion(c,completion,key,value) {
    if (!(key)) key=completion.key||getKey(completion);
    if (!(value))
      value=(completion.value)||(completion.getAttribute('value'))||key;
    var pos=fdjtKB.position(c.nodes,completion);
    if (pos<0) {
      c.nodes.push(completion); c.values.push(value);}
    else return;
    var opts=c.options;
    var container=c.container;
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
    if (!(fdjtDOM.hasParent(completion,container)))
      fdjtDOM.append(container,completion);
    addNodeKey(completion,stdkey,ptree,bykey,anyword);
    if (fdjtDOM.hasClass(completion,"cue")) c.cues.push(completion);
    var variations=fdjtDOM.getChildren(completion,".variation");
    var i=0; var lim=variations.length;
    while (i<lim) {
      var variation=variations[i++];
      var vkey=stdspace(variation.key||getKey(variation));
      addNodeKey(variation,vkey,ptree,bykey,anyword);}}

  function initCompletions(c){
    var completions=fdjtDOM.getChildren(c.container,".completion");
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
      while (i<lim) fdjtDOM.dropClass(displayed[i++],"displayed");
      c.displayed=displayed=[];}
    if (todisplay) {
      c.displayed=todisplay;
      var i=0; var lim=todisplay.length;
      while (i<lim) {
	var node=todisplay[i++];
	if (fdjtDOM.hasClass(node,"completion")) 
	  fdjtDOM.addClass(node,"displayed");
	else {
	  var head=fdjtDOM.getParent(node,".completion");
	  if ((head)&&(!(fdjtDOM.hasClass(head,"displayed")))) {
	    fdjtDOM.addClass(head,"displayed");
	    fdjtDOM.addClass(node,"displayed");}}}}}


  Completions.prototype.getCompletions=function(string) {
    if ((string===this.curstring)||(string===this.maxstring)||
	((this.curstring)&&(this.maxstring)&&
	 (fdjtString.hasPrefix(string,this.curstring))&&
	 (fdjtString.hasPrefix(this.maxstring,string))))
      return this.result;
    else {
      if (!(this.initialized)) initCompletions(this);
      var result=getNodes(string,this.prefixtree,this.bykey);
      updateDisplay(this,result.matches);
      this.curstring=string;
      this.maxstring=result.prefix||string;
      this.result=result;
      return result;}};

  Completions.prototype.getValue=function(completion) {
    if (completion.value) return completion.value;
    else if (completion.getAttribute("value"))
      return completion.getAttribute("value");
    var pos=fdjtKB.position(this.nodes,completion);
    if (pos<0) return false;
    else return this.values[pos];};

  Completions.prototype.oncomplete=function(completion){
    var value=this.getValue(completion);
    if (this.container.oncomplete)
      this.container.oncomplete(completion,value);
    else if (this.input.oncomplete)
      this.input.oncomplete(completion,value);
    else fdjtLog("Completion=%o, value=%o",completion,value);};

  Completions.prototype.complete=function(string){
    if (!(string))
      string=((this.getText)?(this.getText(this.input)):(this.input.value));
    if (fdjtString.isEmpty(string)) {
      if (this.displayed) updateDisplay(this,false);
      fdjtDOM.addClass(this.container,"noinput");
      return [];}
    var result=this.getCompletions(string);
    if ((!(result))||(result.length===0)) {
      updateDisplay(this,false);
      fdjtDOM.dropClass(this.container,"noinput");
      fdjtDOM.addClass(this.container,"noresults");
      return [];}
    else {
      updateDisplay(this,result.matches);
      fdjtDOM.dropClass(this.container,"noinput");
      fdjtDOM.dropClass(this.container,"noresults");}
    return result;};

  Completions.prototype.action=function(action){
      var result=this.complete();
      if (action==="enter")
	if (result.length>0)
	  this.oncomplete(result[0],this.getValue(result[0]));
	else {}
      else if (action==="complete")
	if (this.setInput)
	  this.setInput(this.input,result.prefix);
	else this.input.value=result.prefix;
      else {}
      return result;};
    
  Completions.prototype.enter=function(string){
    if (!(string))
      string=((this.getText)?(this.getText(this.input)):(this.input.value));
    if (fdjtString.isEmpty(string)) {
      if (this.displayed) updateDisplay(this,false);
      fdjtDOM.addClass(this.container,"noinput");
      return;}
    else fdjtDOM.dropClass(this.container,"noinput");
    var result=this.getCompletions(string);
    if ((!(result))||(result.length===0)) {
      updateDisplay(this,false);
      fdjtDOM.addClass(this.container,"noresults");
      return;}
    else {
      updateDisplay(this,result.matches);
      fdjtDOM.dropClass(this.container,"noresults");
      if (result.length===1) {
	if (result.prefix) this.input.value=result.prefix;
	this.oncomplete(result[0]);}}};

  Completions.onclick=function(evt){
    if (this.timer) clearTimeout(this.timer);
    var completion=fdjtDOM.getParent(fdjtDOM.T(evt),".completion");
    if (completion) {
      var container=fdjtDOM.getParent(completion,".completions");
      var completions=new Completions(container);
      completions.oncomplete(completion);}};
  Completions.onkeydown=function(evt){
    var kc=evt.keyCode;
    if ((kc===8)||(kc===45)) {
      Completions.update(evt); return;}
    else if (!((kc===13)||(kc===7))) return;
    var input=fdjtDOM.T(evt);
    var compid=input.getAttribute('COMPLETIONS');
    var compdiv=fdjtID(compid);
    var completions=new Completions(compdiv,input);
    if (completions.timer) {
      clearTimeout(completions.timer); completions.timer=false;}
    fdjtDOM.cancel(event);
    completions.enter(input.value);};
  Completions.update=function(evt){
    var input=fdjtDOM.T(evt);
    var compid=input.getAttribute('COMPLETIONS');
    var compdiv=fdjtID(compid);
    var completions=new Completions(compdiv,input);
    if (completions.timer) clearTimeout(completions.timer);
    completions.timer=
    setTimeout(function() {
	completions.complete();
	completions.timer=false;},
      500);};
  Completions.action=function(evt,action){
    var input=fdjtDOM.T(evt);
    var compid=input.getAttribute('COMPLETIONS');
    var compdiv=fdjtID(compid);
    var completions=new Completions(compdiv,input);
    if (completions.timer) clearTimeout(completions.timer);
    completions.timer=
    setTimeout(function() {
	completions.action(action);
	completions.timer=false;},
      500);};
  
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

  function stdspace(string){
    return string.replace(/\s+/," ").replace(/(^\s)|(\s$)/,"");}

  fdjtUI.Completions=Completions;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
