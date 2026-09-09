-- Set each project's billing type from your Everhour history
-- =========================================================
-- Run this AFTER deploying the billing-type change (Railway applies the
-- migration on deploy, which sets every project to Hourly to start with).
--
-- Everhour recorded a billing type on every row. Across the 121 projects in
-- your Jan-Sep report, 18 logged nothing but non-billable time; the rest are
-- hourly. Nothing was fixed-fee in Everhour, so nothing is set to fixed fee
-- here — switch a project over in OneSpace when you want it reported on its
-- agreed price instead of its hours.

BEGIN;

create temp table nb_projects (name text);

insert into nb_projects (name) values
  ('Aaron Masters - Outreach Implementation Consultant Onboarding'),
  ('Amplify Training'),
  ('Apollo Implementations'),
  ('Avam | Quick Start - 10 Hours'),
  ('Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)'),
  ('Content: Skaled Partner'),
  ('Garuda Labs (Instawork) | Amplify Starter'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)'),
  ('Marketing GTM Specialist - 30-60-90 Day Plan'),
  ('Non-Billable | Internal RevOptics'),
  ('Okta - Gong Enablement + Optimization'),
  ('Okta Engagemet Hours - Gong'),
  ('Onboarding/Admin'),
  ('Outreach.io Amplify Documentation'),
  ('ServiceNow | Outbound Excellence | 2025'),
  ('Skaled'),
  ('Skaled | BDR Playbook'),
  ('State Affairs | Outreach Implementation: Engage (1-19)');

-- ---------------------------------------------------------------- preview
-- Anything listed here as "no match" is a project name that changed between
-- Everhour and OneSpace. Tell me and I'll map it.

select n.name,
       case when p.id is null then 'NO MATCH' else 'will be set non-billable' end
         as outcome
from nb_projects n
  left join onespace."Project" p on p.name = n.name
order by 2, 1;

-- ----------------------------------------------------------------- update
update onespace."Project" p
set "billingType" = 'NON_BILLABLE'
from nb_projects n
where p.name = n.name;

COMMIT;


-- ---------------------------------------------------------------- confirm
select "billingType", count(*) from onespace."Project"
group by 1 order by 1;

-- Time already logged keeps the billable flag it was imported with, which is
-- what you want — history shouldn't be restated. From here on, anything
-- logged to one of these projects is forced non-billable.

