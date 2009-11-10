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

var fdjt_trace_completion_setup=false;
var fdjt_trace_completion=false;
var fdjt_detail_completion=false;

/* Completion */

// Always set to distinguish no options from false
var FDJT_COMPLETE_OPTIONS=1;
// Whether the completion element is a cloud (made of spans)
var FDJT_COMPLETE_CLOUD=2;
// Whether to require that completion match an initial segment
var FDJT_COMPLETE_ANYWHERE=4;
// Whether to match case in keys to completions
var FDJT_COMPLETE_MATCHCASE=8;
// Whether the key fields may contain disjoins (e.g. (dog|friend))
// to be accomodated in matching
var FDJT_COMPLETE_DISJOINS=16;

var fdjt_complete_options=FDJT_COMPLETE_OPTIONS;

// This parses the options for completion
function _fdjt_get_complete_opts(arg)
{
  if (!(arg)) return fdjt_complete_options;
  else if (typeof arg === "number") return arg;
  else if (typeof arg === "string") {
    var opt=
      (((arg.search(/\banywhere\b/)<0)?(0):((FDJT_COMPLETE_ANYWHERE)))|
       ((arg.search(/\bmatchcase\b/)<0)?(0):((FDJT_COMPLETE_MATCHCASE)))|
       ((arg.search(/\bcloud\b/)<0)?(0):((FDJT_COMPLETE_CLOUD)))|
       FDJT_COMPLETE_OPTIONS);
    // fdjtTrace("Getting complete options from %o=%o",arg,opt);
    return opt;}
  else if (arg.completeopts)
    return arg.completeopts;
  else if (arg.input_elt)
    return _fdjt_get_complete_opts(arg.input_elt);
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
    // Creates an empty completions element
    if (!(elt))
      if (create)
	elt=fdjtCompletions(id,[],_fdjt_get_complete_opts(input_elt));
      else return false;
    elt.input_elt=input_elt;
    input_elt.completions_elt=elt;
   return elt;}
}

// Creates a completions DIV with a list of completions
function fdjtCompletions(id,completions,opts)
{
  var div=fdjtDiv("completions");
  div.id=id;
  div.onclick=fdjtComplete_onclick;
  fdjtAddCompletions(div,completions,opts);
  return div;
}

// Converts a value to a completion element (a DOM node)
function fdjtCompletionElt(completion,opts)
{
  var key=false; var value; var content=[]; var title=false;
  // key is what we look up on, value is what we 'get', content is
  // what we display, title is the tooltip, completion_elt is the DOM 
  // node itself
  if ((completion)&&((completion.getCompletionEntry))) {
    var ce=completion.getCompletionEntry();
    if ((typeof ce === 'string')||(typeof ce !== 'object')) {
      key=content=ce; value=completion;}
    else if (ce.nodeType) return ce;
    else completion=ce;}
  else if (completion.nodeType) return completion;
  else if (typeof completion === 'string') 
    key=value=content=completion;
  else if (typeof completion !== 'object') {
    key=content=completion.toString(); value=completion;}
  else {
    key=completion.key;
    value=completion.value||key;
    title=completion.title||key;
    content=completion.content||key;}
  var elt=((opts&FDJT_COMPLETE_CLOUD) ?
	   (fdjtSpan("completion",content)):
	   (fdjtDiv("completion",content)));
  elt.key=key;
  elt.value=value;
  if (title) elt.title=title;
  return elt;
}

function fdjtAddCompletion(div,completion,opts,init)
{
  if (!(div.nodeType)) throw {name: 'NotANode', irritant: div};
  if (!(completion.nodeType)) throw {name: 'NotANode', irritant: completion};
  if (!(opts)) opts=_fdjt_get_complete_opts(div);
  if (!(div.allcompletions)) fdjtInitCompletions(div,false,opts);
  // fdjtTrace("add completion %o to %o",completion,div);
  if ((init)||(div.allcompletions.indexOf(completion)<0)) {
    var prefixtree=div.prefixtree;
    var cmap=div.completionmap;
    var stdkey=fdjtStdSpace(completion.key);
    if (!(opts&FDJT_COMPLETE_MATCHCASE)) stdkey=stdkey.toLowerCase();
    if (!(prefixtree)) {
      prefixtree=div.prefixtree={};
      prefixtree.strings=[];}
    if (!(cmap)) cmap=div.completionmap={};
    if (!(fdjtHasParent(completion,div)))
      fdjtAppend(div,completion," ");
    fdjtAddKeys(completion,prefixtree,cmap,stdkey,
		(opts&FDJT_COMPLETE_ANYWHERE));
    if (div.allcompletions)
      div.allcompletions.push(completion);
    else div.allcompletions=new Array(completion);
    if (fdjtHasClass(completion,"cue")) 
      if (div.allcues)
	div.allcues.push(completion);
      else div.allcues=new Array(completion);
    var value=completion.value;
    var variations=fdjtGetChildrenByClassName(completion,"variation");
    var i=0; while (i<variations.length) {
      var variation=variations[i++];
      var stdkey=fdjtStdSpace(variation.key);
      variation.value=value;
      if (!(opts&FDJT_COMPLETE_MATCHCASE)) stdkey=stdkey.toLowerCase();
      fdjtAddKeys(variation,prefixtree,cmap,stdkey,
		  (opts&FDJT_COMPLETE_ANYWHERE));}}
}

