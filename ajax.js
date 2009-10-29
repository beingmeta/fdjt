/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2007-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides an abstraction layer for Ajax calls

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

var fdjt_ajax_id="$Id$";
var fdjt_ajax_version=parseInt("$Revision$".slice(10,-1));

var fdjt_trace_ajax=false;

function fdjtComposeAjaxURI(base_uri,args)
{
  var uri=base_uri; var need_amp=false;
  if (base_uri[-1]==='&') need_amp=false;
  else if (base_uri.indexOf('?')>=0) need_amp=true;
  else uri=base_uri+"?";
  var i=0; while (i<args.length) {
    uri=uri+((need_amp) ? ("&") : (""))+args[i]+"="+args[i+1];
    i=i+2;}
  return uri;
}

function fdjtAjaxCall(callback,base_uri,args)
{
  var req=new XMLHttpRequest();
  req.onreadystatechange=function () {
    if ((req.readyState == 4) && (req.status == 200)) {
      callback(req);}};
  var uri=fdjtComposeAjaxURI(base_uri,arguments);
  req.open("GET",uri,true);
  req.send(null);
}

function fdjtAjaxTextCall(callback,base_uri)
{
  return fdjtAjaxCall(function(req) {
      callback(req.responseText);},
    base_uri,fdjtArguments(arguments,2));
}

function fdjtAjaxJSONCall(callback,base_uri)
{
  return fdjtAjaxCall(function(req) {
      callback(JSON.parse(req.responseText));},
    base_uri,fdjtArguments(arguments,2));
}

function fdjtAjaxXMLCall(callback,base_uri)
{
  return fdjtAjaxCall(function(req) {
      callback(req.responseXML);},
    base_uri,fdjtArguments(arguments,2));
}

function fdjtJSONPCall(uri,id,cleanup)
{
  if ((id)&&($(id))) return false;
  var script_elt=fdjtNewElement("SCRIPT");
  if (id) script_elt.id=id;
  if (cleanup) script_elt.oncleanup=cleanup;
  script_elt.language='javascript';
  script_elt.src=uri;
  document.body.appendChild(script_elt);
}

function fdjtJSONPFinish(id)
{
  var script_elt=$(id);
  if (!(script_elt)) return;
  if (script_elt.oncleanup) script_elt.oncleanup();
  fdjtRemove(script_elt);
}

/* AJAX submit */

function _fdjtAddParam(parameters,name,value)
{
  return ((parameters)?(parameters+"&"):(""))+
    name+"="+encodeURIComponent(value);
}

function fdjtFormParams(form)
{
  fdjtAutoPrompt_cleanup(form);
  var parameters=false;
  var inputs=fdjtGetChildrenByTagName(form,"INPUT");
  var i=0; while (i<inputs.length) {
    var input=inputs[i++];
    if ((!(input.disabled)) &&
	(((input.type==="radio") || (input.type==="checkbox")) ?
	 (input.checked) : (true)))
      parameters=_fdjtAddParam(parameters,input.name,input.value);}
  var textareas=fdjtGetChildrenByTagName(form,"TEXTAREA");
  i=0; while (i<textareas.length) {
    var textarea=textareas[i++];
    if (!(textarea.disabled)) {
      parameters=_fdjtAddParam(parameters,textarea.name,textarea.value);}}
  var selectboxes=fdjtGetChildrenByTagName(form,"SELECT");
  i=0; while (i<selectboxes.length) {
    var selectbox=selectboxes[i++]; var name=selectbox.name;
    var options=fdjtGetChildrenByTagName(selectbox,"OPTION");
    var j=0; while (j<options.length) {
      var option=options[j++];
      if (option.selected)
	parameters=_fdjtAddParam(parameters,name,option.value);}}
  return parameters;
}

function fdjtAjaxSubmit(form)
{
  var bridge=form.ajaxbridge||false;
  var ajax_uri=(form.ajaxuri)||fdjtCacheAttrib(form,"ajaxuri");
  if (!(ajax_uri)) return false;
  if ((bridge)&&(bridge!==window)) 
    try {
      return bridge.fdjtAjaxSubmit(form);}
    catch (ex) {
      fdjtLog("Bridge call yielded %o",ex);
      return false;}
  var callback=false;
  if (form.oncallback) callback=form.oncallback;
  else if (form.getAttribute("ONCALLBACK")) {
    callback=new Function
      ("req","form",input_elt.getAttribute("ONCALLBACK"));
    form.oncallback=callback;}
  var success=false;
  var req=new XMLHttpRequest();
  var params=fdjtFormParams(form);
  fdjtAddClass(form,"submitting");
  req.onreadystatechange=function () {
    if ((req.readyState === 4) && (req.status>=200) && (req.status<300)) {
      fdjtDropClass(form,"submitting");
      success=true;
      callback(req,form);}};
  if (form.method==="GET")
    req.open('GET',ajax_uri+"?"+params,false);
  else req.open('POST',ajax_uri,false);
  if (form.method==="GET") req.send();
  else {
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // req.setRequestHeader("Content-length", params.length);
    // req.setRequestHeader("Connection", "close");
    req.send(params);}
  return success;
}

function fdjtJSONPSubmit(form)
{
  var jsonp_uri=(form.jsonpuri)||fdjtCacheAttrib(form,"jsonpuri");
  if (!(jsonp_uri)) return false;
  var success=false;
  var jsonid=((form.id)?("JSONP"+form.id):("FORMJSONP")):
  fdjtAddClass(form,"submitting");
  try {
    fdjtJSONPCall
      (jsonp_uri+"?"+params,jsonid,
       function(){fdjtDropClass(form,"submitting")});}
  catch (ex) {
    fdjtJSONPFinish(jsonid);
    fdjtWarn("Attempted JSONP call signalled %o",ex);
    return false;}
  return true;
}

function fdjtForm_onsubmit(evt)
{
  var form=$T(evt);
  fdjtAutoPrompt_cleanup(form);
  if (fdjtHasClass(form,"submitting")) {
    fdjtDropClass(form,"submitting");
    return;}
  if (form.fdjtlaunchfailed) return;
  form.fdjtsubmit=true;
  fdjtAddClass(form,"submitting");
  if (fdjtAjaxSubmit(form)) {
    evt.preventDefault(); return;}
  else if (fdjtJSONPSubmit(form)) {
    evt.preventDefault(); return;}
  else return;
}

/* Synchronous calls */

function fdjtAjaxGet(callback,base_uri,args)
{
  var req=new XMLHttpRequest();
  var uri=fdjtComposeAjaxURI(base_uri,args);
  req.open("GET",uri,false);
  req.send(null);
  return callback(req);
}

function fdjtAjaxGetText(base_uri)
{
  return fdjtAjaxGet(function (req) { return req.responseText; },
		     base_uri,fdjtArguments(arguments,1));
}

function fdjtAjaxGetJSON(base_uri)
{
  return fdjtAjaxGet(function (req) { return JSON.parse(req.responseText); },
		     base_uri,fdjtArguments(arguments,1));
}

function fdjtAjaxGetXML(base_uri)
{
  return fdjtAjaxGet(function (req) { return JSON.parse(req.responseXML); },
		     base_uri,fdjtArguments(arguments,1));
}

function fdjtAjaxProbe(uri)
{
  var req=new XMLHttpRequest();
  req.open("GET",uri,false);
  req.send(null);
  if ((req.readyState === 4) && (req.status >= 200) && (req.status < 300))
    return true;
  else return false;
}

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
