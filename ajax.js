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
	(((input.type==="RADIO") || (input.type==="CHECKBOX")) ?
	 (input.checked) : (true)))
      parameters=_fdjtAddParam(parameters,input.name,input.value);}
  var textareas=fdjtGetChildrenByTagName(form,"TEXTAREA");
  i=0; while (i<textareas.length) {
    var textarea=textareas[i++];
    if (!(textarea.disabled)) {
      parameters=_fdjtAddParam(parameters,textarea.name,textarea.value);}}
  return parameters;
}

function fdjtLaunchForm(form,action_arg,callback)
{
  try {
    fdjtAddClass(form,"submitting");
    var action=(action_arg)||form.action;
    var windowopts=(form.windowopts)||fdjtCacheAttrib(form,"windowopts");
    var target=form.getAttribute("target")||"fdjtform";
    var resetdelay=form.getAttribute("resetdelay");
    var params=fdjtFormParams(form);
    var win=window.open(action+"?"+params,target,windowopts);
    if (resetdelay!=="none") {
      var delay=((resetdelay) ? (parseInt(resetdelay)) : (3000));
      window.setTimeout(function() {
	  fdjtDropClass(form,"submitting");
	  if (callback) callback(false,form);
	  form.reset();},delay);}
    return true;}
  catch (ex) {
    form.fdjtlaunchfailed=true;
    fdjtDropClass(form,"submitting");
    if (!(form.fdjtsubmit)) form.submit();
    return false;}
}

function fdjtFormSubmit(form,action,callback)
{
  var target=form.target;
  var ajax_uri=(action)||(form.ajaxuri)||fdjtCacheAttrib(form,"ajaxuri");
  if (!(callback))
    if (form.oncallback) callback=form.oncallback;
    else if (form.getAttribute("ONCALLBACK")) {
      callback=new Function
	("req","form",input_elt.getAttribute("ONCALLBACK"));
      form.oncallback=callback;}
    else callback=false;
  if (ajax_uri) {
    var req=new XMLHttpRequest();
    var params=fdjtFormParams(form);
    fdjtAddClass(form,"submitting");
    if (form.method==="GET")
      req.open('GET', ajax_uri+"?"+params, true);
    else req.open('POST', ajax_uri, true);
    req.onreadystatechange=function () {
      fdjtTrace("Calling callback %o on %o and %o status=%o state=%o",
		callback,req,form,req.status,req.readyState);
      if ((req.readyState == 4) && (req.status == 200)) {
	fdjtDropClass(form,"submitting");
	callback(req,form);}
      else fdjtLaunchForm(form);};
    if (form.method==="GET") req.send();
    else {
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      // req.setRequestHeader("Content-length", params.length);
      // req.setRequestHeader("Connection", "close");
      req.send(params);}
    return true;}
  else try {
      fdjtLaunchForm(form,false,false,true);
      return true;}
    catch (ex) { return false;}
}

function fdjtForm_onsubmit(evt)
{
  var form=evt.target;
  fdjtAutoPrompt_cleanup(form);
  if (fdjtHasClass(form,"submitting")) {
    fdjtDropClass(form,"submitting");
    return;}
  form.fdjtsubmit=true;
  fdjtAddClass(form,"submitting");
  if (fdjtFormSubmit(form)) {evt.preventDefault(); return;}
  form.fdjtsubmit=false;
  window.setTimeout(function() {
      fjdtDropClass(form,"submitting");
      form.reset();},3000);
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

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
