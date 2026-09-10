-- Client email domains, filled in
-- ===============================
-- 48 clients, from the list Brianna supplied on 10 September 2026.
--
-- Run the whole file. It previews every row first and writes nothing that
-- fails a check, so a client name that doesn't match OneSpace exactly is
-- reported rather than silently skipped.
--
-- Partners are NOT here. Outreach and Skaled go in
-- onespace-partner-domains.sql - a partner listed as a client makes every
-- joint call look like two customers at once and match neither.

BEGIN;

create temp table domain_map (client text, domain text);

insert into domain_map (client, domain) values
  ('Accelerate Learning'                                   , 'acceleratelearning.com'),
  ('Access One'                                            , 'accessoneinc.com'),
  ('AdvanStaff HR'                                         , 'advanstaff.com'),
  ('Avam'                                                  , 'avam.com'),
  ('Avatara LLC'                                           , 'avataracloud.com'),
  ('Bay FC'                                                , 'bayfc.com'),
  ('Busright'                                              , 'busright.com'),
  ('Candex Solutions, Inc.'                                , 'candex.com'),
  ('Daxko'                                                 , 'daxko.com'),
  ('Eightfold'                                             , 'eightfold.ai'),
  ('Element451'                                            , 'element451.com'),
  ('Epiq Systems Ltd.'                                     , 'epiqglobal.com'),
  ('F1 Las Vegas Grand Prix'                               , 'f1lasvegasgp.com'),
  ('FactoryFix, LLC'                                       , 'factoryfix.com'),
  ('Finalsite'                                             , 'finalsite.com'),
  ('Garuda Labs (Instawork)'                               , 'instawork.com'),
  ('Grail LLC'                                             , 'grail.com'),
  ('Honeycomb'                                             , 'honeycomb.io'),
  ('Impartner'                                             , 'impartner.com'),
  ('Impetus'                                               , 'impetus.com'),
  ('Intiveo'                                               , 'intiveo.com'),
  ('Kustomer LLC'                                          , 'kustomer.com'),
  ('LI-COR Biotech'                                        , 'licorbio.com'),
  ('Laurel (Time by Ping)'                                 , 'laurel.ai'),
  ('Lumistry'                                              , 'lumistry.com'),
  ('LuxGive'                                               , 'luxgive.com'),
  ('Muck Rack'                                             , 'muckrack.com'),
  ('NoRedInk'                                              , 'noredink.com'),
  ('Openspace'                                             , 'openspace.ai'),
  ('Panther Labs, Inc'                                     , 'panther.com'),
  ('Patient Accounting Service Center, LLC dba GetixHealth', 'getixhealth.com'),
  ('Pindrop'                                               , 'pindrop.com'),
  ('Postscript'                                            , 'postscript.io'),
  ('PureEHS'                                               , 'pureehs.com'),
  ('Quantinuum'                                            , 'quantinuum.com'),
  ('SHRM'                                                  , 'shrm.org'),
  ('Sikich'                                                , 'sikich.com'),
  ('Simpler Postage, Inc'                                  , 'easypost.com'),
  ('Spark Hire, Inc.'                                      , 'sparkhire.com'),
  ('Specright'                                             , 'specright.com'),
  ('State Affairs'                                         , 'stateaffairs.com'),
  ('SuperOps.ai'                                           , 'superops.com'),
  ('Suvoda'                                                , 'suvoda.com'),
  ('TTEC'                                                  , 'ttec.com'),
  ('Ushur'                                                 , 'ushur.com'),
  ('Vertiv'                                                , 'vertiv.com'),
  ('Very Good Security (VGS)'                              , 'verygoodsecurity.com'),
  ('XSE Group'                                             , 'xsegroup.com');


-- ------------------------------------------------------------------ checks
-- Read this output before scrolling past it. Anything not saying "will be
-- added" was not written.

select m.client, m.domain,
       case
         when c.id is null then 'NO SUCH CLIENT - name must match OneSpace exactly'
         when exists (
           select 1 from onespace."ClientDomain" d
           where d.domain = lower(m.domain) and d."clientId" <> c.id
         ) then 'DOMAIN ALREADY BELONGS TO ANOTHER CLIENT'
         when exists (
           select 1 from onespace."ClientDomain" d
           where d.domain = lower(m.domain) and d."clientId" = c.id
         ) then 'already there, skipped'
         when lower(m.domain) !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
           then 'NOT A DOMAIN'
         else 'will be added'
       end as outcome
from domain_map m
  left join onespace."Client" c on c.name = m.client
order by 3, 1;


-- ------------------------------------------------------------------ insert

insert into onespace."ClientDomain" (id, "clientId", domain, "createdAt")
select 'cd' || replace(gen_random_uuid()::text, '-', ''), c.id, lower(m.domain), now()
from domain_map m
  join onespace."Client" c on c.name = m.client
where lower(m.domain) ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  and not exists (
    select 1 from onespace."ClientDomain" d where d.domain = lower(m.domain)
  );

COMMIT;


-- ----------------------------------------------------------------- confirm
-- How many landed, and which clients are still without one.

select count(*) as domains_mapped from onespace."ClientDomain";

select c.name as client_still_unmapped,
       count(p.id) filter (where p.status in ('ACTIVE','ON_HOLD')) as live_projects
from onespace."Client" c
  left join onespace."Project" p on p."clientId" = c.id
where c."archivedAt" is null
  and not exists (select 1 from onespace."ClientDomain" d where d."clientId" = c.id)
group by c.name
order by 2 desc, 1;


-- -------------------------------------------------------------------- undo
--   delete from onespace."ClientDomain";   -- all of them
-- Removing a domain only stops future matching; it changes no logged time.
