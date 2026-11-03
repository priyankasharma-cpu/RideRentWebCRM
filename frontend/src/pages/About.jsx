import { AboutHero } from '../components/about/AboutHero.jsx';
import { AboutStory } from '../components/about/AboutStory.jsx';
import { AboutFeatures } from '../components/about/AboutFeatures.jsx';
import { AboutMission } from '../components/about/AboutMission.jsx';

import { FinalCTA } from '../components/home/FinalCTA.jsx';

export default function AboutPage() {
  return (
    <main className="about-page">
      <AboutHero />
      <AboutStory />
      <AboutFeatures />
      <AboutMission />

      <FinalCTA titleLead="Where will you" titleAccent="go next?" ctaLabel="Explore the Fleet" />
    </main>
  );
}
