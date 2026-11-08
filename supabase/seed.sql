do $$ begin
 if exists(select 1 from sites where code='DEMO-NORTH') then return; end if;
 if exists(select 1 from sites) or exists(select 1 from chemicals) then raise exception 'Refusing demo seed in a populated working database'; end if;
 insert into sites(id,code,name,owner,inventory_access,access_review_due) values
 ('10000000-0000-4000-8000-000000000001','DEMO-NORTH','North research laboratory','Mere','Demo only: printed copy at assembly point',current_date+30),
 ('10000000-0000-4000-8000-000000000002','DEMO-SOUTH','South formulation laboratory','Ari',null,null);
 insert into locations(id,code,name,site_id) values
 ('20000000-0000-4000-8000-000000000001','N-CAB','North solvent cabinet','10000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000002','N-WASTE','North waste holding area','10000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000003','S-CAB','South cabinet','10000000-0000-4000-8000-000000000002');
 insert into chemicals(id,code,name,unit,hazardous,un_reviewed,storage_notes,sds_reference,sds_review_due) values
 ('30000000-0000-4000-8000-000000000001','DEMO-SOLVENT','Fictional solvent blend','L',true,false,null,null,null),
 ('30000000-0000-4000-8000-000000000002','DEMO-POWDER','Fictional test powder','kg',null,false,null,null,null),
 ('30000000-0000-4000-8000-000000000003','DEMO-WATER','Fictional rinse water','L',false,true,'Demo only',null,null);
 insert into containers(id,code,name,chemical_id,location_id,quantity,owner,lot,expires_on,counted_on,state) values
 ('40000000-0000-4000-8000-000000000001','N-001','Solvent bottle A','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',4,'Mere','LOT-A',current_date-12,current_date-120,'stock'),
 ('40000000-0000-4000-8000-000000000002','N-002','Solvent bottle B','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',3,'Mere','LOT-B',current_date+20,current_date-3,'stock'),
 ('40000000-0000-4000-8000-000000000003','N-W01','Waste solvent can','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',2,'Ari','WASTE-A',null,current_date-8,'waste'),
 ('40000000-0000-4000-8000-000000000004','S-001','Test powder jar','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003',1.5,'Ari','LOT-P',current_date+60,null,'stock'),
 ('40000000-0000-4000-8000-000000000005','S-002','Rinse water vessel','30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003',10,'Ari','LOT-W',null,current_date-1,'stock');
 insert into site_maxima(site_id,chemical_id,maximum_quantity,basis,reviewed_by,review_due) values
 ('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',8,'Fictional outdated purchasing estimate','Demo reviewer',current_date-1);
 insert into actions(code,name,site_id,owner,due_on) values
 ('ACT-01','Review declared solvent maximum and obtain current safety sheet','10000000-0000-4000-8000-000000000001','Mere',current_date-4),
 ('ACT-02','Confirm emergency access to inventory','10000000-0000-4000-8000-000000000002','Ari',current_date+2);
end $$;
