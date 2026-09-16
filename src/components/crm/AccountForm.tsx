import { saveAccountAction } from "@/app/actions/crm-records";
import { RecordForm } from "@/components/crm/RecordForm";
import {
  Check,
  DateInput,
  FormColumns,
  ListInput,
  NumberInput,
  Option,
  Select,
  TextBox,
  TextInput,
} from "@/components/crm/FormFields";

/**
 * The account form, in the read page's own sections and order.
 *
 * Pressing Edit should feel like the page became typeable, not like a
 * different screen opened. So: the same five headings, the same fields in
 * the same columns, the same words. Only the controls differ.
 *
 * New and Edit are one component. A create form that has drifted from its
 * edit form is how a field ends up unfillable at the moment it matters and
 * fillable a week later, and nobody can say when that changed.
 */

export interface AccountValues {
  id?: string;
  name?: string | null;
  legalName?: string | null;
  accountType?: string | null;
  partnerId?: string | null;
  ownerId?: string | null;
  parentId?: string | null;
  primaryContactId?: string | null;
  industry?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  phone?: string | null;
  description?: string | null;
  notes?: string | null;
  employees?: number | null;
  annualRevenue?: string | null;
  xdrSize?: number | null;
  teamSize?: number | null;
  technologyUsed?: string[] | null;
  salesRoles?: string[] | null;
  funders?: string[] | null;
  escalation?: boolean;
  apolloStage?: string | null;
  implementationOwner?: string | null;
  billingStreet?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export const ACCOUNT_TYPE_OPTIONS: Option[] = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CURRENT_CUSTOMER", label: "Current Customer" },
  { value: "PREVIOUS_CUSTOMER", label: "Previous Customer" },
  { value: "PARTNER", label: "Partner" },
  { value: "COMPETITOR", label: "Competitor" },
];

export function AccountForm({
  values,
  partners,
  people,
  accounts,
  contacts,
  cancelHref,
}: {
  values: AccountValues;
  partners: Option[];
  people: Option[];
  /** Every other account, for the parent picker. */
  accounts: Option[];
  /** This account's own contacts, for the primary contact picker. */
  contacts: Option[];
  cancelHref: string;
}) {
  const isNew = !values.id;

  return (
    <RecordForm
      action={saveAccountAction}
      cancelHref={cancelHref}
      saveLabel={isNew ? "Create account" : "Save account"}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <FormColumns
        title="Account information"
        left={
          <>
            <TextInput label="Account name" name="name" value={values.name} required />
            <Select
              label="Account owner"
              name="ownerId"
              value={values.ownerId}
              options={people}
              empty="— nobody —"
            />
            <TextInput label="Legal name" name="legalName" value={values.legalName} />
            <Select
              label="Type"
              name="partnerId"
              value={values.partnerId}
              options={partners}
              empty="— direct —"
              hint="The platform this account's work runs on."
            />
            <Select
              label="Account record type"
              name="accountType"
              value={values.accountType}
              options={ACCOUNT_TYPE_OPTIONS}
              empty={null}
            />
            <TextInput label="Industry" name="industry" value={values.industry} />
          </>
        }
        right={
          <>
            <Select
              label="Parent account"
              name="parentId"
              value={values.parentId}
              options={accounts}
              empty="— none —"
            />
            {isNew ? null : (
              <Select
                label="Primary contact"
                name="primaryContactId"
                value={values.primaryContactId}
                options={contacts}
                empty="— none —"
                hint={
                  contacts.length === 0
                    ? "No contacts on this account yet."
                    : undefined
                }
              />
            )}
            <TextInput
              label="Apollo implementation stage"
              name="apolloStage"
              value={values.apolloStage}
            />
            <TextInput
              label="Implementation owner"
              name="implementationOwner"
              value={values.implementationOwner}
            />
            <Check
              label="Escalation / bad client experience"
              name="escalation"
              value={values.escalation}
              hint="Flags the account page. Worth reading the history before the next call."
            />
          </>
        }
      />

      <FormColumns
        title="Performance Pulse info"
        left={
          <>
            <ListInput
              label="Technology used"
              name="technologyUsed"
              value={values.technologyUsed}
            />
            <ListInput
              label="Sales roles present"
              name="salesRoles"
              value={values.salesRoles}
            />
            <NumberInput label="XDR size" name="xdrSize" value={values.xdrSize} />
            <NumberInput label="Team size" name="teamSize" value={values.teamSize} />
          </>
        }
        right={
          <>
            <NumberInput
              label="Employees"
              name="employees"
              value={values.employees}
              hint="The number. The page works the band out from it."
            />
            <NumberInput
              label="Annual revenue"
              name="annualRevenue"
              value={values.annualRevenue}
              hint="In dollars. Commas and a $ are fine."
            />
            <ListInput label="Funders" name="funders" value={values.funders} />
          </>
        }
      />

      <FormColumns
        title="Additional information"
        left={
          <>
            <TextInput label="Website" name="website" value={values.website} />
            <TextInput label="Phone" name="phone" value={values.phone} />
          </>
        }
        right={<TextInput label="LinkedIn" name="linkedinUrl" value={values.linkedinUrl} />}
      />

      <FormColumns
        title="Address information"
        left={
          <>
            <TextInput label="Billing street" name="billingStreet" value={values.billingStreet} />
            <TextInput label="Billing city" name="billingCity" value={values.billingCity} />
            <TextInput label="Billing state" name="billingState" value={values.billingState} />
            <TextInput
              label="Billing postal code"
              name="billingPostalCode"
              value={values.billingPostalCode}
            />
            <TextInput label="Billing country" name="billingCountry" value={values.billingCountry} />
          </>
        }
        right={
          <>
            <TextInput label="Shipping street" name="street" value={values.street} />
            <TextInput label="Shipping city" name="city" value={values.city} />
            <TextInput label="Shipping state" name="state" value={values.state} />
            <TextInput label="Shipping postal code" name="postalCode" value={values.postalCode} />
            <TextInput label="Shipping country" name="country" value={values.country} />
          </>
        }
      />

      <FormColumns
        title="Notes"
        left={<TextBox label="Description" name="description" value={values.description} rows={4} />}
        right={<TextBox label="Internal notes" name="notes" value={values.notes} rows={4} />}
      />
    </RecordForm>
  );
}

/** Kept here so the pages that build option lists don't each re-derive it. */
export const personOption = (p: {
  id: string;
  firstName?: string | null;
  lastName: string;
  title?: string | null;
}): Option => ({
  value: p.id,
  label:
    [p.firstName, p.lastName].filter(Boolean).join(" ") +
    (p.title ? ` — ${p.title}` : ""),
});

export { DateInput };
