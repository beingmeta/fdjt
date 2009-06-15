/* -*- Mode: Javascript; -*- */

var fdjt_completion_id="$Id$";
var fdjt_completion_version=parseInt("$Revision$".slice(10,-1));

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

var fdjt_trace_completion=false;
var fdjt_detail_completion=false;

/* Completion */

// Always set to distinguish no options from false
var FDJT_COMPLETE_OPTIONS=1;
// Whether the completion element is a cloud (made of spans)
var FDJT_COMPLETE_CLOUD=2;
// Whether to require that completion match an initial segment
var FDJT_COMPLETE_PREFIX=4;
// Whether to match case in keys to completions
var FDJT_COMPLETE_MATCHCASE=8;
// Whether to show "variations" which are matched
//  (they will influence selection regardless)
var FDJT_COMPLETE_SHOWVARY=16;
// Whether to show completions when the input string is empty
var FDJT_COMPLETE_SHOWEMPTY=32;
// Whether the key fields may contain disjoins (e.g. (dog|friend))
// to be accomodated in matching
var FDJT_COMPLETE_DISJOINS=64;

var fdjt_complete_options=
  FDJT_COMPLETE_OPTIONS|FDJT_COMPLETE_PREFIX|FDJT_COMPLETE_SHOWVARY;

/* When completing on an empty string, show completions if there are fewer
   than this number (customizable by the maxshowempty attribute).  */
var fdjt_complete_maxshowempty=12;

function _fdjt_get_complete_opts(arg)
{
  if (!(arg)) return fdjt_complete_options;
  else if (typeof arg === "number") return arg;
  else if (typeof arg === "string") {
    var opt=
      (((arg.search(/\bprefix\b/)<0)?(0):((FDJT_COMPLETE_PREFIX)))|
       ((arg.search(/\bmatchcase\b/)<0)?(0):((FDJT_COMPLETE_MATCHCASE)))|
       ((arg.search(/\bcloud\b/)<0)?(0):((FDJT_COMPLETE_CLOUD)))|
       ((arg.search(/\bshowempty\b/)<0)?(0):((FDJT_COMPLETE_SHOWEMPTY)))|
       ((arg.search(/\bvary\b/)<0)?(0):((FDJT_COMPLETE_SHOWVARY)))|1);
    // fdjtTrace("Getting complete options from %o=%o",arg,opt);
    return opt;}
  else if (arg.completeopts)
    return arg.completeopts;
  else if (arg.getAttribute) {
    var opts=_fdjt_get_complete_opts(arg.getAttribute("completeopts"));
    arg.completeopts=opts;
    // fdjtTrace("Got completeopts for %o %o/%o",arg,opts,arg.completeopts);
    return opts;}
  else return fdjt_complete_options;
}


// This gets the completions element for an input element
// A completion element is a "cloud" if new completions are typically
// spans rather than divs.
function _fdjt_get_completions(input_elt,create)
{
  if (input_elt.completions_elt)
    // For fast access, cache it or put it here
    return input_elt.completions_elt;
  else if (input_elt.getAttribute("COMPLETIONS")) {
    // This is the case where the COMPLETIONS element is
    // the ID of another element
    var elt=$(input_elt.getAttribute("COMPLETIONS"));
    if (!(elt))
      if (create)
	elt=fdjtCompletions
	  (input_elt.getAttribute("COMPLETIONS"),[],
	   _fdjt_get_complete_opts(input_elt));
      else return false;
    input_elt.completions_elt=elt;
    elt.input_elt=input_elt;
    return elt;}
  else {
    var id=input_elt.name+"_COMPLETIONS";
    var elt=$(id);
    input_elt.setAttribute("COMPLETIONS",id);
    if (!(elt))
      if (create)
	elt=fdjtCompletions(id,[],_fdjt_get_complete_opts(input_elt));
      else return false;
    elt.input_elt=input_elt;
    input_elt.completions_elt=elt;
   return elt;}
}

function fdjtCompletions(id,completions,opts)
{
  var div=fdjtDiv("completions");
  div.id=id;
  div.onclick=fdjtComplete_onclick;
  fdjtAddCompletions(div,completions,opts);
  return div;
}

function fdjtAddCompletions(div,completions,opts)
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
	  ((opts&FDJT_COMPLETE_CLOUD) ?
	   (fdjtSpan("completion",content)):
	   (fdjtDiv("completion",content)));
	completion_elt.key=key;
	completion_elt.value=value;
	if (title) completion_elt.title=title;
	else completion_elt.title=key;
	fdjtAppend(div,completion_elt,"\n");}}}
  return div;
}

