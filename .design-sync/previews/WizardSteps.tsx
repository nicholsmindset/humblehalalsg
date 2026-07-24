import { WizardSteps } from "humblehalalsg";

const listingSteps = ["Business", "Halal status", "Details & photos", "Review"] as const;

export const AddListingStep2 = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardSteps steps={listingSteps} step={1} />
  </div>
);

export const AddListingStep3 = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardSteps steps={listingSteps} step={2} />
  </div>
);

export const ClaimFinalStep = () => (
  <div style={{ maxWidth: 540 }}>
    <WizardSteps
      steps={["Verify ownership", "Business details", "MUIS certificate", "Submit"]}
      step={3}
    />
  </div>
);