function fdjtAddKeys(value,ptree,cmap,keystring,anywhere)
{
  var keys=((anywhere)?(keystring.split(/\W/g)):[]).concat(keystring);
  var i=0; while (i<keys.length) {
    var key=keys[i++];
    fdjtPrefixAdd(ptree,key,0);
    if (cmap) {
      if ((cmap[key])&&(cmap.hasOwnProperty(key)))
	cmap[key].push(value);
      else cmap[key]=new Array(value);
      cmap._count++;}}
}

function fdjtInitCompletions(div,completions,opts)
{
  if (div.allcompletions) return;
  div.allcompletions=[];
  div.allcues=[];
  div.prefixtree={};
  div.prefixtree.strings=[];
  div.completionmap={}; div.completionmap._count=0;
  var start=new Date();
  var completions=(completions)||fdjtGetChildrenByClassName(div,"completion");
  if (fdjt_trace_completion_setup)
    fdjtTrace("Initializing %d completions for %o",completions.length,div);
  var i=0; while (i<completions.length)
	     fdjtAddCompletion(div,completions[i++],opts,true);
  if (fdjt_trace_completion_setup)
    fdjtTrace("[%fs] Initialized %d completions, %d strings, %d items for %o",
	      fdjtDiffTime(start),
	      completions.length,div.prefixtree.strings.length,
	      div.completionmap._count,
	      div);
}

// Adds a vector of completions to a completions DIV
function fdjtAddCompletions(div,completions,opts)
{
  if (typeof div === "string") div=document.getElementById(div);
  if (!(div.nodeType)) throw {name: 'NotANode', irritant: div};
  if ((completions) && (completions instanceof Array)) {
    var i=0; while (i<completions.length) 
	       fdjtAddCompletion(div,fdjtCompletionElt(completions[i++]),opts);}
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
  var container=_fdjt_get_completions(input_elt);
  if (!(container.allcompletions)) fdjtInitCompletions(container,false,options);
  if (fdjt_trace_completion)
    fdjtLog("[%f] Complete in %o on '%o' against %o",
	    fdjtElapsedTime(),input_elt,string,container);
  if ((!string) || (fdjtIsEmptyString(string))) {
    var empty=[];
    fdjtAddClass(container,"noinput");
    empty.exact=[];
    var displayed=container.displayed;
    if (displayed) {
      var i=0; while (i<displayed.length) {
	var node=displayed[i++];
	node.removeAttribute('displayed');
	node.className=node.className;}}
    if ((fdjt_trace_completion)&&(displayed))
      fdjtLog("[%f] Hiding %d displayed items in %o",
	      fdjtElapsedTime(),displayed.length,container);
    container.displayed=[];
    return empty;}
  else if ((container.curstring) && (string===container.curstring)) {
    if (fdjt_trace_completion)
      fdjtLog("[%f] Using %d cached result for %s against %o",
	      fdjtElapsedTime(),container.results.length,string,container);
    return container.results;}
  else {
    var qstring=((options&FDJT_COMPLETE_MATCHCASE)?(string):(string.toLowerCase()));
    var prefixtree=container.prefixtree;
    var cmap=container.completionmap;
    var start=new Date(); var timer=new Date();
    var strings=fdjtPrefixFind(prefixtree,qstring,0);
    if (fdjt_detail_completion)
      fdjtLog("[%f][%fs] Found %d strings from %s",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),strings.length,qstring);
    if ((!(strings))||(strings.length===0)) {
      var results=[];
      results.exact=[];
      container.results=results;
      container.curstring=string;
      return results;}
    var heads=[]; var variations=[];
    var i=0; while (i<strings.length) {
      var completions=cmap[strings[i++]];
      var j=0; while (j<completions.length) {
	var completion=completions[j++];
	if (fdjtHasClass(completion,"variation")) {
	  var parent=fdjtGetParentByClassName(completion,"completion");
	  if (!(parent)) fdjtWarn("Couldn't find completion parent of %o",completion);
	  if (heads.indexOf(parent)<0) {
	    heads.push(parent); variations.push(completion);}}
	else heads.push(completion);}}
    if (fdjt_detail_completion)
      fdjtLog("[%f][%fs] Found %d completions including %d variations",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),heads.length,variations.length);
    var displayed=container.displayed||[]; var hidden=0; var revealed=0;
    i=0; while (i<displayed.length) {
      var node=displayed[i++];
      if (!((heads.indexOf(node)>=0)||(variations.indexOf(node)>=0))) {
	// Reset the class name to kludge redisplay
	node.removeAttribute("displayed"); hidden++;}}
    if (fdjt_detail_completion)
      fdjtLog("[%f][%fs] Hid %d of %d displayed items",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),hidden,displayed.length);
    i=0; while (i<variations.length) {
      var node=variations[i++]; 
      node.setAttribute('displayed','yes');}
    var results=[];
    i=0; while (i<heads.length) {
      var head=heads[i++];
      head.setAttribute('displayed','yes');
      results.push(head.value);}
    if (fdjt_detail_completion)
      fdjtLog("[%f][%fs] Revealed %d heads and %d variations",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),heads.length,variations.length);
    container.displayed=heads.concat(variations);
    if (fdjt_trace_completion)
      if (results.length>10)
	fdjtTrace("[%f][%fs] Completing over %o on %o yields %d results",
		  fdjtElapsedTime(),fdjtDiffTime(start),input_elt,string,results.length);
      else fdjtTrace("[%f][%fs] Completing over %o on %o yields %o",
		     fdjtElapsedTime(),fdjtDiffTime(start),input_elt,string,results);
    input_elt.completeString=string;
    container.curstring=string;
    container.results=heads;
    fdjtDropClass(container,"noinput");
    // Force redisplay?
    container.className=container.className;
    heads.exact=cmap[qstring]||[];
    if (heads.length===0) fdjtAddClass(container,"noresults");
    return heads;}
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
  if (input_elt.oncomplete) {
    return input_elt.oncomplete(elt,value||elt.value);}
  else if (input_elt.getAttribute("ONCOMPLETE")) {
    input_elt.oncomplete=
      new Function("elt","value",
		   input_elt.getAttribute("ONCOMPLETE"));
    return input_elt.oncomplete(elt,value||elt.value);}
  else {
    input_elt.value=value||elt.value;
    input_elt.focus();}
}