// This looks for completions matching *string* among the completions
//  associated with input_elt.  Note that *string* might not be the value
//  of input_elt, but might just be a component returned by fdjtCompletionText.
function fdjtComplete(input_elt,string,options)
{
  if (!(string)) string=fdjtCompletionText(input_elt);
  if (!(options))
    options=input_elt.completeopts||_fdjt_get_complete_opts(input_elt);
  var completions=_fdjt_get_completions(input_elt);
  var maxcomplete=
    input_elt.maxcomplete||fdjtCacheAttrib(input_elt,"maxcomplete",false,false);
  var maxshowempty=
    input_elt.maxshowempty||
    fdjtCacheAttrib(input_elt,"maxshowempty",false,fdjt_complete_maxshowempty);
  if (fdjt_detail_completion)
    fdjtLog("fdjtComplete on %s in %o from %o",string,input_elt,completions);
  if (!(completions)) return;
  if (!(exact)) exact=false;
  if ((!string) || (string==="")) {
    var all_completions=$$(".completion",completions);
    if ((options&FDJT_COMPLETE_SHOWEMPTY)||
	(all_completions.length<=maxshowempty)) {
      if (fdjt_trace_completion) fdjtLog("Completion on empty string");
      var results=[]; results.string=string;
      var i=0; while (i<all_completions.length) {
	var completion=all_completions[i++];
	var variants=
	  ((completion.variants)||
	   (completion.variants=
	    fdjtGetChildrenByClassName(completion,"variation")));
	var j=0; while (j<variants.length)
		   variants[j++].setAttribute("displayed","no");
	if (maxcomplete===false)
	  completion.setAttribute("displayed","yes");
	else if (i<maxcomplete)
	  completion.setAttribute("displayed","yes");
	else completion.setAttribute("displayed","no");
	results.push(completion);}
      fdjtAddClass(completions,"showall");
      results.heads=results; results.exact=[]; results.exactheads=[];
      return results;}
    else {
      var results=[]; results.string=string;
      results.heads=[]; results.exact=[]; results.exactheads=[];
      var i=0; while (i<all_completions.length) {
	var completion=all_completions[i++];
	var variants=
	  ((completion.variants)||
	   (completion.variants=
	    fdjtGetChildrenByClassName(completion,"variation")));
	var j=0; while (j<variants.length)
		   variants[j++].setAttribute("displayed","no");
	completion.setAttribute("displayed","no");}
      return results;}}
  else {
    var results=[]; var heads=[];
    var exacts=[]; var exactheads=[];
    var keys=[];
    var matchcase=(options&FDJT_COMPLETE_MATCHCASE);
    var prefix=(options&FDJT_COMPLETE_PREFIX);
    var qpat=string; var qstring=string;
    var n_complete=0;
    if (typeof string !== "string")
      throw {name: "TypeError",irritant: string,expected: "string or regex"};
    else if ((matchcase) && (prefix))
      qpat=new RegExp("^"+string,"g");
    else if (matchcase)
      qpat=new RegExp(string,"");
    else if (prefix)
      qpat=new RegExp("^"+string,"i");
    else qpat=new RegExp(string,"gi");
    results.string=string;
    if (!(matchcase)) qstring=string.toLowerCase();
    var children=(completions.completions)||
      (completions.completions=
       fdjtGetChildrenByClassName(completions,"completion"));
    var i=0; while (i<children.length) {
      var child=children[i++];
      var found=false; var exact=false; var head=false;
      var key=child.key||fdjtCacheAttrib(child,"key");
      if (key.search(qpat)>=0)
	if ((matchcase) ? (key===qstring) : (key.toLowerCase()===qstring)) {
	  results.push(child); keys.push(key);
	  found=true; exact=true; head=true;}
	else {
	  found=true; head=true;}
      /* We iterate over variants in any case, because we may want to
	 hide them if their displayed from a past completion. */
      var variants=
	((child.variants)||
	 (child.variants=fdjtGetChildrenByClassName(child,"variation")));
      if (variants.length)
	if (found) {
	  // Make all the variants be unshown, just in case
	  var j=0; while (j<variants.length)
		     variants[j++].setAttribute("displayed","no");}
	else {
	  /* Look for a matching variant */
	  var j=0; while (j<variants.length) {
	    var variant=variants[j++]; 
	    var key=variant.key||fdjtCacheAttrib(variant,"key");
	    if ((found) && (exact))
	      variant.setAttribute("displayed","no");
	    else if (key.search(qpat)>=0)
	      if ((matchcase)?
		  (key===qstring) :
		  (key.toLowerCase()===qstring)) {
		variant.setAttribute("displayed",((found)?("no"):("yes")));
		found=true; exact=true;}
	      else if (found)
		variant.setAttribute("displayed","no");
	      else {
		variant.setAttribute("displayed","yes");
		results.push(child); keys.push(key);
		found=true;}
	    else variant.setAttribute("displayed","no");}}
      if (head) child.setAttribute("head","yes");
      else child.removeAttribute("head");
      if (found) {
	n_complete++; 
	if (exact) exacts.push(child); if (head) heads.push(child);
	if ((exact) && (head)) exactheads.push(child);
	if ((maxcomplete===false) ||
	    (n_complete<maxcomplete))
	  child.setAttribute("displayed","yes");
	else child.setAttribute("displayed","no");}
      else child.setAttribute("displayed","no");}}
  var len=results.length;
  if (fdjt_trace_completion)
    fdjtLog("Completion on '%s' (%d) found %d/%dh/%de/%dhe: %o",
	    string,options,len,
	    heads.length,exacts.length,exactheads.length,
	    results);
  /* This lets us do styling on the rough number of attributes */
  completions.setAttribute
    ("ncompletions",
     ((len===0) ? "none" :
      (len===1) ? "one" :
      (len<=5) ? "five" :
      (len<=10) ? "ten" :
      (len<=15) ? "fifteen" :
      (len<=20) ? "twenty" :
      (len<=30) ? "thirty" :
      (len<=40) ? "forty" :
      (len<=50) ? "fifty" :
      (len<=60) ? "sixty" :
      (len<=70) ? "seventy" :
      "many"));
  /* Update the class name if there are any results, or just set it
     to trigger some redisplay (kludge). */
  if (len) fdjtAddClass(completions,'open');
  else completions.className=completions.className;
  results.heads=heads; results.exact=exacts; results.exactheads=exactheads;
  if (input_elt.noteCompletions) {
    input_elt.noteCompletions(results);}
  return results;
}
  
