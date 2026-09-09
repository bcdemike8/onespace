-- RevOptics OneSpace — set the project owner on 125 projects
-- Generated 2026-09-08
--
-- Only fills projects that have NO owner yet, so anything you have already
-- set by hand is left alone. Safe to run more than once.
--
--   59 from Everhour's Leads column — these are the real owners.
--   66 inferred from who logged the most hours, or who holds the most
--     tasks where there were no hours. Those are a best guess: check them
--     on the Projects page, where the owner is now editable inline.
--   7 projects had no signal at all and stay unassigned.

BEGIN;

-- ========================================================================
-- FROM EVERHOUR'S LEADS COLUMN — reliable (59)
-- ========================================================================
-- Accelerate Learning | Outreach Add-On: Amplify  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Accelerate Learning | Outreach Add-On: Amplify' AND "ownerId" IS NULL;
-- Avam | Quick Start - 10 Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Avam | Quick Start - 10 Hours' AND "ownerId" IS NULL;
-- Bay FC | Quick Start - 15 Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Bay FC | Quick Start - 15 Hours' AND "ownerId" IS NULL;
-- F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'F1 Las Vegas Grand Prix Outreach Implementation: Engage (20-49)' AND "ownerId" IS NULL;
-- Factory Fix | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Factory Fix | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Finalsite | Outreach Optimization (Up to 100)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Finalsite | Outreach Optimization (Up to 100)' AND "ownerId" IS NULL;
-- HYPR | Outreach Implementation: Amplify Add-on  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'HYPR | Outreach Implementation: Amplify Add-on' AND "ownerId" IS NULL;
-- Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on' AND "ownerId" IS NULL;
-- Kustomer LLC | Outreach Managed Services 3 Months  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Kustomer LLC | Outreach Managed Services 3 Months' AND "ownerId" IS NULL;
-- Laurel (Time by Ping) Outreach Implementation: Engage (20-49)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Laurel (Time by Ping) Outreach Implementation: Engage (20-49)' AND "ownerId" IS NULL;
-- Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Quantinuum Outreach Implementation: Amplify, Deal, Kaia Add-On (1-19)' AND "ownerId" IS NULL;
-- SHRM - Basic Outreach Optimization (Up to 25)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'SHRM - Basic Outreach Optimization (Up to 25)' AND "ownerId" IS NULL;
-- Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Suvoda | Outreach Optimization + Premium Add-On (Kaia & Amplify)' AND "ownerId" IS NULL;
-- LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'LuxGive | Outreach Implementation: Engage + Starter Add-On (1-19)' AND "ownerId" IS NULL;
-- OC Tanner | "DIFY" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'OC Tanner | "DIFY" Salesloft Implementation' AND "ownerId" IS NULL;
-- D2L "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'D2L "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Great Minds | "DIFY" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Great Minds | "DIFY" Salesloft Implementation' AND "ownerId" IS NULL;
-- Visiting Media"Do It For You" Salesloft Implementation + Training Add-On  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Visiting Media"Do It For You" Salesloft Implementation + Training Add-On' AND "ownerId" IS NULL;
-- OneSpan "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'OneSpan "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- SpectraLink "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'SpectraLink "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- TravelNet Solutions | "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'TravelNet Solutions | "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Nextiva | Outreach Managed Services (12 Months)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Nextiva | Outreach Managed Services (12 Months)' AND "ownerId" IS NULL;
-- Road Ranger "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Road Ranger "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Dow Jones | Outreach Implementation: (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Dow Jones | Outreach Implementation: (1-19)' AND "ownerId" IS NULL;
-- Kindbody Outreach Implementation: Engage + Kaia Add-On (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Kindbody Outreach Implementation: Engage + Kaia Add-On (1-19)' AND "ownerId" IS NULL;
-- Cypher | Outreach Implementation (Engage 19 + Meet Add-On)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Cypher | Outreach Implementation (Engage 19 + Meet Add-On)' AND "ownerId" IS NULL;
-- Readspeaker | Outreach Implementation: Engage + Lite Add-On (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Readspeaker | Outreach Implementation: Engage + Lite Add-On (1-19)' AND "ownerId" IS NULL;
-- (HOPCo) Healthcare Outcomes | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = '(HOPCo) Healthcare Outcomes | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Inside Real Estate "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Inside Real Estate "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Vyond - "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Vyond - "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Seated "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Seated "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Acuity | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Acuity | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- McKesson | Outreach Expansion (20-49)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'McKesson | Outreach Expansion (20-49)' AND "ownerId" IS NULL;
-- UpKeep Technologies | Outreach Managed Services 3 Months  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'UpKeep Technologies | Outreach Managed Services 3 Months' AND "ownerId" IS NULL;
-- Westernacher | Forecasting  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Westernacher | Forecasting' AND "ownerId" IS NULL;
-- Centrilogic | "Do It For You" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Centrilogic | "Do It For You" Salesloft Implementation' AND "ownerId" IS NULL;
-- Nx | Outreach Implementation: Engage (1-19) + Premium Add-On  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Nx | Outreach Implementation: Engage (1-19) + Premium Add-On' AND "ownerId" IS NULL;
-- Fonoa | Basic Outreach Optimization (Up to 25)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Fonoa | Basic Outreach Optimization (Up to 25)' AND "ownerId" IS NULL;
-- Discuss.io | Fractional Admin Consulting  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Discuss.io | Fractional Admin Consulting' AND "ownerId" IS NULL;
-- Viking Cloud | Outreach Expansion (20-49)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Viking Cloud | Outreach Expansion (20-49)' AND "ownerId" IS NULL;
-- Trella Health | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Trella Health | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Roundstone | Quick Start Engage, Meet, Deal - 25 Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Roundstone | Quick Start Engage, Meet, Deal - 25 Hours' AND "ownerId" IS NULL;
-- DailyPay | Outbound Revenue Performance 2025  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'brianna@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'DailyPay | Outbound Revenue Performance 2025' AND "ownerId" IS NULL;
-- Put it Forward | ZI to Salesloft Migration  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Put it Forward | ZI to Salesloft Migration' AND "ownerId" IS NULL;
-- Great Minds Training Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Great Minds Training Hours' AND "ownerId" IS NULL;
-- SpryPoint | Quick Start - 10 Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'SpryPoint | Quick Start - 10 Hours' AND "ownerId" IS NULL;
-- Merkle | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Merkle | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Lifelenz | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Lifelenz | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- PureFacts | Outreach Expansion (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'PureFacts | Outreach Expansion (1-19)' AND "ownerId" IS NULL;
-- CoreTek | Quick Audit - 5 Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'CoreTek | Quick Audit - 5 Hours' AND "ownerId" IS NULL;
-- Tessy Plastics | Salesloft Assistance Fractional Hours  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Tessy Plastics | Salesloft Assistance Fractional Hours' AND "ownerId" IS NULL;
-- Betterworks | Basic Outreach Optimization + Training (Up to 25)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Betterworks | Basic Outreach Optimization + Training (Up to 25)' AND "ownerId" IS NULL;
-- CarGurus |  DIFY/ Advanced Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'CarGurus |  DIFY/ Advanced Salesloft Implementation' AND "ownerId" IS NULL;
-- Peregrine | Salesloft Standard Onboard Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Peregrine | Salesloft Standard Onboard Implementation' AND "ownerId" IS NULL;
-- True Commerce | "Do It For You" Salesloft Implementation & Migration  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'True Commerce | "Do It For You" Salesloft Implementation & Migration' AND "ownerId" IS NULL;
-- Cimulate | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Cimulate | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Choice Digital  | DIFY /Advanced Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Choice Digital  | DIFY /Advanced Salesloft Implementation' AND "ownerId" IS NULL;
-- TEZ Technology | Outreach Implementation: Engage (1-19)  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'TEZ Technology | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Miller Environmental | "DIFY" Salesloft Implementation  ·  Everhour lead
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Miller Environmental | "DIFY" Salesloft Implementation' AND "ownerId" IS NULL;

-- ========================================================================
-- INFERRED FROM WHO DID THE WORK — worth a check (66)
-- ========================================================================
-- Access One | Amplify Starter  ·  most hours (1.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Access One | Amplify Starter' AND "ownerId" IS NULL;
-- Access One | Outreach Implementation: Engage + Starter Add-On (1-19)  ·  most tasks (10)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Access One | Outreach Implementation: Engage + Starter Add-On (1-19)' AND "ownerId" IS NULL;
-- AdvanStaff HR | Amplify Starter  ·  most hours (4.6h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'AdvanStaff HR | Amplify Starter' AND "ownerId" IS NULL;
-- Avatara LLC | Amplify Starter  ·  most hours (10.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Avatara LLC | Amplify Starter' AND "ownerId" IS NULL;
-- Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)  ·  most hours (2.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Busright Outreach Implementation: Engage + Amplify Starter Add-On (1-19)' AND "ownerId" IS NULL;
-- Candex Solutions, Inc. | Amplify Starter  ·  most hours (4.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'brianna@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Candex Solutions, Inc. | Amplify Starter' AND "ownerId" IS NULL;
-- Eightfold | Amplify Starter  ·  most hours (6.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Eightfold | Amplify Starter' AND "ownerId" IS NULL;
-- Epiq Systems Ltd. | Amplify Starter  ·  most hours (1.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Epiq Systems Ltd. | Amplify Starter' AND "ownerId" IS NULL;
-- FactoryFix, LLC | Amplify Starter  ·  most hours (3.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'FactoryFix, LLC | Amplify Starter' AND "ownerId" IS NULL;
-- Garuda Labs (Instawork) | Amplify Starter  ·  most hours (1.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Garuda Labs (Instawork) | Amplify Starter' AND "ownerId" IS NULL;
-- Grail LLC | Amplify Starter  ·  most hours (3.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Grail LLC | Amplify Starter' AND "ownerId" IS NULL;
-- Impartner | Amplify Starter  ·  most hours (11.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Impartner | Amplify Starter' AND "ownerId" IS NULL;
-- Impetus | Amplify Starter  ·  most hours (6.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Impetus | Amplify Starter' AND "ownerId" IS NULL;
-- Intiveo | Amplify Starter  ·  most hours (5.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Intiveo | Amplify Starter' AND "ownerId" IS NULL;
-- LI-COR Biotech | Amplify Starter  ·  most hours (7.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'LI-COR Biotech | Amplify Starter' AND "ownerId" IS NULL;
-- Lumistry | Amplify Starter  ·  most hours (1.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Lumistry | Amplify Starter' AND "ownerId" IS NULL;
-- Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)  ·  most tasks (11)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Lumistry | Outreach Implementation: Engage + Starter Add-On (1-19)' AND "ownerId" IS NULL;
-- Muck Rack | Amplify Starter  ·  most hours (3.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Muck Rack | Amplify Starter' AND "ownerId" IS NULL;
-- NoRedInk | Amplify Starter  ·  most hours (3.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'NoRedInk | Amplify Starter' AND "ownerId" IS NULL;
-- Openspace | Amplify Starter  ·  most hours (7.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Openspace | Amplify Starter' AND "ownerId" IS NULL;
-- Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter  ·  most hours (9.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Patient Accounting Service Center, LLC dba GetixHealth | Amplify Starter' AND "ownerId" IS NULL;
-- Postscript | Amplify Starter  ·  most hours (5.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Postscript | Amplify Starter' AND "ownerId" IS NULL;
-- PureEHS Outreach Implementation: Engage + Starter (50-99)  ·  most hours (1.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'PureEHS Outreach Implementation: Engage + Starter (50-99)' AND "ownerId" IS NULL;
-- Sikich | Amplify Starter  ·  most hours (2.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Sikich | Amplify Starter' AND "ownerId" IS NULL;
-- Simpler Postage, Inc | Amplify Starter  ·  most hours (10.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Simpler Postage, Inc | Amplify Starter' AND "ownerId" IS NULL;
-- Specright | Amplify Starter  ·  most hours (8.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Specright | Amplify Starter' AND "ownerId" IS NULL;
-- State Affairs | Amplify Starter  ·  most hours (3.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'State Affairs | Amplify Starter' AND "ownerId" IS NULL;
-- State Affairs | Outreach Implementation: Engage (1-19)  ·  most hours (10.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'State Affairs | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- TTEC | Amplify Starter  ·  most hours (5.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'TTEC | Amplify Starter' AND "ownerId" IS NULL;
-- Ushur | Amplify Starter  ·  most hours (4.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Ushur | Amplify Starter' AND "ownerId" IS NULL;
-- Vertiv | Amplify Starter  ·  most hours (1.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Vertiv | Amplify Starter' AND "ownerId" IS NULL;
-- XSE Group | Amplify Starter  ·  most hours (0.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'XSE Group | Amplify Starter' AND "ownerId" IS NULL;
-- XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)  ·  most tasks (12)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'aaron@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'XSE Group | Outreach Implementation: Engage + Starter Add-On (1-19)' AND "ownerId" IS NULL;
-- Okta Engagemet Hours - Gong  ·  most hours (378.4h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Okta Engagemet Hours - Gong' AND "ownerId" IS NULL;
-- Marketing GTM Specialist - 30-60-90 Day Plan  ·  most hours (317.6h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'anastasiya@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Marketing GTM Specialist - 30-60-90 Day Plan' AND "ownerId" IS NULL;
-- Non-Billable | Internal RevOptics  ·  most hours (209.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Non-Billable | Internal RevOptics' AND "ownerId" IS NULL;
-- Apollo Implementations  ·  most hours (68.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Apollo Implementations' AND "ownerId" IS NULL;
-- Onboarding/Admin  ·  most hours (79.4h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Onboarding/Admin' AND "ownerId" IS NULL;
-- Outreach.io Amplify Documentation  ·  most hours (54.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Outreach.io Amplify Documentation' AND "ownerId" IS NULL;
-- Amplify Training  ·  most hours (52.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Amplify Training' AND "ownerId" IS NULL;
-- ServiceNow | Outbound Excellence | 2025  ·  most hours (46.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'ServiceNow | Outbound Excellence | 2025' AND "ownerId" IS NULL;
-- Wrike | Outbound Revenue Performance  ·  most hours (39.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Wrike | Outbound Revenue Performance' AND "ownerId" IS NULL;
-- Skaled | BDR Playbook  ·  most hours (25.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Skaled | BDR Playbook' AND "ownerId" IS NULL;
-- Skaled  ·  most hours (22.9h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Skaled' AND "ownerId" IS NULL;
-- Suvoda | Amplify Starter  ·  most hours (19.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Suvoda | Amplify Starter' AND "ownerId" IS NULL;
-- Sentient Jet | Outreach Managed Services 3 Months  ·  most hours (14.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Sentient Jet | Outreach Managed Services 3 Months' AND "ownerId" IS NULL;
-- GWS BioPharma Solutions  | Amplify Starter  ·  most hours (14.3h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'GWS BioPharma Solutions  | Amplify Starter' AND "ownerId" IS NULL;
-- ATD | Outbound Revenue Performance  ·  most hours (11.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'ATD | Outbound Revenue Performance' AND "ownerId" IS NULL;
-- Coretek Services | Amplify Starter  ·  most hours (10.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Coretek Services | Amplify Starter' AND "ownerId" IS NULL;
-- Genz | Outreach Managed Services + Custom API  ·  most hours (10.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Genz | Outreach Managed Services + Custom API' AND "ownerId" IS NULL;
-- Accelerate Learning | Amplify Starter  ·  most hours (8.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Accelerate Learning | Amplify Starter' AND "ownerId" IS NULL;
-- HYPR | Amplify Starter  ·  most hours (7.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'HYPR | Amplify Starter' AND "ownerId" IS NULL;
-- Quantinuum | Amplify Starter  ·  most hours (4.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'brianna@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Quantinuum | Amplify Starter' AND "ownerId" IS NULL;
-- Content: Skaled Partner  ·  most hours (6.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Content: Skaled Partner' AND "ownerId" IS NULL;
-- National Flood Experts | Amplify Starter  ·  most hours (6.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'National Flood Experts | Amplify Starter' AND "ownerId" IS NULL;
-- PHG Advisory | Quick Start - 10 Hours  ·  most hours (6.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'marcus@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'PHG Advisory | Quick Start - 10 Hours' AND "ownerId" IS NULL;
-- Nerdio | Outbound Revenue Performance  ·  most hours (5.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Nerdio | Outbound Revenue Performance' AND "ownerId" IS NULL;
-- Shadowing & Enablement (Log for billable credit)  ·  most hours (5.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Shadowing & Enablement (Log for billable credit)' AND "ownerId" IS NULL;
-- Minimus | Amplify Starter  ·  most hours (5.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Minimus | Amplify Starter' AND "ownerId" IS NULL;
-- Okta - Gong Enablement + Optimization  ·  most hours (4.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Okta - Gong Enablement + Optimization' AND "ownerId" IS NULL;
-- Outreach Direct Selling  ·  most hours (2.5h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'andrew@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Outreach Direct Selling' AND "ownerId" IS NULL;
-- Okres | Outreach Implementation: Engage (1-19)  ·  most hours (1.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'brianna@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Okres | Outreach Implementation: Engage (1-19)' AND "ownerId" IS NULL;
-- Acuity | Amplify Starter  ·  most hours (1.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Acuity | Amplify Starter' AND "ownerId" IS NULL;
-- Aaron Masters - Outreach Implementation Consultant Onboarding  ·  most hours (0.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'shannon@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Aaron Masters - Outreach Implementation Consultant Onboarding' AND "ownerId" IS NULL;
-- Liquibase | Amplify & MCP Starter  ·  most hours (0.8h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'yazmin@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = 'Liquibase | Amplify & MCP Starter' AND "ownerId" IS NULL;
-- -  ·  most hours (0.0h)
UPDATE onespace."Project" SET "ownerId" = (
  SELECT id FROM onespace."User" WHERE lower(email) = 'anastasiya@revoptics.co' LIMIT 1
), "updatedAt" = now()
WHERE name = '-' AND "ownerId" IS NULL;

-- ========================================================================
-- HAND EACH OWNER THE TASKS NOBODY ELSE IS DOING
-- ========================================================================
-- Only tasks with no assignee at all. A task deliberately given to
-- someone other than the owner keeps that person — those came across
-- from Asana on purpose. To override that on a project, use "Give every
-- task to the owner" in its Settings.
UPDATE onespace."Task" t
SET "assigneeId" = p."ownerId", "updatedAt" = now()
FROM onespace."Project" p
WHERE t."projectId" = p.id
  AND t."assigneeId" IS NULL
  AND p."ownerId" IS NOT NULL;

COMMIT;

-- Who owns what now, and how many tasks they hold:
select coalesce(u.name,'(no owner)') as owner,
       count(distinct p.id) as projects,
       count(t.id) filter (where t."assigneeId" = u.id) as tasks
from onespace."Project" p
  left join onespace."User" u on u.id = p."ownerId"
  left join onespace."Task" t on t."projectId" = p.id
group by 1 order by 2 desc;
