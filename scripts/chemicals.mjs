#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {page,table,writeOut} from './lib/render.mjs';
import {table as textTable} from './lib/format.mjs';

const reads={
 sites:'select * from sites order by code',locations:'select l.code,l.name,s.code as site from locations l join sites s on s.id=l.site_id order by l.code',
 chemicals:'select * from chemicals order by code',containers:'select * from v_containers order by code',
 stocktake:"select code,chemical,site,location,quantity,unit,counted_on,owner from v_containers where state<>'removed' order by counted_on nulls first,code",
 expiring:"select code,chemical,site,quantity,unit,expires_on,owner from v_containers where state='stock' and quantity>0 and expires_on<=current_date+30 order by expires_on,code",
 waste:"select code,chemical,site,location,quantity,unit,owner from v_containers where state='waste' order by site,code",
 'site-inventory':'select * from v_site_inventory order by site,chemical_code',compliance:'select * from v_compliance order by site,record,rule',
 attention:'select * from v_attention order by site,record,reason',actions:'select a.*,s.code as site from actions a join sites s on s.id=a.site_id order by due_on,code',
 'owner-load':"select owner,count(*)::int as findings,count(distinct record)::int as records from v_attention group by owner order by findings desc,owner",
 activity:'select * from audit order by created_at,id'
};
const mutations=['add-site','review-site','add-location','add-chemical','review-chemical','add-container','set-maximum','log-stock','add-action','close-action','import'];
export const commands=[...Object.keys(reads),'container','weekly-review',...mutations,'export','draft-inventory','draft-handover','help'];
const entities=new Set(['sites','locations','chemicals','containers','actions']);
function parse(args){let pos=[],opt={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in opt)throw Error(`Duplicate option --${k}`);opt[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {pos,opt};}
function required(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();}
function num(v,label){if(typeof v==='boolean'||v===undefined||v===null||String(v).trim()===''||!/^\d+(?:\.\d{1,6})?$/.test(String(v)))throw Error(`Invalid ${label}: use a nonnegative number with at most six decimals`);const n=Number(v);if(!Number.isFinite(n)||n>9999999999)throw Error(`Invalid ${label}`);return String(v);}
function date(v,label){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid ${label}: use YYYY-MM-DD`);return v;}
const day=()=>new Date().toISOString().slice(0,10);
function bool(v){if(v==='true')return true;if(v==='false')return false;if(v==='unknown'||v===undefined||v==='')return null;throw Error('hazardous must be true, false or unknown');}
function unit(v){if(!['L','kg','count'].includes(v))throw Error('unit must be L, kg or count; convert the source deliberately before import');return v;}
function code(o){const v=required(o,'code');if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(v))throw Error('code must use letters, numbers, dots, hyphens, colons or underscores');return v;}
function optionDate(o,k){return o[k]===undefined?null:date(required(o,k),k);}
export async function resolve(db,entity,term){
 if(!entities.has(entity))throw Error('Unknown entity');if(!term)throw Error(`Specify a ${entity} code, id or name`);
 const exact=await db.query(`select * from ${entity} where lower(code)=lower($1) or id::text=$1`,[term]);if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from ${entity} where starts_with(id::text,lower($1)) or position(lower($1) in lower(name))>0 order by code`,[term]);
 if(rows.length===1)return rows[0];const e=Error(rows.length?`Ambiguous ${entity}: ${term}`:`No ${entity} match: ${term}`);e.candidates=rows.map(x=>({id:x.id,code:x.code,name:x.name}));throw e;
}
async function audit(db,actor,operation,before,after){await db.query('insert into audit(actor,operation,record_id,before_record,after_record) values($1,$2,$3,$4::jsonb,$5::jsonb)',[actor,operation,after.id,JSON.stringify(before),JSON.stringify(after)]);}
async function insert(db,entity,data,actor,operation){const keys=Object.keys(data);const rows=await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(data));await audit(db,actor,operation,null,rows[0]);return rows[0];}
async function update(db,entity,before,data,actor,operation){const keys=Object.keys(data);const rows=await db.query(`update ${entity} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(data),before.id]);await audit(db,actor,operation,before,rows[0]);return rows[0];}
const hash=x=>createHash('sha256').update(x).digest('hex').slice(0,24);
async function loadRows(file,sheet){
 if(path.extname(file).toLowerCase()==='.csv')return parseCsv(fs.readFileSync(file,'utf8'));
 if(path.extname(file).toLowerCase()!=='.xlsx')throw Error('Use a CSV or XLSX export');
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);
 const ws=sheet?book.getWorksheet(sheet):book.worksheets.length===1?book.worksheets[0]:null;if(!ws)throw Error('Choose --sheet= for a workbook with multiple sheets');
 const cellValue=c=>{if(c.type===ExcelJS.ValueType.Formula)throw Error('Formula cells are not accepted: export values only');if(c.value instanceof Date)return c.value.toISOString().slice(0,10);return c.text;};
 const rows=[];let headers;ws.eachRow(row=>{const values=Array.from({length:ws.columnCount},(_,i)=>cellValue(row.getCell(i+1)));if(!headers){headers=values.map(x=>x.trim());if(headers.some(x=>!x)||new Set(headers.map(x=>x.toLowerCase())).size!==headers.length)throw Error('XLSX requires unique nonempty headers');}else if(values.some(x=>x!==''))rows.push(Object.fromEntries(headers.map((x,i)=>[x,values[i]])));});return rows;
}
async function importRows(db,o,actor){
 const source=required(o,'source');const site=await resolve(db,'sites',required(o,'site'));
 const mapping=JSON.parse(fs.readFileSync(required(o,'map'),'utf8'));const allowed=['barcode','name','location','quantity','unit','owner','lot','expiry','counted','state','cas','hazardous','un_number','storage_notes','sds_reference'];
 for(const k of Object.keys(mapping))if(!allowed.includes(k)||typeof mapping[k]!=='string')throw Error(`Invalid mapping ${k}`);
 for(const k of ['barcode','name','location','quantity','unit','owner'])if(!mapping[k])throw Error(`Mapping requires ${k}`);
 const rows=await loadRows(required(o,'file'),o.sheet);if(!rows.length)throw Error('Empty export');let inserted=0,unchanged=0;
 const seen=new Set();for(let index=0;index<rows.length;index++){
  const row=rows[index];for(const header of Object.values(mapping))if(!(header in row))throw Error(`Missing mapped column: ${header}`);
  const get=k=>mapping[k]?String(row[mapping[k]]??'').trim():'';
  for(const k of ['barcode','name','location','quantity','unit','owner'])if(!get(k))throw Error(`Row ${index+2}: missing ${k}`);
  const barcode=get('barcode');if(seen.has(barcode))throw Error(`Duplicate barcode in batch: ${barcode}`);seen.add(barcode);
  const quantity=num(get('quantity'),'quantity'),u=unit(get('unit')),expires=get('expiry')?date(get('expiry'),'expiry'):null,counted=get('counted')?date(get('counted'),'counted'):null;
  if(counted&&counted>day())throw Error('Stocktake date cannot be in the future');
  const state=get('state')||'stock';if(!['stock','waste','removed'].includes(state)||state==='removed'&&quantity!==0)throw Error('Invalid stock state or nonzero removed stock');
  const hazardous=bool(get('hazardous'));const existing=(await db.query('select * from containers where source=$1 and external_id=$2',[source,barcode]))[0];
  const original={site:site.code,mapping,row};
  if(existing){if(JSON.stringify(existing.original)!==JSON.stringify(original)){
   // JSONB sorts object keys. Compare values canonically, not key order.
   const canonical=v=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
   if(JSON.stringify(canonical(existing.original))!==JSON.stringify(canonical(original)))throw Error(`Changed duplicate ${barcode}: reconcile through log-stock, never overwrite history`);
  }unchanged++;continue;}
  const chemCode='IMP-'+hash(source+'|'+get('name').toLowerCase()+'|'+u);
  let chem=(await db.query('select * from chemicals where code=$1',[chemCode]))[0];
  if(!chem)chem=await insert(db,'chemicals',{code:chemCode,name:get('name'),unit:u,hazardous,cas:get('cas')||null,un_number:get('un_number')||null,storage_notes:get('storage_notes')||null,sds_reference:get('sds_reference')||null},actor,'import-chemical');
  else if(chem.hazardous!==hazardous||(chem.cas||'')!==get('cas'))throw Error(`Conflicting chemical definition: ${get('name')}`);
  const locCode='IMP-'+hash(site.id+'|'+get('location').toLowerCase());let loc=(await db.query('select * from locations where code=$1',[locCode]))[0];
  if(!loc)loc=await insert(db,'locations',{code:locCode,name:get('location'),site_id:site.id},actor,'import-location');
  await insert(db,'containers',{code:'IMP-'+hash(source+'|'+barcode),name:get('name')+' ['+barcode+']',chemical_id:chem.id,location_id:loc.id,quantity,owner:get('owner'),lot:get('lot')||null,expires_on:expires,counted_on:counted,state,source,external_id:barcode,original:JSON.stringify(original)},actor,'import-container');inserted++;
 }
 return {inserted,unchanged,rows:rows.length,notice:'Review imported hazard information, safety sheets and site maxima before operational use.'};
}
async function mutate(db,cmd,pos,o){
 const actor=required(o,'actor');await db.exec('BEGIN');
 try{
 let result;
 if(cmd==='add-site')result=await insert(db,'sites',{code:code(o),name:required(o,'name'),owner:required(o,'owner')},actor,cmd);
 if(cmd==='review-site'){const r=await resolve(db,'sites',pos[0]);result=await update(db,'sites',r,{inventory_access:required(o,'access'),access_review_due:date(required(o,'due'),'due')},actor,cmd);}
 if(cmd==='add-location'){const s=await resolve(db,'sites',required(o,'site'));result=await insert(db,'locations',{code:code(o),name:required(o,'name'),site_id:s.id},actor,cmd);}
 if(cmd==='add-chemical')result=await insert(db,'chemicals',{code:code(o),name:required(o,'name'),unit:unit(required(o,'unit')),hazardous:bool(o.hazardous),cas:o.cas||null},actor,cmd);
 if(cmd==='review-chemical'){
 const r=await resolve(db,'chemicals',pos[0]);const hazardous=bool(required(o,'hazardous'));if(hazardous===null)throw Error('A completed review needs true or false');
 const un=required(o,'un');if(un!=='none'&&!/^\d{4}$/.test(un))throw Error('un must be four digits or none after human review');
 result=await update(db,'chemicals',r,{hazardous,un_number:un==='none'?null:un,un_reviewed:true,storage_notes:required(o,'storage'),sds_reference:required(o,'sds'),sds_review_due:date(required(o,'due'),'due')},actor,cmd);
 }
 if(cmd==='add-container'){
 const ch=await resolve(db,'chemicals',required(o,'chemical')),l=await resolve(db,'locations',required(o,'location'));const quantity=num(required(o,'quantity'),'quantity');
 result=await insert(db,'containers',{code:code(o),name:required(o,'name'),chemical_id:ch.id,location_id:l.id,quantity,owner:required(o,'owner'),lot:o.lot||null,expires_on:optionDate(o,'expiry')},actor,cmd);
 }
 if(cmd==='set-maximum'){
 const s=await resolve(db,'sites',required(o,'site')),ch=await resolve(db,'chemicals',required(o,'chemical'));
 const data={site_id:s.id,chemical_id:ch.id,maximum_quantity:num(required(o,'quantity'),'quantity'),basis:required(o,'basis'),reviewed_by:actor,review_due:date(required(o,'due'),'due')};
 const before=(await db.query('select * from site_maxima where site_id=$1 and chemical_id=$2',[s.id,ch.id]))[0];result=before?await update(db,'site_maxima',before,data,actor,cmd):await insert(db,'site_maxima',data,actor,cmd);
 }
 if(cmd==='log-stock'){
 let r=await resolve(db,'containers',pos[0]);r=(await db.query('select * from containers where id=$1 for update',[r.id]))[0];
 if(r.state==='removed')throw Error('Removed containers cannot be changed');const kind=required(o,'kind'),evidence=required(o,'evidence');let data={};
 if(kind==='count'){data.quantity=num(required(o,'quantity'),'quantity');data.counted_on=date(o.day||day(),'day');if(data.counted_on>day())throw Error('Count date cannot be future');if(r.counted_on&&data.counted_on<r.counted_on)throw Error('Count date cannot precede the latest count');}
 else if(kind==='consume'||kind==='receive'){if(r.state!=='stock')throw Error('Only stock containers can receive or consume');const n=num(required(o,'quantity'),'quantity');if(n<=0)throw Error('Movement quantity must be positive');data.quantity=(await db.query('select $1::numeric + $2::numeric as quantity',[r.quantity,kind==='consume'?'-'+n:n]))[0].quantity;if(data.quantity<0)throw Error('Insufficient stock');if(data.quantity>9999999999)throw Error('Quantity exceeds supported range');}
 else if(kind==='move')data.location_id=(await resolve(db,'locations',required(o,'location'))).id;
 else if(kind==='waste'){if(r.state==='waste')throw Error('Already marked as waste');data.state='waste';}
 else if(kind==='remove'){if(r.state!=='waste')throw Error('Mark waste before recording offsite collection');data.state='removed';data.quantity=0;}
 else throw Error('kind must be count, consume, receive, move, waste or remove');
 result=await update(db,'containers',r,data,actor,cmd);
 await insert(db,'stock_events',{container_id:r.id,kind,before_quantity:r.quantity,after_quantity:result.quantity,from_location:r.location_id,to_location:result.location_id,actor,evidence},actor,'stock-event');
 }
 if(cmd==='add-action'){const s=await resolve(db,'sites',required(o,'site'));result=await insert(db,'actions',{code:code(o),name:required(o,'name'),site_id:s.id,owner:required(o,'owner'),due_on:date(required(o,'due'),'due')},actor,cmd);}
 if(cmd==='close-action'){let r=await resolve(db,'actions',pos[0]);r=(await db.query('select * from actions where id=$1 for update',[r.id]))[0];if(r.status==='closed')throw Error('Already closed');result=await update(db,'actions',r,{status:'closed',resolution:required(o,'resolution')},actor,cmd);}
 if(cmd==='import'){if(pos[0]!=='labcup')throw Error('Supported import: labcup');result=await importRows(db,o,actor);}
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return {dry_run:Boolean(o['dry-run']),result};
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export async function run(db,args){
 const {pos,opt:o}=parse(args);let cmd=pos.shift()||'help';if(o.help)cmd='help';
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}. Run help.`);
 const argsByCommand={
 'add-site':['code','name','owner'],'review-site':['access','due'],'add-location':['code','name','site'],
 'add-chemical':['code','name','unit','hazardous','cas'],'review-chemical':['hazardous','un','storage','sds','due'],
 'add-container':['code','name','chemical','location','quantity','owner','lot','expiry'],
 'set-maximum':['site','chemical','quantity','basis','due'],'log-stock':['kind','evidence','quantity','day','location'],
 'add-action':['code','name','site','owner','due'],'close-action':['resolution'],
 import:['file','map','source','site','sheet'],export:['out']};
 const allowed=new Set(['json','help',...(argsByCommand[cmd]||[]),...(mutations.includes(cmd)?['actor','dry-run']:[])]);
 for(const [k,v] of Object.entries(o)){if(!allowed.has(k))throw Error(`Unknown option --${k} for ${cmd}`);if(['json','help','dry-run'].includes(k)&&v!==true)throw Error(`--${k} takes no value`);}
 const positional=new Set(['container','review-site','review-chemical','log-stock','close-action','import','draft-inventory','draft-handover']);
 if(pos.length>(positional.has(cmd)?1:0))throw Error('Unexpected positional argument');

 if(cmd==='help')return {commands,usage:'npm run chemicals -- <command> [code or name] --key=value --json',mutations:'All changes require --actor= and support --dry-run. Read docs/operations.md for arguments.'};
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='container'){const r=await resolve(db,'containers',pos[0]);return {container:r,events:await db.query('select * from stock_events where container_id=$1 order by created_at,id',[r.id])};}
 if(cmd==='weekly-review')return {attention:await db.query(reads.attention),compliance:await db.query(reads.compliance),expiring:await db.query(reads.expiring)};
 if(mutations.includes(cmd))return mutate(db,cmd,pos,o);
 if(cmd==='export'){
 const dest=required(o,'out');const data={format:'chemical-inventory-v1',exported_at:new Date().toISOString(),records:{}};
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of ['sites','locations','chemicals','containers','site_maxima','stock_events','actions','audit'])data.records[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
 fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true,mode:0o700});fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:path.resolve(dest),counts:Object.fromEntries(Object.entries(data.records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='draft-inventory'||cmd==='draft-handover'){
 const s=await resolve(db,'sites',pos[0]);const rows=await db.query(cmd==='draft-inventory'?'select * from v_site_inventory where site_id=$1 order by chemical_code':"select v.* from v_containers v join locations l on l.code=v.location where l.site_id=$1 and state='waste' order by code",[s.id]);
 const checks=await db.query('select * from v_compliance where site=$1 order by record,rule',[s.code]);
 const title=cmd==='draft-inventory'?'Hazardous substances inventory working draft':'Waste handover working draft';
 const file=writeOut('drafts',`${cmd}-${s.code}-${randomUUID()}`,page({title,subtitle:s.name,sections:[{title:'Operator review required',note:'Fictional demo records are not chemical safety information. Confirm the substances, maxima, safety sheets and physical access before use. Nothing is sent.',html:''},{title:'Records',html:table(rows)},{title:'Record gaps',html:table(checks)}]}));return {file,records:rows.length};
 }
}
export function human(value){
 if(Array.isArray(value)){if(!value.length)return 'No records.';const keys=Object.keys(value[0]).filter(k=>!['id','site_id','created_at','updated_at','original'].includes(k));return textTable(value,keys.map(key=>({key,label:key.replaceAll('_',' '),format:v=>v===null?'unknown':typeof v==='object'?JSON.stringify(v):String(v)})));}
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}\n${typeof v==='object'?human(v):v}`).join('\n\n');return String(value);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}
 catch(e){if(process.argv.includes('--json'))console.log(JSON.stringify({error:e.message,...(e.candidates?{candidates:e.candidates}:{})}));else{console.error(e.message);if(e.candidates)console.error(human(e.candidates));}process.exitCode=1;}finally{if(db)await db.close();}
}
