/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2014 beingmeta, inc.
   This file was created from several component files and is
   part of the FDJT web toolkit (www.fdjt.org)

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   The copyright notice of the individual files are all prefixed by
   a copyright notice of the form "Copyright (C) ...".

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

fdjt.useGlobals=function(){
    if (!(window.fdjtDOM)) window.fdjtDOM=fdjt.DOM;
    if (!(window.fdjtUI)) window.fdjtUI=fdjt.UI;
    if (window.fdjtTime) window.fdjtTime=fdjt.Time;
    if (!(window.fdjtString)) window.fdjtString=fdjt.String;
    if (!(window.fdjtState)) window.fdjtState=fdjt.State;
    if (!(window.fdjtLog)) window.fdjtLog=fdjt.Log;
    if (!(window.fdjtHash)) window.fdjtHash=fdjt.Hash;
    if (!(window.fdjtAjax)) window.fdjtAjax=fdjt.Ajax;
    if (!(window.CodexLayout)) window.CodexLayout=fdjt.CodexLayout;
    if (!(window.RefDB)) window.RefDB=fdjt.RefDB;};

    
/*
if (!(window.((typeof _declare_fdjt_globals !== "undefined")&&(_declare_fdjt_globals)))) window.(((typeof _declare_fdjt_globals !== "undefined")&&(_declare_fdjt_globals)) {
var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtTime=fdjt.Time;
    var fdjtString=fdjt.String;
    var fdjtState=fdjt.State;
    var fdjtLog=fdjt.Log;
    var fdjtHash=fdjt.Hash;
    var fdjtAjax=fdjt.Ajax;
    var CodexLayout=fdjt.CodexLayout;
    var RefDB=fdjt.RefDB;}

*/
