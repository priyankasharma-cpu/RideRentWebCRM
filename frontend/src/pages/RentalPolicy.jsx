import { VehicleRentalPolicy } from '../components/policy/VehicleRentalPolicy.jsx';
import { FinalCTA } from '../components/home/FinalCTA.jsx';
export default function RentalPolicyPage() {
  return (
    <main>
      <VehicleRentalPolicy />
      <FinalCTA titleLead="Where will you" titleAccent="go next?" ctaLabel="Explore the Fleet" />
    </main>
  );
}
