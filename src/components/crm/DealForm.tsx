import { saveDealAction } from "@/app/actions/crm-records";
import { RecordForm } from "@/components/crm/RecordForm";
import { PartnerAePicker } from "@/components/crm/PartnerAePicker";
import {
  Check,
  DateInput,
  FormColumns,
  NumberInput,
  Option,
  Select,
  TextBox,
  TextInput,
} from "@/components/crm/FormFields";

/** The deal form, in the Opportunity page's own sections and order. */

export interface DealValues {
  id?: string;
  name?: string | null;
  clientId?: string | null;
  stage?: string | null;
  type?: string | null;
  amount?: string | null;
  closeDate?: string | null;
  probability?: number | null;
  forecastCategory?: string | null;
  partnerId?: string | null;
  businessType?: string | null;
  leadSource?: string | null;
  paymentTerms?: string | null;
  nextStep?: string | null;
  description?: string | null;
  lostReason?: string | null;
  lostReasonDetail?: string | null;
  customScopeDetail?: string | null;
  futurePhaseNotes?: string | null;
  billingNotes?: string | null;
  projectStartDate?: string | null;
  projectCompletionDate?: string | null;
  projectDuration?: number | null;
  subcontract?: boolean;
  partnerHold?: boolean;
  performancePulse?: boolean;
  invoiceSentAt?: string | null;
  invoicePaidAt?: string | null;
  csatScore?: number | null;
  isSql?: boolean;
  sqlDate?: string | null;
  dealLength?: number | null;
  auditCompleted?: boolean;
  auditCompletedDate?: string | null;
  threeMonthAuditDate?: string | null;
  contractRef?: string | null;
  syncedQuoteRef?: string | null;
  campaignSourceRef?: string | null;
  ownerId?: string | null;
  leadConsultantId?: string | null;
  secondaryConsultantId?: string | null;
  primaryContactId?: string | null;
  billingContactId?: string | null;
  partnerAeId?: string | null;
}

