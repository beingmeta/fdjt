/* -*- Mode: Javascript; -*- */

var toc_id="$Id: fdjt.js 4077 2009-06-26 14:10:31Z haase $";
var toc_version=parseInt("$Revision: 4077 $".slice(10,-1));

/* Copyright (C) 2009 beingmeta, inc.
   This file implements a Javascript/DHTML UI for reading
    large structured documents (fdjt).

   For more information on fdjt, visit www.fdjt.net
   For more information on knowlets, visit www.knowlets.net
   For more information about beingmeta, visit www.beingmeta.com

   This library uses the FDJT (www.fdjt.org) toolkit.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

    Use and redistribution (especially embedding in other
      CC licensed content) is permitted under the terms of the
      Creative Commons "Attribution-NonCommercial" license:

          http://creativecommons.org/licenses/by-nc/3.0/ 

    Other uses may be allowed based on prior agreement with
      beingmeta, inc.  Inquiries can be addressed to:

       licensing@beingmeta.com

   Enjoy!

*/

// This is a list of the identified heads
var fdjt_TOCheads=[];
// This is a list of all the terminal content nodes
var fdjt_TOCnodes=[];

// Rules for building the TOC.  
var fdjt_TOClevels=
  {"H1": 1,"H2": 2,"H3": 3,"H4": 4,"H5": 5, "H6": 6, "H7": 7};

// This table maps IDs or NAMEs to elements.  This is different
//  from just their XML ids, because elements that have no ID but
//  have a 'nearby' named anchor will appear in this table.
var fdjtMD_hashmap={};

// Tag tables
var fdjt_TOCindex={};
var fdjt_context_index={};

var fdjt_tagfn=false;

function fdjtIndexTag(elt,tag,direct)
{
  if (typeof tag === "string") {
    if (direct) fdjtAdd(fdjt_TOCindex,tag,elt);
    fdjtAdd(fdjt_context_index,tag,elt);}
  else if (tag instanceof Array) {
    var i=0; while (i<tag.length) {
      var tagval=tag[i++];
      if (direct) fdjtAdd(fdjt_TOCindex,tagval,elt);
      fdjtAdd(fdjt_context_index,tagval,elt);}}
  else {}
}

/* Basic TOC functions */

function fdjtTOCLevel(elt)
{
  if (elt.getAttribute("toclevel")) {
    var tl=elt.getAttribute("toclevel");
    if (typeof tl === "number") return tl;
    else if ((tl==="no") || (tl==="none"))
      return false;
    else if (typeof tl === "string")
      tl=parseInt(tl);
    else return false;
    if ((typeof tl === "number") && (tl>0))
      return tl;
    else return false;}
  else {
    var tl=fdjtLookupElement(fdjt_TOClevels,elt);
    if (typeof tl === "number") return tl;
    else if (typeof tl === "function") return tl(elt);
    else return false;}
}

function fdjtTOCinfo(elt)
{
  if (!(elt)) return elt;
  else if (typeof elt === "string") {
    var real_elt=$(elt);
    if (real_elt) return fdjtTOCinfo(real_elt);
    else return false;}
  else if (!(elt.tocinfo))
    return false;
  else return elt.tocinfo;
}

function fdjtMakeTOCinfo(elt)
{
  var info;
  if (!(elt)) return elt;
  else if (typeof elt === "string") {
    var real_elt=$(elt);
    if (real_elt) return fdjtMakeTOCinfo(real_elt);
    else return false;}
  else if (info=elt.tocinfo) return info;
  else {
    var info=new Object();
    elt.tocinfo=info;
    return info;}
}

function fdjtTOChead(target)
{
  while (target)
    if (target.fjdtHead) return target.fjdtHead;break;
    else target=target.parentNode;
  return false;
}


/* Building the TOC */

var _fdjt_debug_toc_build=false;
var _fdjt_trace_toc_build=false;
var _fdjt_toc_built=false;
var _fdjt_attribute_tocinfo=false;
var fdjt_tagfn=false;

var _total_tagged_count=0; var _total_tag_count=0;

