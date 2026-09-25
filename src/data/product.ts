// Product chapter data for the homepage's "Product chapters" section
// (design spec 6.5) and the full Product page (spec 7). Copy, outcomes
// and agency scenarios stay out of JSX so editorial edits never touch
// layout code (decision 6). Code samples are copied or adapted, with a
// named source, from the package docs at tag v1.39.1 (decision 5): they
// are real, current Martis API, not invented for marketing. Every
// outcome, caption and prerequisite is a claim checked against those same
// docs; version requirements come from the validated release manifest.

import { formatLaravelRequirement, formatPhpRequirement, loadReleaseManifest } from '@/lib/generated-data'

const RELEASE = loadReleaseManifest()

export type ProductChapterId = 'model' | 'operate' | 'secure' | 'adapt' | 'extend' | 'ship'

export const PRODUCT_CHAPTER_IDS: ProductChapterId[] = ['model', 'operate', 'secure', 'adapt', 'extend', 'ship']

export interface ProductChapterCode {
  language: 'php' | 'tsx' | 'bash'
  filename: string
  source: string
}

export interface ProductChapterData {
  id: ProductChapterId
  title: string
  outcome: string
  agencyScenario: string
  docsHref: string
  mediaId: ProductMediaId
  code: ProductChapterCode
  /** Relevant limitation or prerequisite for this chapter (spec 7),
   *  shown on the Product page under the code sample. Kept honest and
   *  specific: only what a reader would actually need to know before
   *  relying on the chapter, never a generic disclaimer. */
  prerequisite: string
}

export type ProductMediaId =
  | 'resource-create'
  | 'resource-index'
  | 'profile'
  | 'dashboard'
  | 'tool-system-status'
  | 'login'

export interface ProductMediaEntry {
  src: string
  alt: string
  /** Benefit-oriented caption, shown under the image by `MediaFigure`. */
  caption: string
  width: number
  height: number
}

// The Martis release the committed files in public/screenshots/ were
// captured at: they were last refreshed in this repository's commit
// 1e4e05d ("refresh as admin@martis.local + v1.2.1"), and the panel's
// own sidebar footer in each image reads v1.2.1. Surfaces that show a
// screenshot label it with this version, not the current release, so a
// reader always knows how current the picture is (spec 6.1, 6.7). The
// versioned `ProductMediaManifest` replaces it in Phase 4.
export const PRODUCT_MEDIA_VERSION = '1.2.1'

// Real pixel dimensions of the committed files in public/screenshots/
// (captured at 1280x800; a versioned `ProductMediaManifest` replaces
// this table once Phase 4 lands the capture pipeline).
export const PRODUCT_MEDIA: Record<ProductMediaId, ProductMediaEntry> = {
  'resource-create': {
    src: '/screenshots/resource-create.webp',
    alt: 'A Martis resource create form with reactive fields',
    caption: 'Fields declared once in PHP render a validated, reactive React form.',
    width: 1280,
    height: 800,
  },
  'resource-index': {
    src: '/screenshots/resource-index.webp',
    alt: 'A Martis resource index table with filters and bulk actions',
    caption: 'Sortable, searchable tables with filters and bulk actions, each declared in the resource.',
    width: 1280,
    height: 800,
  },
  profile: {
    src: '/screenshots/profile.webp',
    alt: 'A Martis user profile page with two-factor authentication settings',
    caption: 'Login is built in; two-factor auth and SSO switch on when a client needs them.',
    width: 1280,
    height: 800,
  },
  dashboard: {
    src: '/screenshots/dashboard.webp',
    alt: 'The Martis dashboard with navigation, metrics and a branded theme',
    caption: 'Navigation, layout and theme tokens adapt to each client without a fork.',
    width: 1280,
    height: 800,
  },
  'tool-system-status': {
    src: '/screenshots/tool-system-status.webp',
    alt: 'A custom Martis Tool page showing system status',
    caption: 'Custom Tools and field components extend the panel with application code.',
    width: 1280,
    height: 800,
  },
  login: {
    src: '/screenshots/login.webp',
    alt: 'The Martis login page',
    caption: 'One install command, then a working admin login for the next client.',
    width: 1280,
    height: 800,
  },
}

