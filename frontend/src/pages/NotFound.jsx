import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
export function NotFound() {
  return (
    <main className="container page portal-page">
      <div className="eyebrow">404 · WRONG TURN</div>
      <h1>
        Let’s get you <em>back on track.</em>
      </h1>
      <p>That page or ride could not be found.</p>
      <Link className="rr-button" to="/">
        Back to Home <ArrowRight size={16} />
      </Link>
    </main>
  );
}
