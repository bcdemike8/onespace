import { saveLineAction } from "@/app/actions/crm-records";
import { RecordForm } from "@/components/crm/RecordForm";
import {
  DateInput,
  FormColumns,
  NumberInput,
  Option,
  Select,
  TextBox,
  TextInput,
} from "@/components/crm/FormFields";

/** One product line on a deal — Salesforce's Opportunity Product. */

export interface LineValues {
  id?: string;
  dealId: string;
  productId?: string | null;
  productName?: string | null;
  productCode?: string | null;
  quantity?: string | null;
  unitPrice?: string | null;
  totalPrice?: string | null;
  listPrice?: string | null;
  serviceDate?: string | null;
  description?: string | null;
}

export function LineForm({
  values,
  products,
  cancelHref,
}: {
  values: LineValues;
  products: Option[];
  cancelHref: string;
}) {
  const isNew = !values.id;

  return (
    <RecordForm
      action={saveLineAction}
      cancelHref={cancelHref}
      saveLabel={isNew ? "Add product" : "Save line"}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="dealId" value={values.dealId} />

      {products.length === 0 ? (
        // An empty dropdown looks like a broken page. Say which of the two
        // things it actually is, and where to fix it.
        <p className="mb-4 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          There are no products in the catalogue yet, so the dropdown below is
          empty. Type what was sold into Product name instead — or load
          Product2.csv with the Products step of the Salesforce import and the
          whole catalogue appears here.
        </p>
      ) : null}

      <FormColumns
        title="Details"
        left={
          <>
            <Select
              label="Product"
              name="productId"
              value={values.productId}
              options={products}
              empty="— not in the catalogue —"
              hint={
                products.length === 0
                  ? undefined
                  : `${products.length} in the catalogue. Retired ones are listed under "No longer sold" — an old deal still needs them.`
              }
            />
            <TextInput
              label="Product name"
              name="productName"
              value={values.productName}
              hint="Only needed when the product isn't in the catalogue. Kept either way, so an old line still says what was sold."
            />
            <NumberInput
              label="Sales price"
              name="unitPrice"
              value={values.unitPrice}
              hint="What was actually charged, per unit."
            />
            <NumberInput label="Quantity" name="quantity" value={values.quantity} />
            <TextBox
              label="Line description"
              name="description"
              value={values.description}
              rows={3}
              hint={'"Includes Amplify" — the difference between two otherwise identical lines.'}
            />
          </>
        }
        right={
          <>
            <DateInput label="Date" name="serviceDate" value={values.serviceDate} />
            <TextInput
              label="Product code"
              name="productCode"
              value={values.productCode}
            />
            <NumberInput
              label="List price"
              name="listPrice"
              value={values.listPrice}
              hint="The catalogue price. Against the sales price it is the discount, which nothing else records."
            />
            <NumberInput
              label="Total price"
              name="totalPrice"
              value={values.totalPrice}
              hint="Left empty, quantity × sales price. Type one to override that — a discount taken at the line is real."
            />
          </>
        }
      />
    </RecordForm>
  );
}
