/* Copyright (C) 2008-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file implements (relatively) fast set operations using
    Javascript arrays to represent sets.
*/

var fdjt_setops_id="$Id$";
var fdjt_setops_version=parseInt("$Revision$".slice(10,-1));

function fdjtSet(arg,destructive)
{
  if (!(arg)) return new Array();
  else if (arg instanceof Array)
    if (arg.length<2) return arg;
    else if ((arg._sortlen) && ((arg._sortlen) === (arg.length)))
      return arg;
    else if (destructive) {}
    else {}
  else return new Array(arg);
}
