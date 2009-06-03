/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides for input completion.

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

var fdjt_completion_id="$Id: handlers.js 40 2009-04-30 13:31:58Z haase $";
var fdjt_completion_version=parseInt("$Revision: 40 $".slice(10,-1));

var fdjt_trace_completion=false;
var fdjt_detail_completion=false;

/* Completion */

/* This is big enough that perhaps it should be in its own file,
   but it's living here for now. */

function _fdjt_get_completions(input_elt,create)
{
  var cloudp=((input_elt.getAttribute("COMPLETEOPTS")) &&
	      (input_elt.getAttribute("COMPLETEOPTS").
	       search(/\bcloud\b/)>=0));
  if (input_elt.completions_elt)
    return input_elt.completions_elt;
  else if (input_elt.getAttribute("COMPLETIONS")) {
    var elt=$(input_elt.getAttribute("COMPLETIONS"));
    if (!(elt))
      if (create) elt=fdjtCompletions
		    (input_elt.getAttribute("COMPLETIONS"),[],cloudp);
      else return false;
    input_elt.completions_elt=elt;
    elt.input_elt=input_elt;
    return elt;}
  else {
    var id=input_elt.name+"_COMPLETIONS";
    var elt=$(id);
    input_elt.setAttribute("COMPLETIONS",id);
    if (!(elt))
      if (create) elt=fdjtCompletions(id,[],cloudp);
      else return false;
    elt.input_elt=input_elt;
    input_elt.completions_elt=elt;
   return elt;}
}

function fdjtCompletions(id,completions,cloudp)
{
  var div=fdjtDiv("completions");
  div.id=id;
  div.onclick=fdjtComplete_onclick;
  fdjtAddCompletions(div,completions,cloudp);
  return div;
}

function fdjtAddCompletions(div,completions,cloudp)
{
  if (typeof div === "string") div=document.getElementById(div);
  if (!(div.nodeType))
    throw {name: 'NotANode', irritant: div};
  else if ((completions) && (completions instanceof Array)) {
    var i=0; while (i<completions.length) {
      var completion=completions[i++];
      var completion_elt=false;
      var key; var value; var content=[]; var title=false;
      if (typeof completion === "string") {
	key=value=completion; content.push(completion);}
      else if (typeof completion != "object") {
	completion=completion.toString();
	key=value=completion; content.push(completion);}
      else if (completion.nodeType) continue;
      else if (completion.getCompletionEntry) {
	completion=completion.getCompletionEntry();
	if (completion.nodeType)
	  value=key=completion;
	else {
	  key=completion.key;
	  value=((completion.value) || (key));
	  content=((completion.content) || (value));
	  if (completion.title) title=completion.title;}}
      else {
	key=completion.key;
	value=((completion.value) || (key));
	content=((completion.content) || (value));
	if (completion.title) title=completion.title;}
      if (key) {
	var completion_elt=
	  ((cloudp) ? (fdjtSpan("completion",content)):
	   (fdjtDiv("completion",content)));
	completion_elt.key=key;
	completion_elt.value=value;
	if (title) completion_elt.title=title;
	fdjtAppend(div,completion_elt,"\n");}}}
  return div;
}

function fdjtComplete(input_elt,string,options,exact)
{
  if (!(string)) string=fdjtCompletionText(input_elt);
  if (!(options)) options=input_elt.getAttribute("COMPLETEOPTS")||"";
  var results=[];
  var completions=_fdjt_get_completions(input_elt);
  var maxcomplete=
    input_elt.maxcomplete||fdjtCacheAttrib(input_elt,"maxcomplete",false,false);
  var n_complete=0;
  if (fdjt_detail_completion)
    fdjtLog("fdjtComplete on %s in %o from %o",string,input_elt,completions);
  if (!(completions)) return;
  var prefix=false; var nocase=false;
  if (!(exact)) exact=false;
  if (typeof options === "string") {
    prefix=(options.search(/\bprefix\b/)>=0);
    matchcase=(options.search(/\bmatchcase\b/)>=0);}
  if (string==="") {
    if (fdjt_trace_completion) fdjtLog("Completion on empty string");
    var all_completions=$$(".completion",completions);
    var results=[];
    var i=0; while (i<all_completions.length) {
      var completion=all_completions[i++];
      if (maxcomplete===false)
	completion.setAttribute("displayed","yes");
      else if (i<maxcomplete)
	completion.setAttribute("displayed","yes");
      else completion.setAttribute("displayed","no");
      results.push(completion);}
    fdjtAddClass(completions,"showall");
    return results;}
  else {
    if (exact) {
      if (!(matchcase)) string=string.toLowerCase();}
    else if (!(matchcase))
      if (typeof string === "string")
	string=new RegExp(string,"gi");
      else if (string instanceof RegExp)
	string=new RegExp(string.source,"gi");
      else throw { name: "TypeError",
	       irritant: string,
	       expected: "string or regex"};
    var children=completions.childNodes;
    var i=0; while (i<children.length) {
      var child=children[i++];
      if (child.nodeType===Node.ELEMENT_NODE) {
	var keys=child.key||fdjtCacheAttrib(child,"keys",fdjtSemiSplit);
	if (keys) {
	  var value=false;
	  if (fdjt_detail_completion)
	    fdjtLog("Comparing '%s' against %o",string,keys);
	  var j=0; while ((j<keys.length) && (!(value))) {
	    var key=keys[j++]; 
	    if ((exact) ?
		((matchcase) ? (key===string) : (key.toLowerCase()===string)) :
		((prefix) ? (key.search(string)===0) :
		 (key.search(string)>=0))) {
	      if (child.value) value=child.value;
	      else if (fdjtHasAttrib(child,"VALUE")) 
		value=child.value=child.getAttribute("VALUE");
	      else value=child.value=keys[0];
	      break;}
	    /* If exact is 2, just match the first key. */
	    if (exact===2) break;}
	  if (value) {
	    if (fdjt_trace_completion)
	      fdjtLog("Found %o on %o from %s",value,child,string);
	    n_complete++;
	    results.push(child);
	    if ((maxcomplete===false) ||
		(n_complete<maxcomplete))
	      child.setAttribute("displayed","yes");
	    else child.setAttribute("displayed","no");}
	  else child.setAttribute("displayed","no");}}}}
  if (fdjt_trace_completion)
    fdjtLog("Completion on '%s' found %o",string,results);
  if (results.length) fdjtAddClass(completions,'open');
  return results;
}
  
