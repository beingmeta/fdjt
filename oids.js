/* -*- Mode: Javascript; -*- */

var fdjt_oids_id="$Id$";
var fdjt_oids_version=parseInt("$Revision$".slice(10,-1));

/* Copyright (C) 2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
    of various kinds.

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

var fdjtOIDs={};
var fdjtPools={};
var fdjt_pool_count=0;
var fdjt_oid_count=0;
// We reserve the first 16 million fdjtids for dynamic allocation
var fdjt_next_pool=(256*256*256);
// Whether to trace OID initialization
var fdjt_trace_oids=false;

/* Get a pool */

function fdjtPool(base)
{
  if (fdjtPools[base]) return fdjtPools[base];
  this.base=base; this.idbase=fdjt_next_pool;
  fdjt_next_pool=fdjt_next_pool+(256*256*16);
  fdjtPools[base]=this;
  return this;
}

fdjtPool.ref=function(base) {
  return fdjtPools[base]||(new fdjtPool(base));};

/* sBook OIDs */

function fdjtOID(string,slots)
{
  if (fdjtOIDs[string])
    if (slots) {
      var data=fdjtOIDs[string];
      for (var slotid in slots) data[slotid]=slots[slotid];
      return data;}
    else return fdjtOIDs[string];
  if (string.length<3) return false;
  if (!((string[0]===':')&&(string[1]==='@'))) return false;
  var slash=string.indexOf('/'); 
  if (slash<0) return false;
  if (fdjt_trace_oids) fdjtLog("Creating oid %s from %o",string,slots);
  var offstart=string.length-5;
  var poolid=((slash<offstart)?(string.slice(0,offstart)):
	      (string.slice(0,slash)));
  var offid=parseInt(((slash<offstart)?(string.slice(offstart)):
		      (string.slice(slash+1))),16);
  var pool=fdjtPools[poolid]||(new fdjtPool(poolid));
  if (!(slots)) slots=this;
  slots._fdjtid=pool.idbase+offid;
  fdjtOIDs[string]=slots;
  fdjt_oid_count++;
  return slots;
}

function fdjtImportOID(slots)
{
  if (slots.oid)
    if (fdjtOIDs[slots.oid]) {
      var data=fdjtOIDs[slots.oid];
      for (var slotid in slots) data[slotid]=slots[slotid];
      return data;}
    else return new fdjtOID(slots.oid,slots);
  else return false;
}