export const PRODUCT_CHAPTERS: ProductChapterData[] = [
  {
    id: 'model',
    title: 'Model',
    outcome: 'A plain PHP class becomes a validated, searchable CRUD interface with no boilerplate controller or form.',
    agencyScenario:
      'A new client project needs a Clients resource by end of day: fields, validation and search, without hand-building a form.',
    docsHref: '/docs/core/resources',
    mediaId: 'resource-create',
    code: {
      language: 'php',
      filename: 'app/Martis/PostResource.php',
      // Adapted from docs/resources.md ("Creating a Resource") at v1.39.1.
      source: `<?php

namespace App\\Martis;

use App\\Models\\Post;
use Illuminate\\Http\\Request;
use Martis\\Fields\\Id;
use Martis\\Fields\\Text;
use Martis\\Resource;

class PostResource extends Resource
{
    public static function model(): string
    {
        return Post::class;
    }

    public function fields(Request $request): array
    {
        return [
            Id::make('id'),
            Text::make('title')->sortable()->searchable()->required(),
        ];
    }
}`,
    },
    prerequisite: 'Requires an existing Eloquent model; you declare its fields in the resource\'s fields() method, and Martis does not generate the model or its migration.',
  },
  {
    id: 'operate',
    title: 'Operate',
    outcome: 'Table actions run on one record or a whole selection, with confirmation and a typed response the UI renders.',
    agencyScenario:
      'Editorial staff need to publish a batch of drafts at once, with confirmation and a visible result, not a one-off script.',
    docsHref: '/docs/core/actions',
    mediaId: 'resource-index',
    code: {
      language: 'php',
      filename: 'app/Martis/Actions/PublishPosts.php',
      // Adapted from docs/actions.md ("Defining a Bulk Action") at v1.39.1.
      source: `<?php

namespace App\\Martis\\Actions;

use Illuminate\\Support\\Collection;
use Martis\\Actions\\Action;
use Martis\\Actions\\ActionFields;
use Martis\\Actions\\ActionResponse;

class PublishPosts extends Action
{
    public ?string $name = 'Publish Posts';

    public function handle(ActionFields $fields, Collection $models): ActionResponse|Action|null
    {
        foreach ($models as $post) {
            $post->update(['status' => 'published', 'published_at' => now()]);
        }

        return ActionResponse::message("{$models->count()} post(s) published successfully.");
    }
}`,
    },
    prerequisite: 'Bulk actions still run each authorization check per model; a large selection runs as many policy calls.',
  },
  {
    id: 'secure',
    title: 'Secure',
    outcome: 'Every write is re-authorized server-side through the model\'s Laravel policy, whatever the UI already hid.',
    agencyScenario:
      'A client needs authors to edit only their own posts, and admins to delete any post, enforced even if someone bypasses the UI.',
    docsHref: '/docs/auth/authorization',
    mediaId: 'profile',
    code: {
      language: 'php',
      filename: 'app/Policies/PostPolicy.php',
      // Adapted from docs/authorization.md ("Writing a policy") at v1.39.1.
      source: `<?php

namespace App\\Policies;

use App\\Models\\Post;
use App\\Models\\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->author_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->is_admin;
    }
}`,
    },
    prerequisite: 'Policies are plain, auto-discovered Laravel classes, but a model with no policy allows every ability: write one per model before going live.',
  },
  {
    id: 'adapt',
    title: 'Adapt',
    outcome: 'A theme is a CSS file that overrides design tokens; no rebuild, and the change is visible on refresh.',
    agencyScenario:
      'Each client backoffice needs its own brand colors and dark/light default, without diverging from the shared component set.',
    docsHref: '/docs/customization/theming',
    mediaId: 'dashboard',
    code: {
      language: 'php',
      filename: 'config/martis.php',
      // Adapted from docs/theming.md ("Configuration") at v1.39.1.
      source: `'theme' => [
    'default' => 'dark',           // Initial mode: 'dark' or 'light'
    'allowToggle' => true,         // Show light/dark toggle in user menu
    'name' => 'mytheme',           // Theme CSS file name (null = default)
],`,
    },
    prerequisite: 'The theme Martis serves is the plain CSS copy in public/vendor/martis/themes/. martis:publish-assets empties public/vendor/martis/ before copying, so copy the theme back after republishing assets.',
  },
  {
    id: 'extend',
    title: 'Extend',
    outcome: 'Field components resolve through a four-tier registry, and layouts and views are replaced by key, so custom code overrides without forking.',
    agencyScenario:
      'A client wants a custom status badge on one field, without touching the fields Martis already ships everywhere else.',
    docsHref: '/docs/customization/overrides',
    mediaId: 'tool-system-status',
    code: {
      language: 'tsx',
      filename: 'resources/js/martis-extensions/index.ts',
      // Adapted from docs/overrides.md ("Per-Resource Override") at v1.39.1.
      source: `import { componentRegistry } from '@martis/runtime'
import { StatusBadgeDisplay } from './components/StatusBadge'

// Only the "status" field in the "posts" resource uses StatusBadgeDisplay.
componentRegistry.registerResourceFieldDisplay('posts', 'status', StatusBadgeDisplay)`,
    },
    prerequisite: 'Custom field components are consumer React/TypeScript code, built with the consuming app\'s own Node and Vite toolchain.',
  },
  {
    id: 'ship',
    title: 'Ship',
    outcome: 'One Artisan command installs config, migrations, translations and precompiled assets into an existing app.',
    agencyScenario:
      'A repeatable delivery starts the same way on every client project: a single install command, then a working admin login.',
    docsHref: '/docs/getting-started/installation',
    mediaId: 'login',
    code: {
      language: 'bash',
      filename: 'terminal',
      // Adapted from docs/installation-guide.md ("Quick Install") at v1.39.1.
      source: `composer require martis/martis
php artisan martis:install
php artisan martis:user`,
    },
    prerequisite: `Requires ${formatPhpRequirement(RELEASE.phpRequirement)} and an existing ${formatLaravelRequirement(RELEASE.laravelRequirement)} application; the panel ships precompiled assets, so no Node toolchain is needed unless you build custom extensions.`,
  },
]