// This 'forces' a completion presumably when the user indicates a decisive
// action (like a return) as opposed to milder requests.
function fdjtForceComplete(input_elt)
{
  if (input_elt.value==="") return;
  if (fdjt_trace_completion)
    fdjtLog("Trying to force completion on %o:",input_elt,completions);
  var completions=fdjtComplete(input_elt,false,false);
  if ((completions) && (completions.length==1)) 
    fdjtHandleCompletion(input_elt,completions[0],false);
}
 
function fdjtCompletionText(input_elt)
{
  if (input_elt.getCompletionText)
    return input_elt.getCompletionText();
  else if (fdjtHasAttrib(input_elt,"isempty"))
    return "";
  else return input_elt.value;
}

function fdjtHandleCompletion(input_elt,elt,value)
{
  if (!(value))
    value=elt.value||(fdjtCacheAttrib(elt,"value"));
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (!(elt)) return;
  if (fdjt_trace_completion)
    fdjtLog("Handling completion on %o with %o (%o):",
	    input_elt,elt,value);
  if (input_elt.oncomplete)
    return input_elt.oncomplete.call(input_elt,elt,value||elt.value);
  else if (input_elt.getAttribute("ONCOMPLETE")) {
    input_elt.oncomplete=
      new Function("elt","value",
		   input_elt.getAttribute("ONCOMPLETE"));
    fdjtTrace("Generated oncomplete function from %s",
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
  var options=target.completeopts||_fdjt_get_complete_opts(target);
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

function fdjtComplete_setup(target)
{
  fdjtComplete(target);
}

function fdjtComplete_onkey(evt)
{
  var target=evt.target;
  var keycode=evt.keyCode;
  var charcode=evt.charCode;
  var value=fdjtCompletionText(target);
  var options=target.completeopts||_fdjt_get_complete_opts(target);
  var cchars=
    fdjtCacheAttrib(evt.target,"enterchars",fdjtStringToKCodes,[32,-13]);    
  // fdjtTrace("Complete_onkey %o",evt);
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  if (((keycode) && (cchars.indexOf(-keycode)>=0)) ||
      ((charcode) && (cchars.indexOf(charcode)>=0))) {
    // These complete right away
    var results=fdjtComplete(target,false,options);
    // evt.preventDefault(); evt.cancelBubble=true;
    if (results.length===1) {
      fdjtHandleCompletion(target,results[0],results[0].value);
      fdjtDropClass(target.completions_elt,"open");}
    else {}}
  else fdjtDelayHandler(100,fdjtComplete,target,false,"complete");
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
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