function fdjtComplete_onclick(evt)
{
  var target=$T(evt);
  // fdjtTrace("complete onclick %o",target);
  while (target)
    if ((target.key) ||
	((target.getAttribute) &&
	 (target.getAttribute('key')))) break;
    else target=target.parentNode;
  // fdjtTrace("complete onclick/2 %o",target);
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
}

var _fdjt_completion_timer=false;

function fdjtComplete_show(evt)
{
  var target=$T(evt);
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
  fdjtAutoPrompt_onfocus(evt);
  fdjtComplete($T(evt));
}

function fdjtComplete_setup(target)
{
  fdjtComplete(target);
}

function fdjtCheckComplete(target)
{
  if ((!(target.completeString))||
      (target.completeString!==fdjtCompletionText(target)))
    fdjtComplete(target);
}

function fdjtComplete_onkey(evt)
{
  var target=$T(evt);
  var keycode=evt.keyCode;
  var charcode=evt.charCode;
  var value=fdjtCompletionText(target);
  var options=target.completeopts||_fdjt_get_complete_opts(target);
  var cchars=
    fdjtCacheAttrib($T(evt),"enterchars",fdjtStringToKCodes,[32,-13]);    
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  // fdjtTrace("Complete_onkey %o, cchars=%o",evt,cchars);
  if (((keycode) && (fdjtIndexOf(cchars,-keycode)>=0)) ||
      ((charcode) && (fdjtIndexOf(cchars,charcode)>=0))) {
    // These complete right away
    var results=fdjtComplete(target,false,options);
    // fdjtTrace("Escape complete on %o, results=%o",target,results);
    evt.preventDefault(); evt.cancelBubble=true;
    if (results.length===1) {
      fdjtHandleCompletion(target,results[0],results[0].value);
      fdjtDropClass(target.completions_elt,"open");}
    else {}}
  else {
    if (fdjt_trace_completion)
      fdjtTrace("Delaying handler fdjtComplete on %o",target);
    fdjtDelayHandler(500,fdjtComplete,target,target,"completedelay");}
  return true;
}

function fdjtSetCompletions(id,completions)
{
  var current=document.getElementById(id);
  if (fdjt_trace_completion)
    if (current===completions)
      fdjtLog("[%f] Completions for #%s are unchanged",fdjtElapsedTime(),id);
    else fdjtLog("[%f] Setting current completions #%s=%o to %o/%d",
		 fdjtElapsedTime(),id,current,completions,
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

/* Setting cues */

function fdjtSetCompletionCues(div,cues,onmissing)
{
  fdjtTrace("Setting completion cues on %o to %o",div,cues);
  var cur=div._cues||[];
  var cmap=div.completionmap;
  var newcues=[];
  var i=0; while (i<cues.length) {
    var cue=cues[i++];
    if (typeof cue === 'string')
      if (cmap[cue]) newcues.push(cmap[cue]);
      else if (onmissing) {
	var new_elt=onmissing(div,cue);
	if (new_elt) newcues.push(new_elt);}
      else {}
    else if (fdjtHasClass(cue,"completion"))
      newcues.push(cue);
    else {}}
  var i=0; while (i<newcues.length) {
    var cue=newcues[i++];
    if (cur.indexOf(cue)<0) {
      fdjtAddClass(cue,"cue");}}
  var i=0; while (i<cur.length) {
    var elt=cur[i++];
    if (newcues.indexOf(elt)<0) fdjtDropClass(cue,"cue");}
  div._cues=newcues;
}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
