import { CodeBlock } from '@/components/CodeBlock'
import { MediaFigure } from '@/components/marketing/MediaFigure'
import { PRODUCT_MEDIA } from '@/data/product'

const HEADING_ID = 'home-code-ui-heading'
const RESULT = PRODUCT_MEDIA['resource-index']

// A short, compilable excerpt of the Playground's
// app/Martis/Resources/ClientResource.php, the resource behind the
// "Clients" screenshot beside it (resource-index.png): its index columns
// with the same field calls, minus the translated labels, the Stack/Icon
// identity column and part of each badge map (spec 6.4 asks for a short
// sample). Every method is Martis API at v1.39.1 (`Badge::map`,
// `Country::withFlags`, `Currency`, `sortable`/`searchable`).
const CLIENT_RESOURCE = `<?php

namespace App\\Martis\\Resources;

use App\\Models\\Client;
use Illuminate\\Http\\Request;
use Martis\\Fields\\{Badge, Country, Currency, Text};
use Martis\\Resource;

class ClientResource extends Resource
{
    public static function model(): string
    {
        return Client::class;
    }

    public function fields(Request $request): array
    {
        return [
            Text::make('name')->sortable()->searchable(),
            Text::make('company')->sortable()->searchable(),
            Badge::make('plan')
                ->map(['free' => 'info', 'pro' => 'success']),
            Currency::make('monthly_revenue')->sortable(),
            Badge::make('status')->map(['active' => 'success']),
            Country::make('country')->withFlags(),
        ];
    }
}`

/**
 * "Code to interface" (design spec 6.4): a real resource class beside
 * the screen Martis renders from it in the Playground. The two are
 * numbered steps, so on a narrow screen they stack in reading order
 * (declare, then render) without losing the link between them. The
 * `#how-it-works` id is the target of the hero's "See how it works".
 */
export function CodeUI() {
  return (
    <section id="how-it-works" className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container">
        <header className="home-section__head">
          <div>
            <p className="home-kicker">Code to production interface</p>
            <h2 id={HEADING_ID} className="home-h2">
              Declare the resource. Ship the workflow.
            </h2>
          </div>
          <p className="home-section__copy">
            A plain PHP class becomes a React workspace with routes, validation, search, sorting and filters. No
            controllers, no hand-built forms.
          </p>
        </header>

        <ol className="home-code-ui">
          <li className="home-code-ui__step">
            <p className="home-code-ui__label">
              <span className="home-code-ui__no">1</span> Declare the resource
            </p>
            <CodeBlock lang="php" filename="app/Martis/Resources/ClientResource.php" code={CLIENT_RESOURCE} />
          </li>
          <li className="home-code-ui__step">
            <p className="home-code-ui__label">
              <span className="home-code-ui__no">2</span> Martis renders the index
            </p>
            <MediaFigure
              src={RESULT.src}
              alt={RESULT.alt}
              caption={RESULT.caption}
              width={RESULT.width}
              height={RESULT.height}
            />
          </li>
        </ol>
      </div>
    </section>
  )
}
