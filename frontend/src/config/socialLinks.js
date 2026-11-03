import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';

// Add verified HTTPS profile URLs here. Empty or invalid URLs are never rendered.
export const socialLinks = [
  { id: 'facebook', label: 'Facebook', icon: Facebook, url: '' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, url: '' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, url: '' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: '' },
];

export function getConfiguredSocialLinks(links = socialLinks) {
  return links.filter(({ url }) => {
    if (typeof url !== 'string' || !url.trim()) return false;
    try {
      return new URL(url).protocol === 'https:';
    } catch {
      return false;
    }
  });
}
