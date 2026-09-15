/**
 * What went wrong talking to Outreach.
 *
 * Carries Outreach's own reply alongside our reading of it. When a guess
 * about their API turns out wrong, their words are the only thing that says
 * how — so they are kept rather than swallowed into a tidy message.
 */
export class OutreachError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly body?: string,
  ) {
    super(message);
    this.name = "OutreachError";
  }
}