function fdjtForceComplete(input_elt)
{
  if (input_elt.value==="") return;
  var completions=fdjtComplete(input_elt,false,false,2);
  if (completions.length!=1) {
    completions=fdjtComplete(input_elt,false,false,true);
    if ((!completions) || (completions.length==0))
      completions=fdjtComplete(input_elt,false,false,false);
    if ((completions) && (completions.length==1)) 
      fdjtHandleCompletion(input_elt,completions[0],false);
    return;}
  if (fdjt_trace_completion)
    fdjtLog("Trying to force completion on %o:",input_elt,completions);
  if (completions.length===1)
    fdjtHandleCompletion(input_elt,completions[0],false);
}

 
function fdjtCompletionText(input_elt)
{
  if (input_elt.getCompletionText)
    return input_elt.getCompletionText();
  else return input_elt.value;
}

function fdjtHandleCompletion(input_elt,elt,value)
{
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (fdjt_trace_completion)
    fdjtLog("Handling completion on %o with %o (%o):",
	    input_elt,elt,value);
  if (input_elt.oncomplete)
    return input_elt.oncomplete.call(input_elt,elt,value||elt.value);
  else if (input_elt.getAttribute("ONCOMPLETE")) {
    input_elt.oncomplete=
      new Function("elt","value",
		   input_elt.getAttribute("ONCOMPLETE"));
    return input_elt.oncomplete.call(input_elt,elt,value||elt.value);}
  else input_elt.value=value||elt.value;
}

function fdjtComplete_onclick(evt)
{
  var target=evt.target;
  // fdjtTrace("complete onclick %o",target);
  while (target)
    if ((target.key) ||
	((target.getAttribute) &&
	 (target.getAttribute('key')))) break;
    else target=target.parentNode;
  // fdjtTrace("complete onclick %o",target);
  if (!(target)) return;
  var completions=target;
  while (completions)
    if (completions.input_elt) break;
    else completions=completions.parentNode;
  if (!(completions)) return;
  var input_elt=completions.input_elt;
  var value=((target.value) ||
	     (target.getAttribute("value")) ||
	     (target.key));
  fdjtHandleCompletion(input_elt,target,value);
  fdjtDropClass(completions,"open");
  input_elt.focus();
}

var _fdjt_completion_timer=false;

function fdjtComplete_show(evt)
{
  var target=evt.target;
  var keycode=evt.keyCode;
  var value=fdjtCompletionText(target);
  var options=(target.getAttribute("COMPLETEOPTS")||"");
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (value!="")
    fdjt_completion_timer=
      setTimeout(function () {
	  fdjtComplete(target,value,options);},100);
}

function fdjtComplete_onfocus(evt)
{
  fdjtComplete(evt.target);
}

function fdjtComplete_onkeypress(evt)
{
  var target=evt.target;
  var keycode=evt.keyCode;
  var charcode=evt.charCode;
  var value=fdjtCompletionText(target);
  var options=(target.getAttribute("COMPLETEOPTS")||"");
  var cchars=
    fdjtCacheAttrib(evt.target,"enterchars",fdjtStringToKCodes,[32,-13]);    
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (((keycode) && (cchars.indexOf(-keycode)>=0)) ||
      ((charcode) && (cchars.indexOf(charcode)>=0))) {
    // ((keycode) && (keycode===0x20) && (evt.altKey))
    // Tab completion
    var results=fdjtComplete(target,value,options,true);
    if (results.length!=1)
      results=fdjtComplete(target,value,options);
    evt.preventDefault(); evt.cancelBubble=true;
    target.setAttribute
      ("ncompletions",new String(results.length));
    if (results.length===1) {
      fdjtHandleCompletion(target,results[0],results[0].value);
      fdjtDropClass(target.completions_elt,"open");}
    else if (results.length>0) {
      fdjtAddClass(target.completions_elt,"open");}
    else {}}
  else _fdjt_completion_timer=
	 setTimeout(function () {
	     fdjtComplete(target,fdjtCompletionText(target),options);},100);
  return true;
}

function fdjtComplete_hide(evt)
{
  /*
  var target=evt.target;
  if ((target) && (target.completions_elt))
    target.completions_elt.style.display='none';
  */
}

function fdjtSetCompletions(id,completions)
{
  var current=document.getElementById(id);
  if (fdjt_trace_completion)
    fdjtLog("Setting current completions #%s=%o to %o/%d",
	    id,current,completions,
	    $$(".completion",completions).length);
  if (!(current)) {
    fdjtWarn("Can't find current completions #%s",id);
    return;}
  var text_input=current.input_elt;
  text_input.completions_elt=completions;
  completions.input_elt=text_input;
  if (current!=completions) current.input_elt=false;
  fdjtReplace(current,completions);
  completions.id=id;
}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "cd ..; make" ***
;;;  End: ***
*/