function fdjtBuildTOC()
{
  var start=new Date();
  if (_fdjt_toc_built) return;
  fdjtLog('Starting to gather tables of content from DOM');
  var body=document.body, children=body.childNodes, level=false;
  var bodyinfo=new Object();
  var tocstate={curlevel: 0,idserial:0,location: 0,tagstack: []};
  tocstate.curhead=body; tocstate.curinfo=bodyinfo;
  tocstate.knowlet=knowlet;
  // Location is an indication of distance into the document
  var location=0;
  body.tocinfo=bodyinfo; bodyinfo.starts_at=0;
  bodyinfo.level=0; bodyinfo.sub=new Array();
  bodyinfo.head=false; bodyinfo.heads=new Array();
  if (!(body.id)) body.id="TMPIDBODY";
  bodyinfo.id=body.id;
  /* Build the metadata */
  var i=0; while (i<children.length) 
	     fdjt_toc_builder(children[i++],tocstate); 
  var scan=tocstate.curhead, scaninfo=tocstate.curinfo;
  /* Close off all of the open spans in the TOC */
  while (scan) {
    scaninfo.ends_at=tocstate.location;
    scan=scaninfo.tocinfo;
    if (!(scan)) scan=false;
    if (scan) scaninfo=scan.tocinfo;}
  /* Sort the nodes by their Y offset in the document */
  fdjt_TOCnodes.sort(function(x,y) {
      if (x.Yoff<y.Yoff) return -1;
      else if (x.Yoff===y.Yoff) return 0;
      else return 1;});
  var done=new Date();
  fdjtLog('Finished gathering metadata in %f secs over %d/%d heads/nodes',
	  (done.getTime()-start.getTime())/1000,
	  fdjt_TOCheads.length,fdjt_TOCnodes.length);
  _fdjt_toc_build=true;
}

function _fdjt_transplant_TOC_content(content)
{
  var transplanted=[];
  var i=0; var j=0;
  while (i<content.length) {
    var transplant=fdjtTransplant(content[i++]);
    if (transplant) transplanted[j++]=transplant;}
  return transplanted;
}
function _fdjt_head_title(head)
{
  var title=fdjtCacheAttrib(head,title);
  if (!(title))
    return fdjtTextify(head,true);
  else if (typeof title === "string")
    if (title==="") return false;
    else return title;
  else return fdjtTextify(title,true);
}
 
function _fdjt_process_head(head,tocstate,level,curhead,curinfo,curlevel)
{
  var headinfo=fdjtMakeTOCinfo(head);
  var headid=fdjtGuessAnchor(head);
  /* Update global tables, arrays */
  fdjtComputeOffsets(head);
  fdjt_TOCnodes.push(head);
  fdjt_TOCheads.push(head);
  if ((headid) && (!(fdjt_hashmap[headid])))
    fdjt_hashmap[headid]=head;
  else headid=(head.id)||fdjtForceId(head);
  if (_fdjt_debug_toc_build)
    fdjtLog("Found head item %o under %o at level %d w/id=#%s ",
	    head,curhead,level,headid);
  /* Iniitalize the headinfo */
  head.tocinfo=headinfo;
  headinfo.starts_at=tocstate.location;
  headinfo.id=headid; headinfo.elt=head; headinfo.level=level;
  /* Head pointers */
  headinfo.head=curhead; headinfo.subheads=[];
  headinfo.heads=[].concat(curinfo.heads);
  /* Head content */
  headinfo.content=_fdjt_transplant_TOC_content(head.childNodes);
  headinfo.title=_fdjt_head_title(head);
  /* Next/prev pointers */
  headinfo.next=false; headinfo.prev=false;
  if (level>curlevel) {
    /* This is the simple case where we are a subhead
       of the current head. */
    headinfo.head=curhead;
    /* The 'intro' is the content between the head element at level N
       and the first head element at level N+1. */
    if (!(curinfo.intro_ends_at))
      curinfo.intro_ends_at=tocstate.location;
    curinfo.subheads.push(head);}
  else {
    /* We're not a subhead, so we're popping up at least one level.
      Climb the stack of headers, closing off entries and setting up
       prev/next pointers where needed.  This gets a little hairy.  */
    var scan=curhead;
    var scaninfo=curinfo;
    var scanlevel=curinfo.level;
    while (scaninfo) {
      if (_fdjt_debug_toc_build)
	fdjtLog("Finding head: scan=%o, info=%o, head=%o, cmp=%o",
		scan,scaninfo,scanlevel,scaninfo.head,(scanlevel<level));
      if (scanlevel<level) break;
      scaninfo.ends_at=tocstate.location;
      tocstate.tagstack.pop();
      /* This is the previous head at the current level, so store next/prev */
      if (level===scanlevel) { headinfo.prev=scan; scaninfo.next=head;}
      /* Get the next level up */
      var next=scaninfo.head; var nextinfo=((next) && (next.tocinfo));
      if ((nextinfo) && (nextinfo.head)) {
	scan=next; scaninfo=nextinfo; scanlevel=nextinfo.level;}
      else {
	scan=document.body; scaninfo=scan.tocinfo; scanlevel=0; break;}}
    /* The loop ends and we've found the head for this item. */
    if (_fdjt_debug_toc_build)
      fdjtLog("Found parent: up=%o, upinfo=%o, atlevel=%d, head=%o",
	      scan,scaninfo,scaninfo.level,scaninfo.head);
    /* Update the hierarchy.
       .head is on the element info, .fdjtHead is on the element itself. */
    headinfo.head=scan; head.fdjtHead=scan;
    scaninfo.subheads.push(head);}
  /* Now you've found your proper head */
  if ((_fdjt_trace_toc_build) || (_fdjt_debug_toc_build))
    fdjtLog("@%d: Found head=%o, headinfo=%o over elt=%o, info=%o",
	    tocstate.location,head,head.tocinfo,head,headinfo);
  /* Add yourself to your parent's subheads, and update the .heads
     field (which is all the heads).  */
  var super=headinfo.head;
  var superinfo=super.tocinfo;
  superinfo.subheads.push(child);
  headinfo.heads.push(head);
  /* Handle tags */
  var tagstring=((child.getAttribute("TAGS")) &&
		 (fdjtUnEntify(child.getAttribute("TAGS"))));
  var tags=fdjtSemiSplit(tagstring,"\\",fdjt_tagfn);
  if (headinfo.title) tags.push("\u00a7"+headinfo.title);
  var i=0; while (i<tags.length) fdjtIndexTag(head,tags[i++],true);
  /* Update the toc state */
  tocstate.curhead=head;
  tocstate.curinfo=headinfo;
  tocstate.curlevel=level;
  tocstate.location=tocstate.location+fdjtFlatWidth(head);  
  tocstate.tagstack.push(tags);
}