export const STAGE_OPTIONS: Option[] = [
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "DISCOVERY", label: "Discovery" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "INTRODUCTION", label: "Introduction" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "CONTRACT", label: "Contract" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const FORECAST_OPTIONS: Option[] = [
  { value: "Pipeline", label: "Pipeline" },
  { value: "Best Case", label: "Best Case" },
  { value: "Commit", label: "Commit" },
  { value: "Closed", label: "Closed" },
  { value: "Omitted", label: "Omitted" },
];

const BUSINESS_OPTIONS: Option[] = [
  { value: "New Business", label: "New Business" },
  { value: "Existing Business", label: "Existing Business" },
];

export function DealForm({
  values,
  accounts,
  partners,
  people,
  contacts,
  partnerContacts,
  partnerAccounts,
  cancelHref,
}: {
  values: DealValues;
  accounts: Option[];
  partners: Option[];
  people: Option[];
  /** Contacts at this deal's account. */
  contacts: Option[];
  /** Contacts at the partner accounts, for the Partner AE. */
  partnerContacts: Option[];
  /** The partner accounts themselves, for adding an AE to one. */
  partnerAccounts: Option[];
  cancelHref: string;
}) {
  const isNew = !values.id;

  return (
    <RecordForm
      action={saveDealAction}
      cancelHref={cancelHref}
      saveLabel={isNew ? "Create deal" : "Save deal"}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <FormColumns
        title="Opportunity information"
        left={
          <>
            <Select
              label="Account name"
              name="clientId"
              value={values.clientId}
              options={accounts}
              empty="— choose one —"
              hint="Required: a deal belongs to a company."
            />
            <TextInput label="Opportunity name" name="name" value={values.name} required />
            <Select
              label="Type"
              name="partnerId"
              value={values.partnerId}
              options={partners}
              empty="— direct —"
              hint="Outreach, Salesloft and the rest."
            />
            <Select
              label="Business type"
              name="businessType"
              value={values.businessType}
              options={BUSINESS_OPTIONS}
            />
            <Select
              label="Opportunity record type"
              name="type"
              value={values.type ?? "DIRECT"}
              options={[
                { value: "DIRECT", label: "Direct" },
                { value: "PARTNER", label: "Partner" },
              ]}
              empty={null}
            />
            <Select
              label="Opportunity owner"
              name="ownerId"
              value={values.ownerId}
              options={people}
              empty="— nobody —"
            />
            <Check label="Partner hold" name="partnerHold" value={values.partnerHold} />
            <DateInput label="SQL date" name="sqlDate" value={values.sqlDate} />
            <Check label="SQL" name="isSql" value={values.isSql} />
            <PartnerAePicker
              name="partnerAeId"
              label="Partner AE"
              value={values.partnerAeId}
              options={partnerContacts}
              partners={partnerAccounts}
              hint="The person at the partner who brought it. Type to narrow, or add them."
            />
            <NumberInput label="CSAT score" name="csatScore" value={values.csatScore} />
            <Check
              label="Audit completed"
              name="auditCompleted"
              value={values.auditCompleted}
            />
            <DateInput
              label="Audit completed date"
              name="auditCompletedDate"
              value={values.auditCompletedDate}
            />
          </>
        }
        right={
          <>
            <Select
              label="Stage"
              name="stage"
              value={values.stage ?? "QUALIFICATION"}
              options={STAGE_OPTIONS}
              empty={null}
              hint="Won and lost follow from this. Nothing else to keep in step."
            />
            <NumberInput
              label="Amount"
              name="amount"
              value={values.amount}
              hint="Commas and a $ are fine."
            />
            <DateInput label="Close date" name="closeDate" value={values.closeDate} />
            <NumberInput
              label="Probability (%)"
              name="probability"
              value={values.probability}
              hint="Left empty, a closed deal takes 100 or 0."
            />
            <Select
              label="Forecast category"
              name="forecastCategory"
              value={values.forecastCategory}
              options={FORECAST_OPTIONS}
            />
            <TextInput label="Next step" name="nextStep" value={values.nextStep} />
            <NumberInput
              label="Deal length (days)"
              name="dealLength"
              value={values.dealLength}
            />
            <TextInput label="Lost reason" name="lostReason" value={values.lostReason} />
            <TextInput
              label="Lost reason detail"
              name="lostReasonDetail"
              value={values.lostReasonDetail}
            />
            <DateInput
              label="3 month audit date"
              name="threeMonthAuditDate"
              value={values.threeMonthAuditDate}
            />
          </>
        }
      />

      <FormColumns
        title="Opportunity detail"
        left={<TextBox label="Description" name="description" value={values.description} rows={4} />}
        right={null}
      />

      <FormColumns
        title="Billing notes"
        left={
          <>
            <TextBox
              label="Billing notes"
              name="billingNotes"
              value={values.billingNotes}
              rows={3}
            />
            <Check label="Subcontract" name="subcontract" value={values.subcontract} />
            <Select
              label="Billing contact"
              name="billingContactId"
              value={values.billingContactId}
              options={contacts}
              empty="— nobody —"
            />
          </>
        }
        right={
          <>
            <TextInput
              label="Payment terms"
              name="paymentTerms"
              value={values.paymentTerms}
              placeholder="Net 30"
            />
            <DateInput label="Invoice sent" name="invoiceSentAt" value={values.invoiceSentAt} />
            <DateInput label="Invoice paid" name="invoicePaidAt" value={values.invoicePaidAt} />
          </>
        }
      />

      <FormColumns
        title="Project notes"
        left={
          <>
            <Select
              label="Primary contact"
              name="primaryContactId"
              value={values.primaryContactId}
              options={contacts}
              empty="— nobody —"
              hint={
                contacts.length === 0
                  ? "Save the deal first, then this account's contacts appear here."
                  : undefined
              }
            />
            <Select
              label="Lead consultant"
              name="leadConsultantId"
              value={values.leadConsultantId}
              options={people}
              empty="— nobody —"
            />
            <Select
              label="Secondary consultant"
              name="secondaryConsultantId"
              value={values.secondaryConsultantId}
              options={people}
              empty="— nobody —"
            />
            <DateInput
              label="Project start date"
              name="projectStartDate"
              value={values.projectStartDate}
            />
            <DateInput
              label="Project completion date"
              name="projectCompletionDate"
              value={values.projectCompletionDate}
            />
          </>
        }
        right={
          <>
            <TextBox
              label="Custom scope detail"
              name="customScopeDetail"
              value={values.customScopeDetail}
              rows={3}
            />
            <Check
              label="Performance Pulse opt-in"
              name="performancePulse"
              value={values.performancePulse}
            />
            <TextBox
              label="Future phase notes"
              name="futurePhaseNotes"
              value={values.futurePhaseNotes}
              rows={3}
            />
            <NumberInput
              label="Project duration (days)"
              name="projectDuration"
              value={values.projectDuration}
            />
          </>
        }
      />

      <FormColumns
        title="Other information"
        left={
          <>
            <TextInput label="Contract" name="contractRef" value={values.contractRef} />
            <TextInput label="Lead source" name="leadSource" value={values.leadSource} />
          </>
        }
        right={
          <>
            <TextInput
              label="Synced quote"
              name="syncedQuoteRef"
              value={values.syncedQuoteRef}
            />
            <TextInput
              label="Primary campaign source"
              name="campaignSourceRef"
              value={values.campaignSourceRef}
            />
          </>
        }
      />
    </RecordForm>
  );
}
