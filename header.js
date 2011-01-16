/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2011 beingmeta, inc.
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

var fdjt_versions=((fdjt_versions)||(new Array()));
fdjt_versions.decl=function(name,num){
    if ((!(fdjt_versions[name]))||(fdjt_versions[name]<num)) fdjt_versions[name]=num;};