function fdjt_toc_builder(child,tocstate)
{
  var location=tocstate.location;
  var curhead=tocstate.curhead;
  var curinfo=tocstate.curinfo;
  var curlevel=tocstate.curlevel;
  var level=0;
  // Location tracking and TOC building
  if (child.nodeType===3) {
    var width=child.nodeValue.length;
    child.tocloc=tocstate.location;
    tocstate.location=tocstate.location+width;}
  else if (child.nodeType!==1) {
    // Not sure what these cases are, but we just store a head pointer
    child.fdjtHead=curhead;}
  else if (level=fdjtTOClevel(child)) 
    _fdjt_process_head(child,tocstate,level,curhead,curinfo,curlevel);
  else if ((child.tagName) && (child.tagName==="DIV")) {
    var starts_at=tocstate.location; var nodecount=fdjt_TOCnodes.length;
    var children=child.childNodes; var last_child=false;
    if (children) {
      var i=0; while (i<children.length)
		 fdjt_toc_builder(children[i++],tocstate);}
    child.fdjtHead=curhead; child.tocloc=tocstate.location;
    fdjtComputeOffsets(child); fdjt_TOCnodes.push(child);}
  else {
    var width=fdjtFlatWidth(child);
    var loc=tocstate.location+width/2;
    fdjt_TOCnodes.push(child);
    child.tocloc=loc; child.fdjtHead=curhead;
    tocstate.location=tocstate.location+width;
    fdjtComputeOffsets(child);}
  var tagstack=toc.tagstack;
  var i=0; while (i<tagstack.length) {
    var tags=tagstack[i++];
    var j=0; while (j<tags.length) fdjtIndexTag(child,tags[j++]);}
  if ((level===0) && (child.getAttribute) && (child.getAttribute("TAGS"))) {
    var tagstring=((child.getAttribute("TAGS")) &&
		   (fdjtUnEntify(child.getAttribute("TAGS"))));
    var tags=fdjtSemiSplit(tagstring,"\\",fdjt_tagfn);
    var i=0; while (i<tags.length) fdjtIndexTag(child,tags[i++],true);}
  /* This can simplify debugging by making info visible in DOM browsers */
  if ((_fdjt_attribute_tocinfo) && (child.setAttribute)) {
    if (child.tocloc) child.setAttribute("tocloc",child.tocloc);}
}
