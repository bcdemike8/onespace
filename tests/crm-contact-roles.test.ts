import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanContact,
  contactName,
  contactProblem,
  isBillingRole,
} from "../src/lib/crm/contact-roles";

test("anything that mentions billing is the billing contact", () => {
  for (const r of ["Billing Contact", "billing", "AP / Billing", "BILLING CONTACT"]) {
    assert.equal(isBillingRole(r), true, r);
  }
});

test("other roles are not, and neither is nothing", () => {
  for (const r of ["Decision Maker", "Executive Sponsor", "", null, undefined]) {
    assert.equal(isBillingRole(r), false, String(r));
  }
});

test("a name is both parts, or whichever part there is", () => {
  assert.equal(contactName({ firstName: "Dana", lastName: "Whitfield" }), "Dana Whitfield");
  assert.equal(contactName({ firstName: null, lastName: "Whitfield" }), "Whitfield");
  assert.equal(contactName({ firstName: "Dana", lastName: null }), "Dana");
  assert.equal(contactName({ firstName: "  ", lastName: " Whitfield " }), "Whitfield");
});

test("a surname is the only thing actually required", () => {
  assert.equal(contactProblem({ lastName: "Whitfield", email: null }), null);
  assert.match(contactProblem({ lastName: "   ", email: null }) ?? "", /surname/);
});

test("an email is checked only for mistakes that are certainly mistakes", () => {
  assert.equal(contactProblem({ lastName: "W", email: "dana@acme.com" }), null);
  assert.equal(contactProblem({ lastName: "W", email: "   " }), null);
  for (const bad of ["dana", "dana@acme", "dana @acme.com", "a@b@c.com"]) {
    assert.match(contactProblem({ lastName: "W", email: bad }) ?? "", /doesn't look like/, bad);
  }
});

test("cleaning trims, drops blanks and lowercases the email", () => {
  assert.deepEqual(
    cleanContact({
      firstName: "  Dana ",
      lastName: " Whitfield ",
      email: " Dana@ACME.com ",
      title: "   ",
      phone: null,
    }),
    {
      firstName: "Dana",
      lastName: "Whitfield",
      email: "dana@acme.com",
      title: null,
      phone: null,
    },
  );
});
