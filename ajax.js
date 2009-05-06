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

var fdjt_ajax_id="$Id: handlers.js 40 2009-04-30 13:31:58Z haase $";
var fdjt_ajax_version=parseInt("$Revision: 40 $".slice(10,-1));

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


