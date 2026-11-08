create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table sites (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 owner text not null, inventory_access text, access_review_due date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table locations (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 site_id uuid not null references sites(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table chemicals (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 cas text, unit text not null check(unit in ('L','kg','count')), hazardous boolean,
 un_number text, un_reviewed boolean not null default false,
 storage_notes text, sds_reference text, sds_review_due date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table containers (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 chemical_id uuid not null references chemicals(id), location_id uuid not null references locations(id),
 quantity numeric(16,6) not null check(quantity>=0), owner text not null, lot text,
 expires_on date, counted_on date, state text not null default 'stock' check(state in ('stock','waste','removed')),
 source text, external_id text, original jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source,external_id), check(state<>'removed' or quantity=0)
);
create table site_maxima (
 id uuid primary key default gen_random_uuid(), site_id uuid not null references sites(id), chemical_id uuid not null references chemicals(id),
 maximum_quantity numeric(16,6) not null check(maximum_quantity>=0), basis text not null, reviewed_by text not null, review_due date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(site_id,chemical_id)
);
create table stock_events (
 id uuid primary key default gen_random_uuid(), container_id uuid not null references containers(id), kind text not null,
 before_quantity numeric(16,6) not null, after_quantity numeric(16,6) not null,
 from_location uuid not null references locations(id), to_location uuid not null references locations(id),
 actor text not null, evidence text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, site_id uuid not null references sites(id),
 owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','closed')), resolution text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(status='open' or length(trim(resolution))>0)
);
create table audit (
 id uuid primary key default gen_random_uuid(), actor text not null, operation text not null, record_id uuid not null,
 before_record jsonb, after_record jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['sites','locations','chemicals','containers','site_maxima','stock_events','actions','audit'] loop
 execute format('create trigger touch_updated before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop; end $$;
create index containers_chemical_location on containers(chemical_id,location_id);
create index stock_events_container on stock_events(container_id,created_at);
create view v_containers as
 select c.id,c.code,c.name,ch.code as chemical_code,ch.name as chemical,ch.unit,l.code as location,s.code as site,c.quantity,c.owner,c.lot,c.expires_on,c.counted_on,c.state
 from containers c join chemicals ch on ch.id=c.chemical_id join locations l on l.id=c.location_id join sites s on s.id=l.site_id;
create view v_site_inventory as
 with pairs as (select l.site_id,c.chemical_id from containers c join locations l on l.id=c.location_id where c.state<>'removed'
 union select site_id,chemical_id from site_maxima), quantities as (
 select l.site_id,c.chemical_id,sum(c.quantity) as onsite_quantity,sum(case when c.state='waste' then c.quantity else 0 end) as waste_quantity,
 string_agg(distinct l.name,', ' order by l.name) as locations
 from containers c join locations l on l.id=c.location_id where c.state<>'removed' group by l.site_id,c.chemical_id)
 select s.id as site_id,s.code as site,ch.code as chemical_code,ch.name as chemical,ch.unit,ch.hazardous,ch.un_number,ch.un_reviewed,
 coalesce(q.onsite_quantity,0) as onsite_quantity,coalesce(q.waste_quantity,0) as waste_quantity,q.locations,
 m.maximum_quantity,m.basis,m.review_due,ch.storage_notes,ch.sds_reference,ch.sds_review_due
 from pairs p join sites s on s.id=p.site_id join chemicals ch on ch.id=p.chemical_id
 left join quantities q on q.site_id=p.site_id and q.chemical_id=p.chemical_id
 left join site_maxima m on m.site_id=p.site_id and m.chemical_id=p.chemical_id;
create view v_compliance as
 select site,chemical_code as record,'INV-CLASS' as rule,'Hazard status needs a human review' as issue from v_site_inventory where hazardous is null
 union all select site,chemical_code,'INV-MAX','Declared maximum missing, stale or below recorded onsite quantity' from v_site_inventory
 where hazardous is distinct from false and (maximum_quantity is null or review_due<current_date or onsite_quantity>maximum_quantity)
 union all select site,chemical_code,'INV-STORAGE','Storage and segregation instructions missing' from v_site_inventory where hazardous is distinct from false and coalesce(trim(storage_notes),'')=''
 union all select site,chemical_code,'INV-UN','UN number applicability has not been reviewed' from v_site_inventory where hazardous is distinct from false and not un_reviewed
 union all select site,chemical_code,'SDS-REVIEW','Safety sheet reference missing or review due' from v_site_inventory where hazardous is distinct from false and (coalesce(trim(sds_reference),'')='' or sds_review_due is null or sds_review_due<current_date)
 union all select code,code,'INV-ACCESS','Emergency access arrangement missing or review due' from sites where coalesce(trim(inventory_access),'')='' or access_review_due is null or access_review_due<current_date;
create view v_attention as
 select site,code as record,owner,'stocktake overdue' as reason from v_containers where state<>'removed' and (counted_on is null or counted_on<current_date-90)
 union all select site,code,owner,'expired stock' from v_containers where state='stock' and expires_on<current_date and quantity>0
 union all select site,code,owner,'waste awaiting collection' from v_containers where state='waste' and quantity>0
 union all select s.code,a.code,a.owner,'overdue action' from actions a join sites s on s.id=a.site_id where a.status='open' and a.due_on<current_date;
