import { saveContactAction } from "@/app/actions/crm-records";
import { RecordForm } from "@/components/crm/RecordForm";
import {
  Check,
  FormColumns,
  Option,
  Select,
  TextBox,
  TextInput,
} from "@/components/crm/FormFields";

/** The contact form, in the read page's sections and order. */

export interface ContactValues {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  clientId?: string | null;
  ownerId?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  fax?: string | null;
  department?: string | null;
  reportsToId?: string | null;
  linkedinUrl?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  description?: string | null;
  leadSource?: string | null;
  referralLeadSource?: string | null;
  noLongerHere?: boolean;
  optedOutOfEmail?: boolean;
}

export function ContactForm({
  values,
  accounts,
  people,
  colleagues,
  cancelHref,
}: {
  values: ContactValues;
  accounts: Option[];
  people: Option[];
  /** Other contacts at the same account, for Reports To. */
  colleagues: Option[];
  cancelHref: string;
}) {
  const isNew = !values.id;

  return (
    <RecordForm
      action={saveContactAction}
      cancelHref={cancelHref}
      saveLabel={isNew ? "Create contact" : "Save contact"}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <FormColumns
        title="Contact information"
        left={
          <>
            <Select
              label="Account name"
              name="clientId"
              value={values.clientId}
              options={accounts}
              empty="— no company —"
              hint="Nearly 4,500 of the imported contacts have none. That is allowed."
            />
            <Select
              label="Contact owner"
              name="ownerId"
              value={values.ownerId}
              options={people}
              empty="— nobody —"
            />
            <TextInput label="First name" name="firstName" value={values.firstName} />
            <TextInput label="Surname" name="lastName" value={values.lastName} required />
            <TextInput label="LinkedIn URL" name="linkedinUrl" value={values.linkedinUrl} />
            <TextInput
              label="Referral lead source"
              name="referralLeadSource"
              value={values.referralLeadSource}
              hint="Who sent them, where that was a person."
            />
          </>
        }
        right={
          <>
            <TextInput label="Title" name="title" value={values.title} />
            <TextInput label="Email" name="email" type="email" value={values.email} />
            <TextInput label="Phone" name="phone" type="tel" value={values.phone} />
            <Check
              label="No longer with company"
              name="noLongerHere"
              value={values.noLongerHere}
              hint="Stops anyone emailing them. The single most useful flag in the export."
            />
            <Check
              label="Opted out of email"
              name="optedOutOfEmail"
              value={values.optedOutOfEmail}
              hint="They asked not to be emailed. The obligation outlives the system."
            />
          </>
        }
      />

      <FormColumns
        title="Additional information"
        left={
          <>
            <TextInput label="Mobile" name="mobile" type="tel" value={values.mobile} />
            <TextInput label="Fax" name="fax" value={values.fax} />
            <TextInput label="Lead source" name="leadSource" value={values.leadSource} />
          </>
        }
        right={
          <>
            <Select
              label="Reports to"
              name="reportsToId"
              value={values.reportsToId}
              options={colleagues}
              empty="— nobody —"
              hint={
                colleagues.length === 0
                  ? "Nobody else is on this account yet."
                  : "Someone else at the same account."
              }
            />
            <TextInput label="Department" name="department" value={values.department} />
          </>
        }
      />

      <FormColumns
        title="Address information"
        left={
          <>
            <TextInput label="Street" name="street" value={values.street} />
            <TextInput label="City" name="city" value={values.city} />
            <TextInput label="State" name="state" value={values.state} />
          </>
        }
        right={
          <>
            <TextInput label="Postal code" name="postalCode" value={values.postalCode} />
            <TextInput label="Country" name="country" value={values.country} />
          </>
        }
      />

      <FormColumns
        title="Notes"
        left={
          <TextBox
            label="Person notes"
            name="notes"
            value={values.notes}
            rows={4}
            hint="A line about who this is."
          />
        }
        right={
          <TextBox
            label="Description"
            name="description"
            value={values.description}
            rows={4}
            hint="Salesforce's long text. Separate from Person notes on purpose."
          />
        }
      />
    </RecordForm>
  );
}
