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
var FDJT_COMPLETE_ANYWORD=4;
// Whether to match case in keys to completions
var FDJT_COMPLETE_MATCHCASE=8;
// Whether to an enter character always picks a completion
var FDJT_COMPLETE_EAGER=16;
// Whether the key fields may contain disjoins (e.g. (dog|friend))
// to be accomodated in matching
var FDJT_COMPLETE_DISJOINS=32;

var fdjt_complete_options=FDJT_COMPLETE_OPTIONS;
var fdjt_maxcomplete_default=50;

// This parses the options for completion
function _fdjt_get_complete_opts(arg)
{
  if (!(arg)) return fdjt_complete_options;
  else if (typeof arg === "number") return arg;
  else if (typeof arg === "string") {
    var opt=
      (((arg.search(/\banywhere\b/)<0)?(0):((FDJT_COMPLETE_ANYWORD)))|
       ((arg.search(/\bmatchcase\b/)<0)?(0):((FDJT_COMPLETE_MATCHCASE)))|
       ((arg.search(/\bcloud\b/)<0)?(0):((FDJT_COMPLETE_CLOUD)))|
       ((arg.search(/\beager\b/)<0)?(0):((FDJT_COMPLETE_EAGER)))|
       ((arg.search(/\bdisjoins\b/)<0)?(0):((FDJT_COMPLETE_DISJOINS)))|
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
function fdjt_get_completions(input_elt,create)
{
  var completions_name=input_elt.getAttribute("COMPLETIONS");
  if (!(completions_name)) {
    var id=input_elt.name+"_COMPLETIONS";
    var elt=$ID(id);
    input_elt.setAttribute("COMPLETIONS",id);}
  // This is the case where the COMPLETIONS element is
  // the ID of another element
  var elt=$ID(input_elt.getAttribute("COMPLETIONS"));
  if (!(elt))
    if (create)
      elt=fdjtCompletions
	(input_elt.getAttribute("COMPLETIONS"),[],
	 _fdjt_get_complete_opts(input_elt));
    else return false;
  if (!(elt.getAttribute('INPUTID'))) {
    var input_id=fdjtForceId(input_elt);
    elt.setAttribute('INPUTID',input_id);}
  return elt;
}

function fdjt_get_completions_input(completions)
{
  if (completions.getAttribute('INPUTID'))
    return document.getElementById(completions.getAttribute('INPUTID'));
  else return false;
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
  var divinfo=fdjtEltInfo(div);
  if (!(div.nodeType)) throw {name: 'NotANode', irritant: div};
  if (!(completion.nodeType)) throw {name: 'NotANode', irritant: completion};
  if (!(opts)) opts=_fdjt_get_complete_opts(div);
  if (!(divinfo.allcompletions)) fdjtInitCompletions(div,false,opts);
  // fdjtTrace("add completion %o to %o",completion,div);
  var ac=divinfo.allcompletions;
  if ((init)||
      (((ac.indexOf)?(ac.indexOf(completion)):
	(fdjtIndexOf(ac,completion)))<0)) {
    var prefixtree=divinfo.prefixtree;
    var vmap=divinfo.valuemap;
    var cmap=divinfo.completionmap;
    var smap=divinfo.stringmap;
    var stdkey=fdjtStdSpace(completion.key);
    if (!(opts&FDJT_COMPLETE_MATCHCASE)) {
      var lower=stdkey.toLowerCase();
      smap[lower]=stdkey;
      stdkey=lower;}
    if (!(prefixtree)) {
      prefixtree=divinfo.prefixtree={};
      prefixtree.strings=[];}
    if (!(cmap)) cmap=divinfo.completionmap={};
    if (!(fdjtHasParent(completion,div)))
      fdjtAppend(div,completion," ");
    fdjtAddKeys(completion,prefixtree,cmap,stdkey,
		(opts&FDJT_COMPLETE_ANYWORD));
    if (divinfo.allcompletions)
      divinfo.allcompletions.push(completion);
    else divinfo.allcompletions=new Array(completion);
    if (fdjtHasClass(completion,"cue")) 
      if (divinfo.allcues)
	divinfo.allcues.push(completion);
      else divinfo.allcues=new Array(completion);
    var value=completion.value;
    var variations=fdjtGetChildrenByClassName(completion,"variation");
    fdjtAdd(vmap,value,completion);
    var i=0; while (i<variations.length) {
      var variation=variations[i++];
      var stdkey=fdjtStdSpace(variation.key);
      variation.value=value;
      if (!(opts&FDJT_COMPLETE_MATCHCASE)) stdkey=stdkey.toLowerCase();
      fdjtAddKeys(variation,prefixtree,cmap,stdkey,
		  (opts&FDJT_COMPLETE_ANYWORD));}}
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
  var divinfo=fdjtEltInfo(div);
  if (divinfo.allcompletions) return;
  divinfo.allcompletions=[];
  divinfo.allcues=[];
  divinfo.prefixtree={};
  divinfo.prefixtree.strings=[];
  divinfo.completionmap={}; divinfo.completionmap._count=0;
  divinfo.valuemap={};
  if (!(opts&FDJT_COMPLETE_MATCHCASE)) divinfo.stringmap={};
  var start=new Date();
  var completions=(completions)||fdjtGetChildrenByClassName(div,"completion");
  if (fdjt_trace_completion_setup)
    fdjtTrace("[%fs] Initializing %d completions for %o",
	      fdjtElapsedTime(),completions.length,div);
  var i=0; while (i<completions.length)
	     fdjtAddCompletion(div,completions[i++],opts,true);
  if (fdjt_trace_completion_setup)
    fdjtTrace("[%fs][+%fs] Initialized %d completions, %d strings, %d items for %o",
	      fdjtElapsedTime(),fdjtDiffTime(start),
	      completions.length,divinfo.prefixtree.strings.length,
	      divinfo.completionmap._count,
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
function fdjtComplete(input_elt,string,options,maxcomplete)
{
  if (!(string)) string=fdjtCompletionText(input_elt);
  if (!(options))
    options=input_elt.completeopts||_fdjt_get_complete_opts(input_elt);
  if (typeof maxcomplete==='undefined')
    maxcomplete=
      input_elt.maxcomplete||(fdjtCacheAttrib(input_elt,"maxcomplete"))||
      fdjt_maxcomplete_default;
  var container=fdjt_get_completions(input_elt);
  var cinfo=fdjtEltInfo(container);
  var cmap=cinfo.completionmap;
  if (!(cinfo.allcompletions))
    fdjtInitCompletions(container,false,options);
  if (fdjt_trace_completion)
    fdjtLog("[%fs] Complete on '%o' in %o against %o, cs=%o",
	    fdjtElapsedTime(),string,input_elt,container,
	    cinfo._curstring);
  var start=new Date();
  var timer=new Date();
  var heads=[]; var variations=[]; var strings=[]; var values=[];
  if ((!string) || (fdjtIsEmptyString(string))) {
    var empty=[];
    fdjtAddClass(container,"noinput");
    empty.exact=[];
    empty.values=[];
    empty.strings=[];
    var displayed=cinfo._displayed;
    if (displayed) {
      var i=0; while (i<displayed.length) {
	var node=displayed[i++];
	node.removeAttribute('displayed');}}
    if ((fdjt_trace_completion)&&(displayed))
      fdjtLog("[%fs] Hiding %d displayed items in %o",
	      fdjtElapsedTime(),displayed.length,container);
    cinfo._displayed=[];
    return empty;}
  else if ((cinfo._curstring) && (string===cinfo._curstring)) {
    fdjtDropClass(container,"noinput");
    if (fdjt_trace_completion)
      fdjtLog("[%fs] Using %d cached results for %s against %o",
	      fdjtElapsedTime(),container._results.length,string,container);
    heads=cinfo._results;
    variations=heads.variations;
    strings=heads.strings;
    values=heads.values;}
  else {
    var qstring=((options&FDJT_COMPLETE_MATCHCASE)?(string):
		 (string.toLowerCase()));
    var prefixtree=cinfo.prefixtree;
    strings=fdjtPrefixFind(prefixtree,qstring,0);
    if (fdjt_detail_completion)
      fdjtLog("[%fs][+%fs] Found %d strings from %s/%s",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),
	      strings.length,qstring,string);
    if ((!(strings))||(strings.length===0)) {
      heads.variations=variations;
      heads.exact=[];
      heads.strings=strings;
      heads.values=values;
      cinfo._results=heads;
      cinfo._curstring=string;}
    else {
      var i=0; while (i<strings.length) {
	var completions=cmap[strings[i++]];
	var j=0; while (j<completions.length) {
	  var completion=completions[j++];
	  var head=(completion.completehead)||(fdjtGetCompleteHead(completion));
	  if (head===true) {
	    if (heads.indexOf(completion)<0) heads.push(completion);}
	  else if (heads.indexOf(head)<0) {
	    variations.push(completion);
	    heads.push(head);}}}
      // Accumulate values
      i=0; while (i<heads.length) values.push(heads[i++].value);
      /* Convert non-canonicalized strings */
      if (cinfo.stringmap) {
	var smap=cinfo.stringmap;
	var norms=[];
	var j=0; while (j<strings.length) {
	  norms[j]=smap[strings[j]]||strings[j];
	  j++;}
	heads.strings=norms;}
      else heads.strings=strings;
      if (fdjt_trace_completion)
	fdjtLog("[%fs][+%fs] Got %d(%d) matches from %d strings matching %s/%s",
		fdjtElapsedTime(),fdjtDeltaTime(timer),
		heads.length,variations.length,
		strings.length,string,qstring);}}
  var displayed=cinfo._displayed||[]; var hidden=0; var revealed=0;
  var counts=fdjtGetCompletionCounts(container);
  var overload=((maxcomplete)&&(heads.length>maxcomplete));
  i=0; while (i<displayed.length) {
    var node=displayed[i++];
    if ((overload)||((heads.indexOf(node)<0)&&(variations.indexOf(node)<0))) {
      node.removeAttribute("displayed"); hidden++;}}
  if (fdjt_detail_completion)
    fdjtLog("[%fs][+%fs] Hid %d of %d displayed items",
	    fdjtElapsedTime(),fdjtDeltaTime(timer),hidden,displayed.length);
  i=0; while (i<counts.length) {
    counts[i++].innerHTML=""+heads.length;}
  fdjtDropClass(container,"noinput");
  if (overload) {
    cinfo._displayed=[];
    fdjtAddClass(container,"maxcomplete");}
  else {
    fdjtDropClass(container,"maxcomplete");
    i=0; while (i<heads.length) {
      var head=heads[i++]; 
      head.setAttribute('displayed','yes');}
    i=0; while (i<variations.length) {
      var node=variations[i++]; 
      node.setAttribute('displayed','yes');}
    if (fdjt_detail_completion)
      fdjtLog("[%fs][+%fs] Revealed %d heads and %d variations",
	      fdjtElapsedTime(),fdjtDeltaTime(timer),
	      heads.length,variations.length);
    cinfo._displayed=heads.concat(variations);}
  if (fdjt_trace_completion)
    if (heads.length>10)
      fdjtTrace("[%fs][+%fs] Completing on %o over %o yields %d results",
		fdjtElapsedTime(),fdjtDiffTime(start),
		string,input_elt,heads.length);
    else fdjtTrace("[%fs][+%fs] Completing over %o on %o yields %d results: %o",
		   fdjtElapsedTime(),fdjtDiffTime(start),input_elt,
		   string,heads.length,heads.values);
  input_elt.completeString=string;
  heads.heads=heads; heads.variations=variations;
  cinfo._curstring=string;
  cinfo._results=heads;
  fdjtRedisplay(container);
  heads.exact=cmap[qstring]||[];
  heads.variations=variations;
  if (heads.length===0) fdjtAddClass(container,"noresults");
  return heads;
}
  
function fdjtGetCompleteHead(completion)
{
  var head=completion.completehead;
  if (head) return head;
  if (fdjtHasClass(completion,"variation")) {
    head=fdjtGetParentByClassName(completion,"completion");
    if (!(head)) {
      fdjtWarn("Couldn't find completion parent of %o",completion);
      completion.completehead=head=true;}
    else completion.completehead=head;}
  else completion.completehead=head=true;
  return head;
}

function fdjtGetCompletionCounts(container)
{
  var cinfo=fdjtEltInfo(container);
  if (cinfo._completioncounts)
    return cinfo._completioncounts;
  else {
    var children=fdjtGetChildrenByClassName(container,"completioncount");
    cinfo._completioncounts=children;
    return children;}
}

// This 'forces' a completion presumably when the user indicates a decisive
// action (like a return) as opposed to milder requests.
function fdjtForceComplete(input_elt)
{
  if (input_elt.value==="") return;
  var completions=fdjtComplete(input_elt,false,false);
  if (fdjt_trace_completion)
    fdjtLog("Trying to force completion on %o:",input_elt,completions);
  if ((completions) && (completions.length>0)) 
    return fdjtHandleCompletion(input_elt,completions[0],false);
  else return false;
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
  evt=evt||event||null;
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
    if (completions.getAttribute("INPUTID")) break;
    else completions=completions.parentNode;
  if (!(completions)) return;
  var input_elt=fdjt_get_completions_input(completions);
  var value=((target.value) ||
	     (target.getAttribute("value")) ||
	     (target.key));
  fdjtHandleCompletion(input_elt,target,value);
  fdjtDropClass(completions,"open");
}

var _fdjt_completion_timer=false;

function fdjtComplete_show(evt)
{
  evt=evt||event||null;
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

function fdjtComplete_toggleshowall(evt)
{
  evt=evt||event||null;
  var target=$T(evt);
  var container=FDJT$P(".completions",target);
  if (fdjtHasClass(container,"maxcomplete"))
    fdjtSwapClass(container,"maxcomplete","showmaxcomplete");
  else if (fdjtHasClass(container,"showmaxcomplete"))
    fdjtSwapClass(container,"showmaxcomplete","maxcomplete");
}

function fdjtComplete_onfocus(evt)
{
  evt=evt||event||null;
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
  evt=evt||event||null;
  var target=$T(evt);
  var keycode=evt.keyCode;
  var charcode=evt.charCode;
  var value=fdjtCompletionText(target);
  var options=target.completeopts||_fdjt_get_complete_opts(target);
  var cchars=
    fdjtCacheAttrib($T(evt),"enterchars",fdjtStringToKCodes,[-13]);    
  if (_fdjt_completion_timer) 
    clearTimeout(_fdjt_completion_timer);
  // fdjtTrace("Complete_onkey %o, cchars=%o",evt,cchars);
  if (((keycode) && (fdjtIndexOf(cchars,-keycode)>=0)) ||
      ((charcode) && (fdjtIndexOf(cchars,charcode)>=0))) {
    // These complete right away
    var results=fdjtComplete(target,false,options);
    // fdjtTrace("Escape complete on %o, results=%o",target,results);
    if (evt.preventDefault) evt.preventDefault(); else evt.returnValue=false;
    evt.cancelBubble=true;
    if (results.length>0) {
      var completions=fdjt_get_completions(target);
      fdjtHandleCompletion(target,results[0],results[0].value);
      fdjtDropClass(completions,"open");}
    else {}}
  else {
    if (fdjt_trace_completion)
      fdjtTrace("[%fs] Delaying handler fdjtComplete on %o",
		fdjtElapsedTime(),target);
    fdjtDelay(200,fdjtComplete,target,target,"completedelay");}
  return true;
}

function fdjtSetCompletions(id,completions)
{
  var current=document.getElementById(id);
  if (fdjt_trace_completion)
    if (current===completions)
      fdjtLog("[%fs] Completions for #%s are unchanged",fdjtElapsedTime(),id);
    else fdjtLog("[%fs] Setting current completions #%s=%o to %o/%d",
		 fdjtElapsedTime(),id,current,completions,
		 FDJT$(".completion",completions).length);
  if (!(current)) {
    fdjtWarn("Can't find current completions #%s",id);
    return;}
  fdjtReplace(current,completions);
  completions.id=id;
}

/* Setting cues */

function fdjtSetCompletionCues(div,cues,onmissing)
{
  var cinfo=fdjtEltInfo(div);
  var cur=cinfo._cues||[];
  var cmap=cinfo.completionmap;
  var vmap=cinfo.valuemap;
  var newcues=[];
  var i=0; var ilen=cues.length;
  while (i<ilen) {
    var cue=cues[i++];
    if (typeof cue === 'string')
      if (vmap[cue]) {
	var values=vmap[cue];
	var j=0; var jlen=values.length;
	while (j<jlen) newcues.push(values[j++]);}
      else if (onmissing) {
	var new_elt=onmissing(div,cue);
	if (new_elt) {
	  fdjtAdd(vmap,cue,new_elt);
	  newcues.push(new_elt);}}
      else {}
    else if (fdjtHasClass(cue,"completion"))
      newcues.push(cue);
    else {}}
  var i=0; while (i<newcues.length) {
    var cue=newcues[i++];
    if (!(fdjtContains(cur,cue))) {fdjtAddClass(cue,"cue");}}
  var i=0; while (i<cur.length) {
    var elt=cur[i++];
    if (!(fdjtContains(newcues,elt))) fdjtDropClass(elt,"cue");}
  cinfo._cues=newcues;
}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
