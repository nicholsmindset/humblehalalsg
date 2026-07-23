import { WizardFooter } from "humblehalalsg";

export const BackAndContinue = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardFooter>
      <button className="btn btn-ghost">Back</button>
      <button className="btn btn-primary">Continue</button>
    </WizardFooter>
  </div>
);

export const FirstStep = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardFooter>
      <button className="btn btn-ghost">Save draft</button>
      <button className="btn btn-primary">Continue</button>
    </WizardFooter>
  </div>
);

export const PublishStep = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardFooter>
      <button className="btn btn-ghost">Back</button>
      <button className="btn btn-primary">Publish listing</button>
    </WizardFooter>
  </div>
);
