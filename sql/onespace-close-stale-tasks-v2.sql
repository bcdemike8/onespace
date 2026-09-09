-- Close stale tasks — corrected pass
-- ==================================
-- Supersedes onespace-close-stale-tasks.sql.
--
-- Your rule was: older than 60 days OR overdue by 60 days or more.
-- The first file only did the "overdue" half (105 tasks), because in the
-- database every task's createdAt is the moment the import ran — the setup
-- SQL I generated wrote now() instead of carrying Asana's real Created At.
--
-- The real creation dates are in your Asana export (all 780 rows have one,
-- spanning 2026-01-08 to 2026-08-31), so this file carries the list with it
-- rather than reading createdAt from the database.
--
-- Cut-off: created on or before 2026-07-10.
--
-- The list holds 299 tasks. It only touches ones still open, so it works
-- whether or not you already ran the first file: from a clean state it closes
-- 299; on top of the first file's 105 it closes the remaining 196. Either way
-- you end with 301 closed by the 60-day rule and 266 still open.
--
-- Run the whole file at once. It backs up first and is reversible.

BEGIN;

create temp table stale_list (project text, task text);

insert into stale_list (project, task) values
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Add Contact Roles into SFDC'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Add-On Advanced Topics'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Add-On Training'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Amplify'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'CRM Production Configuration or Migration'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'CRM Production Testing'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'CRM Sandbox Configuration'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'CRM Sandbox Testing'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Complete post kick off follow up'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Conduct Transition call with Outreach account team'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Conduct workflow interviews'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Content Settings Call'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Content Strategy Call'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Content Workshop'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Deal'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Engage Advanced Topics'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Engage Manager Training'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Engage User Training'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Forecast'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Forecast Manager Training'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Governance Configuration'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Introduction to RevOptics Leadership'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Load Success Metrics Into SFDC'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Meet'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Prepare for Kickoff'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Run Kickoff'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Run Pre-launch checkpoint'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Schedule Kickoff'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Seller | Consultant Sync'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Send user configuration instructions / account set up'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Summarize Workflow'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Training Consultation'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Triggers'),
  ('Accelerate Learning | Outreach Add-On: Amplify', 'Update CRM'),
  ('Access One | Amplify Starter', 'External Launch & Training'),
  ('Access One | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Access One | Amplify Starter', 'Prompt Launching'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add Contact Roles into SFDC'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage Advanced Topics'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage User Training'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduce Outreach account team'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduction to RevOptics Leadership'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Load Success Metrics Into SFDC'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Manager Training'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Run Pre-launch checkpoint'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Schedule Kickoff'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Send user configuration instructions / account set up'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Training Consultation'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Triggers'),
  ('Access One | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Update CRM'),
  ('AdvanStaff HR | Amplify Starter', 'External Launch & Training'),
  ('AdvanStaff HR | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('AdvanStaff HR | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('AdvanStaff HR | Amplify Starter', 'Prompt Launching'),
  ('AdvanStaff HR | Amplify Starter', 'Prompt Testing'),
  ('Avatara LLC | Amplify Starter', 'External Launch & Training'),
  ('Avatara LLC | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Avatara LLC | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Avatara LLC | Amplify Starter', 'Prompt Launching'),
  ('Avatara LLC | Amplify Starter', 'Prompt Testing'),
  ('Candex Solutions, Inc. | Amplify Starter', 'External Launch & Training'),
  ('Candex Solutions, Inc. | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Candex Solutions, Inc. | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Candex Solutions, Inc. | Amplify Starter', 'Prompt Launching'),
  ('Candex Solutions, Inc. | Amplify Starter', 'Prompt Testing'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Add Contact Roles into SFDC'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Advanced Topics'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Introduce Outreach account team'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Load Success Metrics Into SFDC'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Schedule Kickoff'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Update CRM'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Weekly Calls/Meetings'),
  ('Factory Fix | Outreach Implementation: Engage (1-19)', 'Weekly Email/Slack'),
  ('FactoryFix, LLC | Amplify Starter', 'External Launch & Training'),
  ('FactoryFix, LLC | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('FactoryFix, LLC | Amplify Starter', 'Prompt Launching'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Align Customer workflows to new settings based on audit findings'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Assess current trigger usage and implement recommended automation where advisable'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'CRM Plugin Audit'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Consult on best practice recommendations'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Emails & Ad-Hoc Meetings'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Facilitate final plugin testing where needed'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Office Hours'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Outreach Governance Audit'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Review content, Success Plan Templates, KAIA Cards, and user settings'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Review, audit, and document applicable end-user workflows'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'System Configuration'),
  ('Finalsite | Outreach Optimization (Up to 100)', 'Trainings'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Advanced Topics'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'CRM Configuration'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'CRM Testing'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Conduct workflow interviews'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Content Settings Call'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Content Strategy Call'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Content Workshop'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Deal Configuration'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Governance Configuration'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Introduce Outreach account team'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Introduction to RevOptics Leadership'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Manager Training'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Meet Configuration'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Run Pre-launch checkpoint'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Send user configuration instructions / account set up'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Summarize Workflow'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Training Consultation'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Triggers'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Update CRM'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'User Training'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Weekly Calls/Meetings'),
  ('HYPR | Outreach Implementation: Amplify Add-on', 'Weekly Email/Slack'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', '1-Hour Enablement/End User Training'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Add Contact Roles into SFDC'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Advanced Topics'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Amplify CRM Field Mapping'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Amplify Use Case Identification Workflow'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Conduct Transition call with Outreach account team'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Confirm Proper Field Mapping'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Draft Use Case #2'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Ensure 3rd Party Connection Information'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Insert Use Case #1'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Insert Use Case #2'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Honeycomb to Outline Desired Use Cases'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Load Success Metrics Into SFDC'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'RevOptics to Help Draft Use Case #1'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'RevOptics to Review and Provide Feedback'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Schedule Kickoff'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Send user configuration instructions / account set up'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Team to Review Output and Mapping'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Update CRM'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Launched'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Outlined & Accepted on Move-Forward'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #1 Prompting Draft'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Launched'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Outlined & Accepted on Move-Forward'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Use Case #2 Prompting Draft'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Weekly Calls/Meetings'),
  ('Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on', 'Weekly Email/Slack'),
  ('Impartner | Amplify Starter', 'External Launch & Training'),
  ('Impartner | Amplify Starter', 'Kick Off Meeting'),
  ('Impartner | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Impartner | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Impartner | Amplify Starter', 'Prompt Launching'),
  ('Impartner | Amplify Starter', 'Prompt Testing'),
  ('Intiveo | Amplify Starter', 'External Launch & Training'),
  ('Intiveo | Amplify Starter', 'Kick Off Meeting'),
  ('Intiveo | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Intiveo | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Intiveo | Amplify Starter', 'Prompt Launching'),
  ('Intiveo | Amplify Starter', 'Prompt Testing'),
  ('Kustomer LLC | Outreach Managed Services 3 Months', 'Define Project Deliverables and Schedule (Include in Project Notes)'),
  ('LI-COR Biotech | Amplify Starter', 'External Launch & Training'),
  ('LI-COR Biotech | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Add Contact Roles into SFDC'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Advanced Topics'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Complete post kick off follow up'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Conduct Transition call with Outreach account team'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Introduction to RevOptics Leadership'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Load Success Metrics Into SFDC'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Manager Training'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Schedule Kickoff'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Seller | Consultant Sync'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Send user configuration instructions / account set up'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Update CRM'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'User Training'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Weekly Calls/Meetings'),
  ('Laurel (Time by Ping) Outreach Implementation: Engage (20-49)', 'Weekly Email/Slack'),
  ('Lumistry | Amplify Starter', 'External Launch & Training'),
  ('Lumistry | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add Contact Roles into SFDC'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Amplify'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Amplify Advanced Topics'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Amplify User Training'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage Advanced Topics'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage User Training'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduce Outreach account team'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduction to RevOptics Leadership'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Load Success Metrics Into SFDC'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Manager Training'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Send user configuration instructions / account set up'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Training Consultation'),
  ('Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Update CRM'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add Contact Roles into SFDC'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add-On Advanced Topics'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add-On User Training'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage Advanced Topics'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage User Training'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduce Outreach account team'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Load Success Metrics Into SFDC'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Manager Training'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Schedule Kickoff'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Send user configuration instructions / account set up'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Training Consultation'),
  ('LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Update CRM'),
  ('NoRedInk | Amplify Starter', 'External Launch & Training'),
  ('NoRedInk | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('NoRedInk | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('NoRedInk | Amplify Starter', 'Prompt Launching'),
  ('NoRedInk | Amplify Starter', 'Prompt Testing'),
  ('Panther Labs, Inc | Amplify Starter', 'External Launch & Training'),
  ('Panther Labs, Inc | Amplify Starter', 'Kick Off Meeting'),
  ('Panther Labs, Inc | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Panther Labs, Inc | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Panther Labs, Inc | Amplify Starter', 'Prompt Launching'),
  ('Panther Labs, Inc | Amplify Starter', 'Prompt Testing'),
  ('Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', 'External Launch & Training'),
  ('Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', 'Prompt Launching'),
  ('Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter', 'Prompt Testing'),
  ('Postscript | Amplify Starter', 'External Launch & Training'),
  ('Postscript | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Postscript | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Postscript | Amplify Starter', 'Prompt Launching'),
  ('Postscript | Amplify Starter', 'Prompt Testing'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Add Contact Roles into SFDC'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Add-On Advanced Topics'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Add-On User Training'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Content Settings Call'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Content Workshop'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Deal'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Engage Advanced Topics'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Forecast'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Introduce Outreach account team'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Introduction to RevOptics Leadership'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Load Success Metrics Into SFDC'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Manager Training'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Run Pre-launch checkpoint'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Schedule Kickoff'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Send user configuration instructions / account set up'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Training Consultation'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Triggers'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Update CRM'),
  ('Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)', 'Weekly meetings'),
  ('Simpler Postage, Inc | Amplify Starter', 'External Launch & Training'),
  ('Simpler Postage, Inc | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Simpler Postage, Inc | Amplify Starter', 'Prompt Launching'),
  ('Simpler Postage, Inc | Amplify Starter', 'Prompt(s) Build Out (Meetings and Work)'),
  ('Simpler Postage, Inc | Amplify Starter', 'Prompt(s) Testing'),
  ('Spark Hire, Inc. | Amplify Starter', 'External Launch & Training'),
  ('Spark Hire, Inc. | Amplify Starter', 'Kick Off Meeting'),
  ('Spark Hire, Inc. | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Spark Hire, Inc. | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Spark Hire, Inc. | Amplify Starter', 'Prompt Launching'),
  ('Spark Hire, Inc. | Amplify Starter', 'Prompt Testing'),
  ('Specright | Amplify Starter', 'External Launch & Training'),
  ('Specright | Amplify Starter', 'Kick Off Meeting'),
  ('Specright | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('Specright | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('Specright | Amplify Starter', 'Prompt Launching'),
  ('Specright | Amplify Starter', 'Prompt Testing'),
  ('SuperOps.ai | Amplify Starter', 'External Launch & Training'),
  ('SuperOps.ai | Amplify Starter', 'Kick Off Meeting'),
  ('SuperOps.ai | Amplify Starter', 'Prompt Build Out (Meetings and Work)'),
  ('SuperOps.ai | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('SuperOps.ai | Amplify Starter', 'Prompt Launching'),
  ('SuperOps.ai | Amplify Starter', 'Prompt Testing'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Advise on deployment strategy for net-new content needs and development'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Align Customer workflows to new settings based on audit findings'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Assess current trigger usage and implement recommended automation where advisable'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Audit of content-related settings including schedules, rulesets, and collections'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Conduct gap analysis based on new Content Framework and existing “live” content'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Consult on best practice recommendations'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Develop and implement methodology for long-term content maintenance'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Facilitate final plugin testing where needed'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Help ensure project related follow up items are tracked and resolved'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Identify opportunities to utilize best practices that reinforce optimal Customer outcomes'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Office Hours'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Provide a review of existing plugin configuration, a list of suggested enhancements, and deploy Customer approved changes'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Review content, Success Plan Templates, KAIA Cards, and user settings'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Review governance settings, providing best practice recommendations based on long-term scalability and maintenance needs'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Review, audit, and document applicable end-user workflows'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Up to four (4) content workshop sessions'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Weekly Meetings'),
  ('Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)', 'Weekly emails & Ad-Hoc meetings'),
  ('XSE Group | Amplify Starter', 'External Launch & Training'),
  ('XSE Group | Amplify Starter', 'Prompt Evaluation and Feedback'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add Contact Roles into SFDC'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add-On Advanced Topics'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Add-On User Training'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Amplify'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Conduct Project review w/ outreach sales person / RevOptics Salesperson'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage Advanced Topics'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Engage User Training'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Introduce Outreach account team'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Load Success Metrics Into SFDC'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Manager Training'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Schedule Kickoff'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Send user configuration instructions / account set up'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Training Consultation'),
  ('XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)', 'Update CRM');

-- ---------------------------------------------------------------- preview
select coalesce(c.name,'(no client)') as client, p.name as project,
       count(*) as closing
from onespace."Task" t
  join onespace."Project" p on p.id = t."projectId"
  left join onespace."Client" c on c.id = p."clientId"
  join stale_list s on s.project = p.name and s.task = t.name
where t.status <> 'DONE'
group by 1,2 order by 3 desc, 2;

-- ----------------------------------------------------------------- backup
drop table if exists onespace.bulk_close_backup_v2;

create table onespace.bulk_close_backup_v2 as
select t.id, t.status as previous_status, t."completedAt" as previous_completed_at,
       now() as closed_at
from onespace."Task" t
  join onespace."Project" p on p.id = t."projectId"
  join stale_list s on s.project = p.name and s.task = t.name
where t.status <> 'DONE';

-- ----------------------------------------------------------------- update
-- completedAt uses the task's own due date where it has one, so these don't
-- land as a spike of work "finished" today. Tasks with no due date fall back
-- to the cut-off date rather than now(), for the same reason.

update onespace."Task" t
set status = 'DONE',
    "completedAt" = coalesce(t."dueDate", timestamp '2026-07-10'),
    "updatedAt" = now()
from onespace."Project" p, stale_list s
where p.id = t."projectId"
  and s.project = p.name and s.task = t.name
  and t.status <> 'DONE';

COMMIT;


-- ---------------------------------------------------------------- confirm
select count(*) as tasks_closed_this_run from onespace.bulk_close_backup_v2;
select status, count(*) from onespace."Task" group by status order by status;


-- ------------------------------------------------------------------- undo
--   update onespace."Task" t set status = b.previous_status,
--          "completedAt" = b.previous_completed_at, "updatedAt" = now()
--   from onespace.bulk_close_backup_v2 b where b.id = t.id;
--
--   drop table onespace.bulk_close_backup_v2;


-- ------------------------------------------- deliberately NOT in this list
-- 3 recurring task names appear several times in one project with
-- different dates, so a name match can't tell the old one from the current
-- one. Left alone — close them by hand if you want:
--   Kustomer LLC | Outreach Managed Services 3 Months  ->  Admin Sync
--   Kustomer LLC | Outreach Managed Services 3 Months  ->  Admin Work
--   Kustomer LLC | Outreach Managed Services 3 Months  ->  Team Advanced Topics

