import { HomePageProvider, useHomePage } from '../context/HomePageContext';
import { HeroSection } from '../components/home/HeroSection';
import { TrustBar } from '../components/home/TrustBar';
import { VehicleAnimation } from '../components/home/VehicleAnimation';
import { VehicleCategories } from '../components/home/VehicleCategories';
import { PopularVehicles } from '../components/home/PopularVehicles';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { HowItWorks } from '../components/home/HowItWorks';
import { RentalNotice } from '../components/home/RentalNotice';
import { FAQSection } from '../components/home/FAQSection';
import { FinalCTA } from '../components/home/FinalCTA';
export default function Home() {
  return (
    <HomePageProvider>
      <HomeSections />
    </HomePageProvider>
  );
}
function HomeSections() {
  const { category, setCategory } = useHomePage();
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <VehicleAnimation category={category} onCategory={setCategory} />
      <VehicleCategories />
      <PopularVehicles />
      <WhyChooseUs />
      <HowItWorks />
      <RentalNotice />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}
