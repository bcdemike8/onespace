-- Restore the subtask hierarchy from Asana
-- ========================================
-- Run AFTER deploying the subtask change (the migration adds Task.parentId).
--
-- Your Asana export marks 93 tasks as subtasks. The first import put them
-- in as siblings of their parent because OneSpace had nowhere to hang them;
-- this reattaches 91 of them. The other 2 are listed at the bottom: their
-- name isn't unique inside their project, so a name match could put them
-- under the wrong parent, and guessing is worse than leaving them.
--
-- A subtask also moves into whatever section its parent is in, since that's
-- where it belongs on screen.
--
-- Reversible: see the undo at the bottom.

BEGIN;

create temp table links (project text, parent text, child text);

insert into links (project, parent, child) values
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Element451 | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'CRM Plugin Audit', 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'CRM Plugin Audit', 'Consult on best practice recommendations'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'CRM Plugin Audit', 'Facilitate final plugin testing where needed'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Outreach Governance Audit', 'Review, audit, and document applicable end-user workflows'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Outreach Governance Audit', 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Outreach Governance Audit', 'Align Customer workflows to new settings based on audit findings'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Outreach Governance Audit', 'Assess current trigger usage and implement recommended automation where advisable'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Amplify Use Case Identification Workflow', 'Honeycomb to Outline Desired Use Cases'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Amplify CRM Field Mapping', 'Honeycomb to Confirm Proper Field Mapping'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Amplify CRM Field Mapping', 'Honeycomb to Ensure 3rd Party Connection Information'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Prompting Draft', 'Use Case #1 Outlined & Accepted on Move-Forward'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Prompting Draft', 'RevOptics to Help Draft Use Case #1'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Prompting Draft', 'Honeycomb to Insert Use Case #1'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Prompting Draft', 'Use Case #2 Outlined & Accepted on Move-Forward'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Prompting Draft', 'Honeycomb to Draft Use Case #2'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Prompting Draft', 'RevOptics to Review and Provide Feedback'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Prompting Draft', 'Honeycomb to Insert Use Case #2'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('PureEHS Outreach Implementation: Engage + Starter (50-99)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('PureEHS Outreach Implementation: Engage + Starter (50-99)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('PureEHS Outreach Implementation: Engage + Starter (50-99)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('PureEHS Outreach Implementation: Engage + Starter (50-99)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'CRM Plugin Audit', 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'CRM Plugin Audit', 'Consult on best practice recommendations'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'CRM Plugin Audit', 'Facilitate final plugin testing where needed'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'Outreach Governance Audit', 'Review, audit, and document applicable end-user workflows'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'Outreach Governance Audit', 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'Outreach Governance Audit', 'Align Customer workflows to new settings based on audit findings'),
  ('SHRM - Basic Outreach Optimization (Up to 25)', 'Outreach Governance Audit', 'Assess current trigger usage and implement recommended automation where advisable'),
  ('State Affairs | Outreach Implementation: Engage (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('State Affairs | Outreach Implementation: Engage (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('State Affairs | Outreach Implementation: Engage (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('State Affairs | Outreach Implementation: Engage (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'CRM Plugin Audit', 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'CRM Plugin Audit', 'Consult on best practice recommendations'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'CRM Plugin Audit', 'Facilitate final plugin testing where needed'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Outreach Governance Audit', 'Review, audit, and document applicable end-user workflows'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Outreach Governance Audit', 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Outreach Governance Audit', 'Align Customer workflows to new settings based on audit findings'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Outreach Governance Audit', 'Assess current trigger usage and implement recommended automation where advisable'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Prepare for Kickoff', 'Schedule Kickoff'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Load Success Metrics Into SFDC'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Kickoff', 'Add Contact Roles into SFDC');

-- ---------------------------------------------------------------- preview
select l.project, l.parent, l.child,
       case
         when p.id is null then 'no project match'
         when par.id is null then 'no parent match'
         when ch.id is null then 'no child match'
         else 'will link'
       end as outcome
from links l
  left join onespace."Project" p on p.name = l.project
  left join onespace."Task" par on par."projectId" = p.id and par.name = l.parent
  left join onespace."Task" ch  on ch."projectId"  = p.id and ch.name  = l.child
order by 4, 1, 2, 3;

-- ----------------------------------------------------------------- backup
drop table if exists onespace.subtask_link_backup;

create table onespace.subtask_link_backup as
select ch.id, ch."parentId" as previous_parent_id, ch."sectionId" as previous_section_id,
       now() as linked_at
from links l
  join onespace."Project" p on p.name = l.project
  join onespace."Task" par on par."projectId" = p.id and par.name = l.parent
  join onespace."Task" ch  on ch."projectId"  = p.id and ch.name  = l.child;

-- ----------------------------------------------------------------- update
update onespace."Task" ch
set "parentId" = par.id,
    "sectionId" = par."sectionId",
    "updatedAt" = now()
from links l
  join onespace."Project" p on p.name = l.project
  join onespace."Task" par on par."projectId" = p.id and par.name = l.parent
where ch."projectId" = p.id
  and ch.name = l.child
  and ch.id <> par.id;

COMMIT;


-- ---------------------------------------------------------------- confirm
select count(*) as subtasks_linked from onespace."Task" where "parentId" is not null;


-- ------------------------------------------------------------------- undo
--   update onespace."Task" t set "parentId" = b.previous_parent_id,
--          "sectionId" = b.previous_section_id, "updatedAt" = now()
--   from onespace.subtask_link_backup b where b.id = t.id;
--
--   drop table onespace.subtask_link_backup;

-- ------------------------------------- left alone: names not unique
-- Open the project and drag/re-add these under the right parent:
--   Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on
--       Team to Review Output and Mapping   ->   under: Use Case #1 Prompting Draft
--   Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on
--       Team to Review Output and Mapping   ->   under: Use Case #2 Prompting Draft
